#!/usr/bin/env bash
set -Eeuo pipefail

output_dir="${1:?usage: build-dim-sum-photo-archives.sh <output-dir>}"
max_bytes="${MAX_PHOTO_ARCHIVE_BYTES:-1500000000}"

if ! [[ "$max_bytes" =~ ^[0-9]+$ ]] || (( max_bytes < 1 )); then
  echo "MAX_PHOTO_ARCHIVE_BYTES must be a positive integer." >&2
  exit 1
fi
command -v zip >/dev/null || { echo 'zip is required.' >&2; exit 1; }
command -v unzip >/dev/null || { echo 'unzip is required.' >&2; exit 1; }

mkdir -p "$output_dir"
shopt -s nullglob
old_archives=("$output_dir"/dim-sum-photos-*.zip)
if (( ${#old_archives[@]} > 0 )); then
  rm -f -- "${old_archives[@]}"
fi

mapfile -d '' tracked_images < <(git ls-files -z -- 'dim-sum/images/*.png' | sort -z)
if (( ${#tracked_images[@]} == 0 )); then
  echo 'No tracked dim-sum PNGs were found.' >&2
  exit 1
fi

part_files=()
part_bytes=0
part_number=1

write_part() {
  local archive="$output_dir/dim-sum-photos-$(printf '%03d' "$part_number").zip"
  if (( ${#part_files[@]} == 0 )); then
    return
  fi
  zip -q -9 "$archive" "${part_files[@]}"
  unzip -tqq "$archive"
  local archive_bytes
  archive_bytes="$(stat -c '%s' "$archive")"
  if (( archive_bytes > max_bytes )); then
    echo "Photo archive exceeds the configured safety limit: $archive ($archive_bytes > $max_bytes)." >&2
    exit 1
  fi
  printf 'Created %s with %d photos (%d bytes uncompressed, %d bytes zipped).\n' \
    "$archive" "${#part_files[@]}" "$part_bytes" "$archive_bytes"
  part_files=()
  part_bytes=0
  (( part_number += 1 ))
}

for image_path in "${tracked_images[@]}"; do
  image_bytes="$(stat -c '%s' "$image_path")"
  if (( ${#part_files[@]} > 0 && part_bytes + image_bytes > max_bytes )); then
    write_part
  fi
  part_files+=("$image_path")
  (( part_bytes += image_bytes ))
done
write_part

expected="$output_dir/.expected-photos.txt"
actual="$output_dir/.actual-photos.txt"
unique="$output_dir/.unique-photos.txt"
git ls-files -- 'dim-sum/images/*.png' | sort > "$expected"
: > "$actual"
archives=("$output_dir"/dim-sum-photos-*.zip)
for archive in "${archives[@]}"; do
  while IFS= read -r entry; do
    if [[ "$entry" == dim-sum/images/*.png ]]; then
      printf '%s\n' "$entry" >> "$actual"
    fi
  done < <(unzip -Z1 "$archive")
done
sort -u "$actual" > "$unique"
if ! cmp -s "$expected" "$unique"; then
  echo 'Photo archive contents do not exactly match tracked dim-sum PNGs.' >&2
  diff -u "$expected" "$unique" >&2 || true
  exit 1
fi

rm -f -- "$expected" "$actual" "$unique"
printf 'Verified %d tracked photos across %d ZIP parts.\n' "${#tracked_images[@]}" "${#archives[@]}"
