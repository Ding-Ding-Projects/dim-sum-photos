#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
SYNC_SCRIPT=$SCRIPT_DIR/sync-agent-memory.sh
TEMP_BASE=$(CDPATH= cd -P -- "${TMPDIR:-/tmp}" && pwd)
TEST_ROOT=$(mktemp -d "$TEMP_BASE/agent-global-memory-test.XXXXXX")

cleanup() {
  case $TEST_ROOT in
    "$TEMP_BASE"/agent-global-memory-test.*) rm -rf -- "$TEST_ROOT" ;;
    *) printf 'Refusing unsafe cleanup path: %s\n' "$TEST_ROOT" >&2 ;;
  esac
}
trap cleanup EXIT

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

run_expect() {
  local expected=$1
  shift
  local output actual
  set +e
  output=$(bash "$SYNC_SCRIPT" "$@" 2>&1)
  actual=$?
  set -e
  if ((actual != expected)); then
    printf '%s\n' "$output" >&2
    fail "expected exit $expected, got $actual for: $*"
  fi
  printf '%s\n' "$output"
}

backup_count() {
  local path=$1 parent base
  parent=$(dirname -- "$path")
  base=$(basename -- "$path")
  if [[ ! -d $parent ]]; then
    printf '0\n'
    return
  fi
  (
    local matches
    shopt -s nullglob
    matches=("$parent/$base.bak."*)
    printf '%s\n' "${#matches[@]}"
  )
}

replace_first_literal() {
  local path=$1 old=$2 new=$3
  local temp
  temp=$(mktemp "$(dirname -- "$path")/.test-edit.XXXXXX")
  if ! awk -v old="$old" -v new="$new" '
    !done {
      position = index($0, old)
      if (position) {
        $0 = substr($0, 1, position - 1) new substr($0, position + length(old))
        done = 1
      }
    }
    { print }
    END { if (!done) exit 3 }
  ' "$path" > "$temp"; then
    rm -f -- "$temp"
    fail "could not find replacement text in $path"
  fi
  mv -- "$temp" "$path"
}

set_case_roots() {
  local root=$1
  export CLAUDE_CONFIG_DIR=$root/claude-config
  export CODEX_HOME=$root/codex-home
  export OPENCODE_CONFIG_DIR=$root/opencode-config
  unset XDG_CONFIG_HOME
}

make_test_symlink() {
  local target=$1 link=$2
  local shell_path target_native link_native platform
  rm -f -- "$link"
  platform=$(uname -s)
  case $platform in
    MINGW*|MSYS*|CYGWIN*) ;;
    *)
      if ln -s "$target" "$link" 2>/dev/null && [[ -L $link ]]; then
        return 0
      fi
      rm -f -- "$link"
      ;;
  esac

  if command -v pwsh.exe >/dev/null 2>&1; then
    shell_path=$(command -v pwsh.exe)
  elif command -v powershell.exe >/dev/null 2>&1; then
    shell_path=$(command -v powershell.exe)
  else
    return 1
  fi
  command -v cygpath >/dev/null 2>&1 || return 1
  target_native=$(cygpath -w "$target")
  link_native=$(cygpath -w "$link")
  "$shell_path" -NoProfile -NonInteractive -Command "New-Item -ItemType SymbolicLink -Path '$link_native' -Target '$target_native' | Out-Null" >/dev/null 2>&1
  [[ -L $link ]]
}

test_invalid_roots() (
  local root=$TEST_ROOT/invalid-roots
  local output variable target
  mkdir -p "$root"
  unset CLAUDE_CONFIG_DIR CODEX_HOME OPENCODE_CONFIG_DIR XDG_CONFIG_HOME

  output=$(run_expect 2 status --home relative-home --target claude)
  [[ $output == *'absolute lexical path'* ]] || fail 'relative --home was not rejected'
  output=$(run_expect 2 status --home "$root/base/../ambiguous" --target claude)
  [[ $output == *"must not contain a '..'"* ]] || fail "--home containing '..' was not rejected"

  for variable in CLAUDE_CONFIG_DIR CODEX_HOME OPENCODE_CONFIG_DIR XDG_CONFIG_HOME; do
    unset CLAUDE_CONFIG_DIR CODEX_HOME OPENCODE_CONFIG_DIR XDG_CONFIG_HOME
    case $variable in
      CLAUDE_CONFIG_DIR) target=claude ;;
      CODEX_HOME) target=codex ;;
      OPENCODE_CONFIG_DIR|XDG_CONFIG_HOME) target=opencode ;;
    esac
    export "$variable=relative-root"
    output=$(run_expect 2 status --home "$root/home" --target "$target")
    [[ $output == *'absolute lexical path'* ]] || fail "relative $variable was not rejected"
  done
)

