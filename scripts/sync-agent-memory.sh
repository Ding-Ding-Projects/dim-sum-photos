#!/usr/bin/env bash

set -euo pipefail

PROGRAM_NAME=${0##*/}
BEGIN_MARKER='<!-- codingmachineedge/agent-global-memory:begin -->'
END_MARKER='<!-- codingmachineedge/agent-global-memory:end -->'
OWNERSHIP_MARKER='.codingmachineedge-agent-global-memory'
CANONICAL_REPO_URL='https://github.com/Ding-Ding-Projects/agent-global-memory'
LEGACY_CANONICAL_REPO_URL='https://github.com/codingmachineedge/agent-global-memory'

ACTION=status
ACTION_SET=0
ASSUME_YES=0
DRY_RUN=0
HOME_OVERRIDE=${HOME:-}
TARGETS=()
SKILL_TARGETS=()

EXPECTED_BLOCK=
EXPECTED_SKILL=
ACTIVE_TMP=
ACTIVE_TMP_KIND=
PATH_CONFLICT_REASON=
RETAIN_SHARED_SKILL=0
RETAIN_SHARED_REASON=
PARTIAL_SHARED_OTHER=

usage() {
  cat <<EOF
Usage: $PROGRAM_NAME [status|install|uninstall] [options]

Synchronize the repository's shared instructions into agent-global files.
The same operation also synchronizes the repository's agent-global-memory skill
into Claude's skill directory and the shared ~/.agents skill directory.
Selecting claude includes the Claude skill copy; selecting codex or opencode
includes the single shared skill copy.

Options:
  --target TARGETS  all, claude, codex, or opencode. May be repeated or
                    comma-separated. Defaults to all.
  --home PATH       Override the home directory used for default target paths.
  --yes             Do not prompt before install or uninstall.
  --dry-run         Show changes without writing files or backups.
  -h, --help        Show this help.

Status values:
  current   The managed block or owned skill exactly matches its source.
  missing   No managed block or skill destination exists.
  drift     A valid managed block or owned skill differs from its source.
  conflict  The target is unsafe, malformed, duplicated, or not repository-owned.

Status exits 0 when every selected target is current, 1 for missing or drift,
and 2 for a conflict or operational error.
EOF
}

die() {
  printf '%s: error: %s\n' "$PROGRAM_NAME" "$*" >&2
  exit 2
}

cleanup() {
  if [[ -n ${ACTIVE_TMP:-} && -e ${ACTIVE_TMP:-} ]]; then
    if [[ ${ACTIVE_TMP_KIND:-} == dir && ${ACTIVE_TMP##*/} == .sync-agent-memory-skill.* ]]; then
      rm -rf -- "$ACTIVE_TMP" || true
    elif [[ ${ACTIVE_TMP_KIND:-} == file ]]; then
      rm -f -- "$ACTIVE_TMP" || true
    fi
  fi
  if [[ -n ${EXPECTED_BLOCK:-} && -e ${EXPECTED_BLOCK:-} ]]; then
    rm -f -- "$EXPECTED_BLOCK" || true
  fi
  if [[ -n ${EXPECTED_SKILL:-} && -d ${EXPECTED_SKILL:-} && ${EXPECTED_SKILL##*/} == sync-agent-memory-skill-expected.* ]]; then
    rm -rf -- "$EXPECTED_SKILL" || true
  fi
}

trap cleanup EXIT
trap 'exit 130' HUP INT TERM

contains_target() {
  local wanted=$1
  local item
  for item in "${TARGETS[@]}"; do
    [[ $item == "$wanted" ]] && return 0
  done
  return 1
}

append_target() {
  local target=$1
  if ! contains_target "$target"; then
    TARGETS+=("$target")
  fi
}

contains_skill_target() {
  local wanted=$1
  local item
  for item in "${SKILL_TARGETS[@]}"; do
    [[ $item == "$wanted" ]] && return 0
  done
  return 1
}

append_skill_target() {
  local target=$1
  if ! contains_skill_target "$target"; then
    SKILL_TARGETS+=("$target")
  fi
}

remove_skill_target() {
  local unwanted=$1
  local item
  local kept=()
  for item in "${SKILL_TARGETS[@]}"; do
    [[ $item == "$unwanted" ]] || kept+=("$item")
  done
  SKILL_TARGETS=("${kept[@]}")
}

add_target_spec() {
  local spec=$1
  local part
  local parts=()

  [[ -n $spec ]] || die '--target requires a non-empty value'
  case ",$spec," in
    *,,*) die "invalid empty target in '$spec'" ;;
  esac

  IFS=',' read -r -a parts <<< "$spec"
  for part in "${parts[@]}"; do
    case $part in
      all)
        append_target claude
        append_target codex
        append_target opencode
        ;;
      claude|codex|opencode)
        append_target "$part"
        ;;
      *)
        die "unknown target '$part'"
        ;;
    esac
  done
}

while (($# > 0)); do
  case $1 in
    status|install|uninstall)
      ((ACTION_SET == 0)) || die "action specified more than once"
      ACTION=$1
      ACTION_SET=1
      shift
      ;;
    --target)
      (($# >= 2)) || die '--target requires a value'
      add_target_spec "$2"
      shift 2
      ;;
    --target=*)
      add_target_spec "${1#*=}"
      shift
      ;;
    --home)
      (($# >= 2)) || die '--home requires a path'
      [[ -n $2 ]] || die '--home requires a non-empty path'
      HOME_OVERRIDE=$2
      shift 2
      ;;
    --home=*)
      HOME_OVERRIDE=${1#*=}
      [[ -n $HOME_OVERRIDE ]] || die '--home requires a non-empty path'
      shift
      ;;
    --yes)
      ASSUME_YES=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      (($# == 0)) || die "unexpected argument '$1'"
      ;;
    -*)
      die "unknown option '$1'"
      ;;
    *)
      die "unexpected argument '$1'"
      ;;
  esac
done

if ((${#TARGETS[@]} == 0)); then
  add_target_spec all
fi

[[ -n $HOME_OVERRIDE ]] || die 'HOME is unset; provide --home PATH'

validate_root_path() {
  local label=$1
  local value=$2
  case $value in
    /*) ;;
    *) die "$label must be an absolute lexical path: $value" ;;
  esac
  case $value in
    */../*|*/..) die "$label must not contain a '..' path component: $value" ;;
  esac
}

validate_root_path '--home/HOME' "$HOME_OVERRIDE"
if [[ -n ${CLAUDE_CONFIG_DIR:-} ]]; then
  validate_root_path 'CLAUDE_CONFIG_DIR' "$CLAUDE_CONFIG_DIR"
fi
if [[ -n ${CODEX_HOME:-} ]]; then
  validate_root_path 'CODEX_HOME' "$CODEX_HOME"
fi
if [[ -n ${OPENCODE_CONFIG_DIR:-} ]]; then
  validate_root_path 'OPENCODE_CONFIG_DIR' "$OPENCODE_CONFIG_DIR"
fi
if [[ -n ${XDG_CONFIG_HOME:-} ]]; then
  validate_root_path 'XDG_CONFIG_HOME' "$XDG_CONFIG_HOME"
fi

if contains_target claude; then
  append_skill_target claude-skill
fi
if contains_target codex || contains_target opencode; then
  if [[ $ACTION != uninstall ]] || { contains_target codex && contains_target opencode; }; then
    append_skill_target shared-skill
  fi
fi

SOURCE=${BASH_SOURCE[0]}
while [[ -L $SOURCE ]]; do
  SOURCE_DIR=$(CDPATH= cd -P -- "$(dirname -- "$SOURCE")" && pwd)
  SOURCE=$(readlink -- "$SOURCE")
  [[ $SOURCE == /* ]] || SOURCE=$SOURCE_DIR/$SOURCE
done
SCRIPT_DIR=$(CDPATH= cd -P -- "$(dirname -- "$SOURCE")" && pwd)
PAYLOAD_FILE=$SCRIPT_DIR/../memory/SHARED_INSTRUCTIONS.md
SKILL_SOURCE=$SCRIPT_DIR/../skills/agent-global-memory

target_path() {
  local name=$1
  case $name in
    claude)
      printf '%s/rules/codingmachineedge-agent-guidance.md\n' "${CLAUDE_CONFIG_DIR:-$HOME_OVERRIDE/.claude}"
      ;;
    codex)
      printf '%s/AGENTS.md\n' "${CODEX_HOME:-$HOME_OVERRIDE/.codex}"
      ;;
    opencode)
      if [[ -n ${OPENCODE_CONFIG_DIR:-} ]]; then
        printf '%s/AGENTS.md\n' "$OPENCODE_CONFIG_DIR"
      else
        printf '%s/opencode/AGENTS.md\n' "${XDG_CONFIG_HOME:-$HOME_OVERRIDE/.config}"
      fi
      ;;
    *)
      die "internal error: unsupported target '$name'"
      ;;
  esac
}

skill_target_path() {
  local name=$1
  case $name in
    claude-skill)
      printf '%s/skills/agent-global-memory\n' "${CLAUDE_CONFIG_DIR:-$HOME_OVERRIDE/.claude}"
      ;;
    shared-skill)
      printf '%s/.agents/skills/agent-global-memory\n' "$HOME_OVERRIDE"
      ;;
    *)
      die "internal error: unsupported skill target '$name'"
      ;;
  esac
}

check_destination_path() {
  local target=$1
  local relative component current
  local components=()
  local index last_index=-1

  PATH_CONFLICT_REASON=
  case $target in
    /*) ;;
    *)
      PATH_CONFLICT_REASON="destination is not an absolute lexical path: $target"
      return 1
      ;;
  esac
  case $target in
    */../*|*/..)
      PATH_CONFLICT_REASON="destination contains a '..' path component: $target"
      return 1
      ;;
  esac

  relative=${target#/}
  IFS='/' read -r -a components <<< "$relative"
  for ((index = 0; index < ${#components[@]}; index++)); do
    [[ -n ${components[index]} ]] && last_index=$index
  done
  ((last_index >= 0)) || {
    PATH_CONFLICT_REASON='destination may not be the filesystem root'
    return 1
  }

  current=
  for ((index = 0; index <= last_index; index++)); do
    component=${components[index]}
    [[ -n $component ]] || continue
    current=$current/$component
    if [[ -L $current ]]; then
      PATH_CONFLICT_REASON="destination path component is a symlink: $current"
      return 1
    fi
    if ((index < last_index)) && [[ -e $current && ! -d $current ]]; then
      PATH_CONFLICT_REASON="destination ancestor is not a directory: $current"
      return 1
    fi
  done
  return 0
}

assert_destination_path_safe() {
  local target=$1
  local operation=$2
  if ! check_destination_path "$target"; then
    die "$operation refused: $PATH_CONFLICT_REASON"
  fi
}

make_expected_block() {
  local temp_root=${TMPDIR:-/tmp}
  local last_byte=

  [[ -f $PAYLOAD_FILE && -r $PAYLOAD_FILE ]] || die "canonical payload is missing or unreadable: $PAYLOAD_FILE"
  if grep -F -q "$BEGIN_MARKER" "$PAYLOAD_FILE" || grep -F -q "$END_MARKER" "$PAYLOAD_FILE"; then
    die 'canonical payload contains a reserved managed-block marker'
  fi

  [[ -d $temp_root ]] || die "temporary directory does not exist: $temp_root"
  EXPECTED_BLOCK=$(mktemp "$temp_root/sync-agent-memory.XXXXXX") || die 'could not create a temporary file'
  {
    printf '%s\n' "$BEGIN_MARKER"
    cat -- "$PAYLOAD_FILE"
    if [[ -s $PAYLOAD_FILE ]]; then
      last_byte=$(tail -c 1 -- "$PAYLOAD_FILE" | od -An -tu1 | tr -d '[:space:]')
      [[ $last_byte == 10 ]] || printf '\n'
    fi
    printf '%s\n' "$END_MARKER"
  } > "$EXPECTED_BLOCK"
}

make_expected_skill() {
  local temp_root=${TMPDIR:-/tmp}
  local source_links expected_links

  [[ -d $SKILL_SOURCE && ! -L $SKILL_SOURCE ]] || die "canonical skill directory is missing or invalid: $SKILL_SOURCE"
  if ! source_links=$(find "$SKILL_SOURCE" -type l -print 2>/dev/null); then
    die "could not inspect canonical skill source for symlinks: $SKILL_SOURCE"
  fi
  [[ -z $source_links ]] || die "canonical skill source contains a symlink: ${source_links%%$'\n'*}"
  if [[ -e $SKILL_SOURCE/$OWNERSHIP_MARKER || -L $SKILL_SOURCE/$OWNERSHIP_MARKER ]]; then
    die "canonical skill source must not contain the destination ownership marker: $SKILL_SOURCE/$OWNERSHIP_MARKER"
  fi
  [[ -d $temp_root ]] || die "temporary directory does not exist: $temp_root"
  EXPECTED_SKILL=$(mktemp -d "$temp_root/sync-agent-memory-skill-expected.XXXXXX") || die 'could not create a skill comparison directory'
  if ! source_links=$(find "$SKILL_SOURCE" -type l -print 2>/dev/null); then
    die "could not recheck canonical skill source for symlinks: $SKILL_SOURCE"
  fi
  [[ -z $source_links ]] || die "canonical skill source contains a symlink: ${source_links%%$'\n'*}"
  cp -Rp -- "$SKILL_SOURCE/." "$EXPECTED_SKILL/"
  printf '%s\n' "$CANONICAL_REPO_URL" > "$EXPECTED_SKILL/$OWNERSHIP_MARKER"
  if ! expected_links=$(find "$EXPECTED_SKILL" -type l -print 2>/dev/null); then
    die 'could not inspect the staged skill copy for symlinks'
  fi
  [[ -z $expected_links ]] || die "staged skill copy contains a symlink: ${expected_links%%$'\n'*}"
}

detect_bom() {
  local target=$1
  local prefix
  BOM_KIND=
  if ! prefix=$(LC_ALL=C dd if="$target" bs=1 count=3 2>/dev/null | LC_ALL=C od -An -tx1 | LC_ALL=C tr -d '[:space:]'); then
    return 1
  fi
  case $prefix in
    efbbbf*) BOM_KIND='UTF-8 BOM' ;;
    fffe*) BOM_KIND='UTF-16LE BOM' ;;
    feff*) BOM_KIND='UTF-16BE BOM' ;;
  esac
  return 0
}

# inspect_target sets INSPECT_STATE, INSPECT_REASON, INSPECT_BEGIN, and INSPECT_END.
inspect_target() {
  local target=$1
  local metadata=
  local begin_occurrences begin_lines end_occurrences end_lines begin_line end_line
  local extracted=
  local count

  INSPECT_STATE=
  INSPECT_REASON=
  INSPECT_BEGIN=0
  INSPECT_END=0

  if ! check_destination_path "$target"; then
    INSPECT_STATE=conflict
    INSPECT_REASON=$PATH_CONFLICT_REASON
    return 0
  fi
  if [[ ! -e $target ]]; then
    INSPECT_STATE=missing
    return 0
  fi
  if [[ ! -f $target ]]; then
    INSPECT_STATE=conflict
    INSPECT_REASON='target exists but is not a regular file'
    return 0
  fi
  if [[ ! -r $target ]]; then
    INSPECT_STATE=conflict
    INSPECT_REASON='target is unreadable'
    return 0
  fi
  if ! detect_bom "$target"; then
    INSPECT_STATE=conflict
    INSPECT_REASON='could not inspect target byte-order mark'
    return 0
  fi
  if [[ -n $BOM_KIND ]]; then
    INSPECT_STATE=conflict
    INSPECT_REASON="target has a $BOM_KIND; refusing to rewrite BOM-encoded instructions"
    return 0
  fi

  if ! metadata=$(awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
    function occurrences(text, needle, total, position) {
      total = 0
      while ((position = index(text, needle)) > 0) {
        total++
        text = substr(text, position + length(needle))
      }
      return total
    }
    {
      begin_occurrences += occurrences($0, begin)
      end_occurrences += occurrences($0, end)
      line = $0
      sub(/\r$/, "", line)
      if (line == begin) {
        begin_lines++
        if (!begin_line) begin_line = NR
      }
      if (line == end) {
        end_lines++
        if (!end_line) end_line = NR
      }
    }
    END {
      print begin_occurrences + 0, begin_lines + 0, end_occurrences + 0,
            end_lines + 0, begin_line + 0, end_line + 0
    }
  ' "$target"); then
    INSPECT_STATE=conflict
    INSPECT_REASON='could not inspect target'
    return 0
  fi

  read -r begin_occurrences begin_lines end_occurrences end_lines begin_line end_line <<< "$metadata"
  if ((begin_occurrences == 0 && end_occurrences == 0)); then
    INSPECT_STATE=missing
    return 0
  fi
  if ((begin_occurrences != 1 || end_occurrences != 1 || begin_lines != 1 || end_lines != 1 || begin_line >= end_line)); then
    INSPECT_STATE=conflict
    INSPECT_REASON='managed-block markers are malformed or duplicated'
    return 0
  fi

  INSPECT_BEGIN=$begin_line
  INSPECT_END=$end_line
  count=$((end_line - begin_line + 1))
  extracted=$(mktemp "${TMPDIR:-/tmp}/sync-agent-memory.XXXXXX") || {
    INSPECT_STATE=conflict
    INSPECT_REASON='could not create a comparison file'
    return 0
  }
  if head -n "$end_line" -- "$target" | tail -n "$count" > "$extracted" && cmp -s -- "$EXPECTED_BLOCK" "$extracted"; then
    INSPECT_STATE=current
  else
    INSPECT_STATE=drift
  fi
  rm -f -- "$extracted"
}

inspect_skill() {
  local target=$1
  local marker=$target/$OWNERSHIP_MARKER
  local nested_links
  local owner

  INSPECT_STATE=
  INSPECT_REASON=
  INSPECT_BEGIN=0
  INSPECT_END=0

  if ! check_destination_path "$target"; then
    INSPECT_STATE=conflict
    INSPECT_REASON=$PATH_CONFLICT_REASON
    return 0
  fi
  if [[ ! -e $target ]]; then
    INSPECT_STATE=missing
    return 0
  fi
  if [[ ! -d $target ]]; then
    INSPECT_STATE=conflict
    INSPECT_REASON='skill destination exists but is not a directory'
    return 0
  fi
  if ! nested_links=$(find "$target" -type l -print 2>/dev/null); then
    INSPECT_STATE=conflict
    INSPECT_REASON='could not inspect skill destination for nested symlinks'
    return 0
  fi
  if [[ -n $nested_links ]]; then
    INSPECT_STATE=conflict
    INSPECT_REASON="skill destination contains a nested symlink: ${nested_links%%$'\n'*}"
    return 0
  fi
  if [[ -L $marker || ! -f $marker || ! -r $marker ]]; then
    INSPECT_STATE=conflict
    INSPECT_REASON='skill destination is not owned by this repository'
    return 0
  fi
  owner=$(tr -d '\r\n' < "$marker")
  if [[ $owner != "$CANONICAL_REPO_URL" && $owner != "$LEGACY_CANONICAL_REPO_URL" ]]; then
    INSPECT_STATE=conflict
    INSPECT_REASON='skill ownership marker has unexpected content'
    return 0
  fi

  if diff -qr -- "$EXPECTED_SKILL" "$target" >/dev/null 2>&1; then
    INSPECT_STATE=current
  else
    INSPECT_STATE=drift
  fi
}

print_status() {
  local name=$1
  local target=$2
  if [[ -n $INSPECT_REASON ]]; then
    printf '%s: %s - %s (%s)\n' "$name" "$INSPECT_STATE" "$target" "$INSPECT_REASON"
  else
    printf '%s: %s - %s\n' "$name" "$INSPECT_STATE" "$target"
  fi
}

next_backup_path() {
  local target=$1
  local stamp suffix
  assert_destination_path_safe "$target" 'backup'
  stamp=$(date -u '+%Y%m%dT%H%M%SZ')
  BACKUP_PATH=$target.bak.$stamp
  suffix=0
  while [[ -e $BACKUP_PATH || -L $BACKUP_PATH ]]; do
    ((suffix += 1))
    BACKUP_PATH=$target.bak.$stamp.$suffix
  done
  assert_destination_path_safe "$BACKUP_PATH" 'backup'
}

backup_target() {
  local target=$1
  next_backup_path "$target"
  assert_destination_path_safe "$target" 'backup'
  assert_destination_path_safe "$BACKUP_PATH" 'backup'
  cp -p -- "$target" "$BACKUP_PATH"
  printf 'backup: %s\n' "$BACKUP_PATH"
}

prepare_atomic_temp() {
  local target=$1
  local parent
  parent=$(dirname -- "$target")
  assert_destination_path_safe "$target" 'temporary-file creation'
  mkdir -p -- "$parent"
  assert_destination_path_safe "$target" 'temporary-file creation'
  ACTIVE_TMP=$(mktemp "$parent/.sync-agent-memory.XXXXXX") || die "could not create an atomic temporary file in $parent"
  ACTIVE_TMP_KIND=file
  if [[ -e $target ]]; then
    cp -p -- "$target" "$ACTIVE_TMP"
    : > "$ACTIVE_TMP"
  fi
}

commit_atomic_temp() {
  local target=$1
  assert_destination_path_safe "$target" 'atomic file update'
  inspect_target "$target"
  [[ $INSPECT_STATE != conflict ]] || die "target became conflicted before backup/move: $target ($INSPECT_REASON)"
  if [[ -e $target ]]; then
    [[ ! -L $target && -f $target ]] || die "target changed type during update: $target"
    backup_target "$target"
  fi
  assert_destination_path_safe "$target" 'atomic file move'
  mv -f -- "$ACTIVE_TMP" "$target"
  ACTIVE_TMP=
  ACTIVE_TMP_KIND=
}

install_target() {
  local name=$1
  local target=$2
  local state=$3
  local begin_line=$4
  local end_line=$5
  local before_lines

  case $state in
    current)
      printf '%s: unchanged - %s\n' "$name" "$target"
      return 0
      ;;
    missing)
      prepare_atomic_temp "$target"
      cat -- "$EXPECTED_BLOCK" > "$ACTIVE_TMP"
      if [[ -e $target ]]; then
        assert_destination_path_safe "$target" 'file read'
        cat -- "$target" >> "$ACTIVE_TMP"
      fi
      ;;
    drift)
      prepare_atomic_temp "$target"
      assert_destination_path_safe "$target" 'file read'
      before_lines=$((begin_line - 1))
      if ((before_lines > 0)); then
        head -n "$before_lines" -- "$target" >> "$ACTIVE_TMP"
      fi
      cat -- "$EXPECTED_BLOCK" >> "$ACTIVE_TMP"
      tail -n "+$((end_line + 1))" -- "$target" >> "$ACTIVE_TMP"
      ;;
    *)
      die "internal error: cannot install over state '$state'"
      ;;
  esac

  commit_atomic_temp "$target"
  printf '%s: installed - %s\n' "$name" "$target"
}

uninstall_target() {
  local name=$1
  local target=$2
  local state=$3
  local begin_line=$4
  local end_line=$5
  local before_lines

  if [[ $state == missing ]]; then
    printf '%s: unchanged - %s\n' "$name" "$target"
    return 0
  fi
  [[ $state == current || $state == drift ]] || die "internal error: cannot uninstall state '$state'"

  prepare_atomic_temp "$target"
  assert_destination_path_safe "$target" 'file read'
  before_lines=$((begin_line - 1))
  if ((before_lines > 0)); then
    head -n "$before_lines" -- "$target" >> "$ACTIVE_TMP"
  fi
  tail -n "+$((end_line + 1))" -- "$target" >> "$ACTIVE_TMP"
  commit_atomic_temp "$target"
  printf '%s: uninstalled - %s\n' "$name" "$target"
}

discard_active_skill_temp() {
  if [[ -n ${ACTIVE_TMP:-} && ${ACTIVE_TMP_KIND:-} == dir && -d $ACTIVE_TMP && ${ACTIVE_TMP##*/} == .sync-agent-memory-skill.* ]]; then
    rm -rf -- "$ACTIVE_TMP"
  fi
  ACTIVE_TMP=
  ACTIVE_TMP_KIND=
}

prepare_skill_temp() {
  local target=$1
  local parent
  local staged_links
  parent=$(dirname -- "$target")
  assert_destination_path_safe "$target" 'skill staging'
  mkdir -p -- "$parent"
  assert_destination_path_safe "$target" 'skill staging'
  ACTIVE_TMP=$(mktemp -d "$parent/.sync-agent-memory-skill.XXXXXX") || die "could not create an atomic skill directory in $parent"
  ACTIVE_TMP_KIND=dir
  if ! staged_links=$(find "$EXPECTED_SKILL" -type l -print 2>/dev/null); then
    die 'could not recheck staged skill for symlinks before copying'
  fi
  [[ -z $staged_links ]] || die "staged skill contains a symlink: ${staged_links%%$'\n'*}"
  cp -Rp -- "$EXPECTED_SKILL/." "$ACTIVE_TMP/"
}

install_skill() {
  local name=$1
  local target=$2
  local state=$3

  if [[ $state == current ]]; then
    printf '%s: unchanged - %s\n' "$name" "$target"
    return 0
  fi
  [[ $state == missing || $state == drift ]] || die "internal error: cannot install skill over state '$state'"

  prepare_skill_temp "$target"
  inspect_skill "$target"
  case $INSPECT_STATE in
    current)
      discard_active_skill_temp
      printf '%s: unchanged - %s\n' "$name" "$target"
      return 0
      ;;
    missing)
      assert_destination_path_safe "$target" 'skill install move'
      [[ ! -e $target && ! -L $target ]] || die "skill destination appeared during install: $target"
      if mv -- "$ACTIVE_TMP" "$target"; then
        ACTIVE_TMP=
        ACTIVE_TMP_KIND=
        printf '%s: installed - %s\n' "$name" "$target"
        return 0
      fi
      die "could not atomically install skill at $target"
      ;;
    drift)
      next_backup_path "$target"
      inspect_skill "$target"
      [[ $INSPECT_STATE == current || $INSPECT_STATE == drift ]] || die "owned skill became unsafe before backup: $target ($INSPECT_REASON)"
      assert_destination_path_safe "$target" 'skill backup move'
      assert_destination_path_safe "$BACKUP_PATH" 'skill backup move'
      mv -- "$target" "$BACKUP_PATH" || die "could not back up stale owned skill at $target"
      printf 'backup: %s\n' "$BACKUP_PATH"
      assert_destination_path_safe "$target" 'skill replacement move'
      if mv -- "$ACTIVE_TMP" "$target"; then
        ACTIVE_TMP=
        ACTIVE_TMP_KIND=
        printf '%s: installed - %s\n' "$name" "$target"
        return 0
      fi
      if [[ ! -e $target && ! -L $target ]]; then
        assert_destination_path_safe "$BACKUP_PATH" 'skill rollback move'
        assert_destination_path_safe "$target" 'skill rollback move'
        mv -- "$BACKUP_PATH" "$target" || true
      fi
      die "could not atomically replace skill at $target"
      ;;
    conflict)
      die "skill destination became conflicted after preflight: $target ($INSPECT_REASON)"
      ;;
    *)
      die "internal error: unknown skill state '$INSPECT_STATE'"
      ;;
  esac
}

uninstall_skill() {
  local name=$1
  local target=$2
  local state=$3

  if [[ $state == missing ]]; then
    printf '%s: unchanged - %s\n' "$name" "$target"
    return 0
  fi
  [[ $state == current || $state == drift ]] || die "internal error: cannot uninstall skill state '$state'"

  inspect_skill "$target"
  case $INSPECT_STATE in
    missing)
      printf '%s: unchanged - %s\n' "$name" "$target"
      ;;
    current|drift)
      next_backup_path "$target"
      inspect_skill "$target"
      [[ $INSPECT_STATE == current || $INSPECT_STATE == drift ]] || die "owned skill became unsafe before uninstall: $target ($INSPECT_REASON)"
      assert_destination_path_safe "$target" 'skill uninstall move'
      assert_destination_path_safe "$BACKUP_PATH" 'skill uninstall move'
      mv -- "$target" "$BACKUP_PATH" || die "could not back up and remove owned skill at $target"
      printf 'backup: %s\n' "$BACKUP_PATH"
      printf '%s: uninstalled - %s\n' "$name" "$target"
      ;;
    conflict)
      die "skill destination became conflicted after preflight: $target ($INSPECT_REASON)"
      ;;
    *)
      die "internal error: unknown skill state '$INSPECT_STATE'"
      ;;
  esac
}