test_ancestor_symlinks() (
  local root=$TEST_ROOT/ancestor-symlinks
  local real link home output external

  mkdir -p "$root"
  real=$root/real-file-root
  link=$root/file-link
  mkdir -p "$real"
  make_test_symlink "$real" "$link" || fail 'could not create file-ancestor symlink fixture'
  set_case_roots "$root/file-case"
  export CODEX_HOME=$link/codex-home
  home=$root/file-home
  output=$(run_expect 2 install --home "$home" --target codex --yes)
  [[ $output == *'path component is a symlink'* ]] || fail 'file ancestor symlink was not reported'
  [[ ! -e $real/codex-home/AGENTS.md ]] || fail 'file ancestor symlink escaped the destination root'
  [[ ! -e $home/.agents/skills/agent-global-memory ]] || fail 'preflight conflict allowed a partial shared-skill write'

  home=$root/skill-home
  external=$root/external-skills
  mkdir -p "$home" "$external"
  make_test_symlink "$external" "$home/.agents" || fail 'could not create skill-ancestor symlink fixture'
  set_case_roots "$root/skill-case"
  output=$(run_expect 2 install --home "$home" --target codex --yes)
  [[ $output == *'path component is a symlink'* ]] || fail 'skill ancestor symlink was not reported'
  [[ ! -e $CODEX_HOME/AGENTS.md ]] || fail 'skill conflict allowed a partial guidance write'
  [[ ! -e $external/skills/agent-global-memory ]] || fail 'skill ancestor symlink escaped the destination root'
)

test_nested_skill_symlink() (
  local root=$TEST_ROOT/nested-skill-symlink
  local home shared outside output
  root=$TEST_ROOT/nested-skill-symlink
  home=$root/home
  set_case_roots "$root/config"
  run_expect 0 install --home "$home" --target codex --yes >/dev/null
  shared=$home/.agents/skills/agent-global-memory
  outside=$root/outside.txt
  printf 'outside stays unchanged\n' > "$outside"
  make_test_symlink "$outside" "$shared/nested-link" || fail 'could not create nested skill symlink fixture'
  replace_first_literal "$CODEX_HOME/AGENTS.md" 'GitHub folder' 'GitHub folder nested-symlink-drift'
  cp "$CODEX_HOME/AGENTS.md" "$root/codex-before-conflict"
  output=$(run_expect 2 install --home "$home" --target codex --yes)
  [[ $output == *'nested symlink'* ]] || fail 'nested skill symlink was not reported'
  cmp -s "$CODEX_HOME/AGENTS.md" "$root/codex-before-conflict" || fail 'nested skill conflict allowed partial guidance repair'
  grep -Fxq 'outside stays unchanged' "$outside" || fail 'nested skill symlink target was modified'
)

test_partial_uninstall_order() (
  local first=$1 other_state=$2
  local root=$TEST_ROOT/partial-$first-$other_state
  local home shared first_file other_file output second
  home=$root/home
  set_case_roots "$root/config"
  run_expect 0 install --home "$home" --target codex,opencode --yes >/dev/null
  shared=$home/.agents/skills/agent-global-memory
  if [[ $first == codex ]]; then
    first_file=$CODEX_HOME/AGENTS.md
    other_file=$OPENCODE_CONFIG_DIR/AGENTS.md
    second=opencode
  else
    first_file=$OPENCODE_CONFIG_DIR/AGENTS.md
    other_file=$CODEX_HOME/AGENTS.md
    second=codex
  fi
  if [[ $other_state == drift ]]; then
    replace_first_literal "$other_file" 'GitHub folder' 'GitHub folder partial-drift'
  fi
  output=$(run_expect 0 uninstall --home "$home" --target "$first" --yes)
  [[ $output == *'shared-skill: retained'* ]] || fail "shared skill was not reported retained after uninstalling $first"
  [[ -d $shared ]] || fail "shared skill was removed while $second guidance was $other_state"
  ! grep -Fq '<!-- codingmachineedge/agent-global-memory:begin -->' "$first_file" || fail "$first guidance survived partial uninstall"
  run_expect 0 uninstall --home "$home" --target "$second" --yes >/dev/null
  [[ ! -e $shared ]] || fail "shared skill survived after uninstalling both runtimes ($first first)"
)

test_partial_conflict_retention() (
  local root=$TEST_ROOT/partial-conflict
  local home shared output
  home=$root/home
  set_case_roots "$root/config"
  run_expect 0 install --home "$home" --target codex,opencode --yes >/dev/null
  shared=$home/.agents/skills/agent-global-memory
  printf '%s\n' '<!-- codingmachineedge/agent-global-memory:begin -->' >> "$OPENCODE_CONFIG_DIR/AGENTS.md"
  output=$(run_expect 0 uninstall --home "$home" --target codex --yes)
  [[ $output == *'opencode guidance is conflict'* ]] || fail 'conflicted other runtime did not retain shared skill'
  [[ -d $shared ]] || fail 'shared skill was removed while other runtime guidance conflicted'
)

test_empty_managed_roundtrip() (
  local root=$TEST_ROOT/empty-roundtrip
  local home target
  home=$root/home
  set_case_roots "$root/config"
  target=$CLAUDE_CONFIG_DIR/rules/codingmachineedge-agent-guidance.md
  run_expect 0 install --home "$home" --target claude --yes >/dev/null
  [[ -s $target ]] || fail 'managed-only install did not create guidance content'
  run_expect 0 uninstall --home "$home" --target claude --yes >/dev/null
  [[ -f $target && ! -s $target ]] || fail 'managed-only uninstall did not round-trip to an empty file'
)

test_bom_conflicts() (
  local root=$TEST_ROOT/bom-conflicts
  local kind bytes reason case_root home target snapshot output
  for kind in utf8 utf16le utf16be; do
    case $kind in
      utf8) bytes='\357\273\277plain text\n'; reason='UTF-8 BOM' ;;
      utf16le) bytes='\377\376x\000'; reason='UTF-16LE BOM' ;;
      utf16be) bytes='\376\377\000x'; reason='UTF-16BE BOM' ;;
    esac
    case_root=$root/$kind
    home=$case_root/home
    set_case_roots "$case_root/config"
    target=$CODEX_HOME/AGENTS.md
    mkdir -p "$(dirname -- "$target")"
    printf '%b' "$bytes" > "$target"
    snapshot=$case_root/original.bin
    cp "$target" "$snapshot"
    output=$(run_expect 2 status --home "$home" --target codex)
    [[ $output == *"$reason"* ]] || fail "$kind status did not explain its BOM conflict"
    output=$(run_expect 2 install --home "$home" --target codex --yes)
    [[ $output == *"$reason"* ]] || fail "$kind install did not explain its BOM conflict"
    run_expect 2 uninstall --home "$home" --target codex --yes >/dev/null
    cmp -s "$target" "$snapshot" || fail "$kind target changed despite BOM conflict"
    [[ $(backup_count "$target") == 0 ]] || fail "$kind conflict created a backup"
    [[ ! -e $home/.agents/skills/agent-global-memory ]] || fail "$kind conflict allowed a partial skill write"
  done
)

test_crlf_roundtrip() (
  local root=$TEST_ROOT/crlf-roundtrip
  local home target snapshot
  home=$root/home
  set_case_roots "$root/config"
  target=$CODEX_HOME/AGENTS.md
  mkdir -p "$(dirname -- "$target")"
  printf 'alpha\r\nbeta\r\n' > "$target"
  snapshot=$root/original-crlf
  cp "$target" "$snapshot"
  run_expect 0 install --home "$home" --target codex --yes >/dev/null
  run_expect 0 uninstall --home "$home" --target codex --yes >/dev/null
  cmp -s "$target" "$snapshot" || fail 'UTF-8 no-BOM CRLF content did not round-trip byte-for-byte'
)