confirm_mutation() {
  local changes=$1
  local reply
  ((changes > 0)) || return 0
  ((DRY_RUN == 0)) || return 0
  ((ASSUME_YES == 0)) || return 0

  if [[ -t 0 ]]; then
    printf '%s %d target(s)? [y/N] ' "$ACTION" "$changes" >&2
    IFS= read -r reply || reply=
    case $reply in
      y|Y|yes|YES|Yes) return 0 ;;
      *) printf 'Cancelled.\n' >&2; exit 1 ;;
    esac
  fi
  die "$ACTION would modify $changes target(s); rerun with --yes"
}

configure_partial_shared_uninstall() {
  local other_name other_path

  [[ $ACTION == uninstall ]] || return 0
  if contains_target codex && ! contains_target opencode; then
    other_name=opencode
  elif contains_target opencode && ! contains_target codex; then
    other_name=codex
  else
    return 0
  fi

  remove_skill_target shared-skill
  RETAIN_SHARED_SKILL=0
  RETAIN_SHARED_REASON=
  PARTIAL_SHARED_OTHER=$other_name
  other_path=$(target_path "$other_name")
  inspect_target "$other_path"
  if [[ $INSPECT_STATE == missing ]]; then
    append_skill_target shared-skill
  else
    RETAIN_SHARED_SKILL=1
    RETAIN_SHARED_REASON="$other_name guidance is $INSPECT_STATE"
  fi
}

recheck_all_destinations() {
  local name path
  for name in "${TARGETS[@]}"; do
    path=$(target_path "$name")
    inspect_target "$path"
    [[ $INSPECT_STATE != conflict ]] || die "target became conflicted before mutation: $path ($INSPECT_REASON)"
  done
  for name in "${SKILL_TARGETS[@]}"; do
    path=$(skill_target_path "$name")
    inspect_skill "$path"
    [[ $INSPECT_STATE != conflict ]] || die "skill destination became conflicted before mutation: $path ($INSPECT_REASON)"
  done
}

make_expected_block
make_expected_skill
configure_partial_shared_uninstall

overall_status=0
conflicts=0
changes=0

# Preflight every selected target so a conflict prevents all writes.
for name in "${TARGETS[@]}"; do
  path=$(target_path "$name")
  inspect_target "$path"
  print_status "$name" "$path"
  case $INSPECT_STATE in
    current)
      [[ $ACTION == uninstall ]] && ((changes += 1))
      ;;
    missing)
      [[ $ACTION == install ]] && ((changes += 1))
      ((overall_status < 1)) && overall_status=1
      ;;
    drift)
      ((changes += 1))
      ((overall_status < 1)) && overall_status=1
      ;;
    conflict)
      ((conflicts += 1))
      overall_status=2
      ;;
    *)
      die "internal error: unknown inspection state '$INSPECT_STATE'"
      ;;
  esac