export CLAUDE_CONFIG_DIR=$TEST_ROOT/claude-config
export CODEX_HOME=$TEST_ROOT/codex-home
export OPENCODE_CONFIG_DIR=$TEST_ROOT/opencode-config
unset XDG_CONFIG_HOME

CLAUDE_FILE=$CLAUDE_CONFIG_DIR/rules/codingmachineedge-agent-guidance.md
CODEX_FILE=$CODEX_HOME/AGENTS.md
OPENCODE_FILE=$OPENCODE_CONFIG_DIR/AGENTS.md
CLAUDE_SKILL=$CLAUDE_CONFIG_DIR/skills/agent-global-memory
OPEN_AGENT_SKILL=$TEST_ROOT/.agents/skills/agent-global-memory

mkdir -p "$(dirname -- "$CLAUDE_FILE")" "$(dirname -- "$CODEX_FILE")" "$(dirname -- "$OPENCODE_FILE")"
printf 'user claude line\n' > "$CLAUDE_FILE"
printf 'user codex line\n' > "$CODEX_FILE"
printf 'user opencode line\n' > "$OPENCODE_FILE"
cp "$CLAUDE_FILE" "$TEST_ROOT/original-claude"
cp "$CODEX_FILE" "$TEST_ROOT/original-codex"
cp "$OPENCODE_FILE" "$TEST_ROOT/original-opencode"

initial=$(run_expect 1 status --home "$TEST_ROOT")
[[ $initial == *'claude: missing'* ]] || fail 'initial Claude state should be missing'
[[ $initial == *'shared-skill: missing'* ]] || fail 'initial shared skill should be missing'

run_expect 0 install --home "$TEST_ROOT" --dry-run >/dev/null
[[ ! -e $CLAUDE_SKILL ]] || fail 'dry-run created a skill'
cmp -s "$CODEX_FILE" "$TEST_ROOT/original-codex" || fail 'dry-run edited guidance'

run_expect 0 install --home "$TEST_ROOT" --yes >/dev/null
for path in "$CLAUDE_FILE" "$CODEX_FILE" "$OPENCODE_FILE"; do
  [[ $(grep -Fxc '<!-- codingmachineedge/agent-global-memory:begin -->' "$path") == 1 ]] || fail "bad begin marker count: $path"
  [[ $(grep -Fxc '<!-- codingmachineedge/agent-global-memory:end -->' "$path") == 1 ]] || fail "bad end marker count: $path"
done
grep -Fq 'Every search bar must provide direct access to this full-featured builder' "$CODEX_FILE" || fail 'installed guidance is missing the full regex-builder search contract'
tail -n 1 "$CLAUDE_FILE" | grep -Fxq 'user claude line' || fail 'Claude content not preserved'
tail -n 1 "$CODEX_FILE" | grep -Fxq 'user codex line' || fail 'Codex content not preserved'
tail -n 1 "$OPENCODE_FILE" | grep -Fxq 'user opencode line' || fail 'OpenCode content not preserved'
[[ -f $CLAUDE_SKILL/SKILL.md ]] || fail 'Claude skill missing'
[[ -f $OPEN_AGENT_SKILL/SKILL.md ]] || fail 'shared skill missing'
grep -Fxq 'https://github.com/Ding-Ding-Projects/agent-global-memory' "$OPEN_AGENT_SKILL/.codingmachineedge-agent-global-memory" || fail 'skill marker mismatch'
run_expect 0 status --home "$TEST_ROOT" >/dev/null

printf '%s\n' 'https://github.com/codingmachineedge/agent-global-memory' > "$OPEN_AGENT_SKILL/.codingmachineedge-agent-global-memory"
legacy_status=$(run_expect 1 status --home "$TEST_ROOT")
grep -Fq 'shared-skill: drift' <<< "$legacy_status" || fail 'legacy canonical skill marker should be safely migratable'
run_expect 0 install --home "$TEST_ROOT" --yes >/dev/null
grep -Fxq 'https://github.com/Ding-Ding-Projects/agent-global-memory' "$OPEN_AGENT_SKILL/.codingmachineedge-agent-global-memory" || fail 'legacy skill marker did not migrate'

cp "$CODEX_FILE" "$TEST_ROOT/idempotent-codex"
before_backups=$(backup_count "$CODEX_FILE")
run_expect 0 install --home "$TEST_ROOT" --yes >/dev/null
cmp -s "$CODEX_FILE" "$TEST_ROOT/idempotent-codex" || fail 'repeat install changed content'
[[ $(backup_count "$CODEX_FILE") == "$before_backups" ]] || fail 'repeat install made a backup'

replace_first_literal "$CODEX_FILE" 'GitHub folder' 'GitHub folder drifted'
drift=$(run_expect 1 status --home "$TEST_ROOT")
[[ $drift == *'codex: drift'* ]] || fail 'managed edit did not report drift'
run_expect 0 install --home "$TEST_ROOT" --yes >/dev/null
(( $(backup_count "$CODEX_FILE") > before_backups )) || fail 'drift repair did not back up target'
run_expect 0 status --home "$TEST_ROOT" >/dev/null

cp "$OPENCODE_FILE" "$TEST_ROOT/clean-opencode"
cp "$CLAUDE_FILE" "$TEST_ROOT/clean-claude"
printf '<!-- codingmachineedge/agent-global-memory:begin -->\n' >> "$OPENCODE_FILE"
replace_first_literal "$CLAUDE_FILE" 'GitHub folder' 'GitHub folder preflight drift'
conflict=$(run_expect 2 install --home "$TEST_ROOT" --yes)
[[ $conflict == *'conflict'* ]] || fail 'duplicate marker did not conflict'
grep -Fq 'preflight drift' "$CLAUDE_FILE" || fail 'preflight conflict did not prevent other writes'
cp "$TEST_ROOT/clean-opencode" "$OPENCODE_FILE"
run_expect 0 install --home "$TEST_ROOT" --yes >/dev/null

mkdir -p "$TEST_ROOT/owned-skill-hold"
mv "$OPEN_AGENT_SKILL" "$TEST_ROOT/owned-skill-hold/"
mkdir -p "$OPEN_AGENT_SKILL"
printf 'unowned\n' > "$OPEN_AGENT_SKILL/SKILL.md"
skill_conflict=$(run_expect 2 status --home "$TEST_ROOT" --target codex)
[[ $skill_conflict == *'not owned'* ]] || fail 'unowned skill directory did not conflict'
rm -rf -- "$OPEN_AGENT_SKILL"
mv "$TEST_ROOT/owned-skill-hold/agent-global-memory" "$OPEN_AGENT_SKILL"
rmdir "$TEST_ROOT/owned-skill-hold"
run_expect 0 status --home "$TEST_ROOT" >/dev/null

run_expect 0 uninstall --home "$TEST_ROOT" --yes >/dev/null
cmp -s "$CLAUDE_FILE" "$TEST_ROOT/original-claude" || fail 'Claude uninstall did not round-trip'
cmp -s "$CODEX_FILE" "$TEST_ROOT/original-codex" || fail 'Codex uninstall did not round-trip'
cmp -s "$OPENCODE_FILE" "$TEST_ROOT/original-opencode" || fail 'OpenCode uninstall did not round-trip'
[[ ! -e $CLAUDE_SKILL ]] || fail 'Claude skill active path survived uninstall'
[[ ! -e $OPEN_AGENT_SKILL ]] || fail 'shared skill active path survived uninstall'
run_expect 1 status --home "$TEST_ROOT" >/dev/null

test_invalid_roots
test_ancestor_symlinks
test_nested_skill_symlink
test_partial_uninstall_order codex current
test_partial_uninstall_order opencode drift
test_partial_conflict_retention
test_empty_managed_roundtrip
test_bom_conflicts
test_crlf_roundtrip

printf 'PASS: Bash sync behavior\n'