done

for name in "${SKILL_TARGETS[@]}"; do
  path=$(skill_target_path "$name")
  inspect_skill "$path"
  print_status "$name" "$path"
  case $INSPECT_STATE in
    current)
      [[ $ACTION == uninstall ]] && ((changes += 1))
      ;;
    missing)
      [[ $ACTION == install ]] && ((changes += 1))
      ((overall_status < 1)) && overall_status=1
      ;;
    drift)
      ((changes += 1))
      ((overall_status < 1)) && overall_status=1
      ;;
    conflict)
      ((conflicts += 1))
      overall_status=2
      ;;
    *)
      die "internal error: unknown skill inspection state '$INSPECT_STATE'"
      ;;
  esac
done

if ((RETAIN_SHARED_SKILL == 1)); then
  path=$(skill_target_path shared-skill)
  printf 'shared-skill: retained - %s (%s)\n' "$path" "$RETAIN_SHARED_REASON"
fi

if [[ $ACTION == status ]]; then
  exit "$overall_status"
fi

((conflicts == 0)) || die 'refusing to modify any target because the preflight found a conflict'

if ((DRY_RUN == 1)); then
  if ((changes == 0)); then
    printf 'dry-run: no changes\n'
  else
    printf 'dry-run: %s would change %d target(s)\n' "$ACTION" "$changes"
  fi
  exit 0
fi

confirm_mutation "$changes"
configure_partial_shared_uninstall
recheck_all_destinations

for name in "${TARGETS[@]}"; do
  path=$(target_path "$name")
  inspect_target "$path"
  [[ $INSPECT_STATE != conflict ]] || die "target became conflicted after preflight: $path ($INSPECT_REASON)"
  if [[ $ACTION == install ]]; then
    install_target "$name" "$path" "$INSPECT_STATE" "$INSPECT_BEGIN" "$INSPECT_END"
  else
    uninstall_target "$name" "$path" "$INSPECT_STATE" "$INSPECT_BEGIN" "$INSPECT_END"
  fi
done

for name in "${SKILL_TARGETS[@]}"; do
  path=$(skill_target_path "$name")
  inspect_skill "$path"
  [[ $INSPECT_STATE != conflict ]] || die "skill destination became conflicted after preflight: $path ($INSPECT_REASON)"
  skill_state=$INSPECT_STATE
  if [[ $ACTION == install ]]; then
    install_skill "$name" "$path" "$skill_state"
  else
    if [[ $name == shared-skill && -n $PARTIAL_SHARED_OTHER ]]; then
      other_path=$(target_path "$PARTIAL_SHARED_OTHER")
      inspect_target "$other_path"
      if [[ $INSPECT_STATE != missing ]]; then
        printf 'shared-skill: retained - %s (%s guidance is %s)\n' "$path" "$PARTIAL_SHARED_OTHER" "$INSPECT_STATE"
        continue
      fi
    fi
    uninstall_skill "$name" "$path" "$skill_state"
  fi
done

exit 0
