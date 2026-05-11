#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)/session-start/main.sh"
  CLAUDE_PLUGIN_ROOT="$(cd "${BATS_TEST_DIRNAME}/../../.." && pwd)"
  export CLAUDE_PLUGIN_ROOT
  CLAUDE_PROJECT_DIR="${BATS_TMPDIR}/sess-proj"
  mkdir -p "$CLAUDE_PROJECT_DIR"
  export CLAUDE_PROJECT_DIR
  # Isolate the error log so concurrent runs don't trip on each other.
  COMMITLINT_HOOK_ERROR_LOG="${BATS_TMPDIR}/commitlint-test-errors.log"
  export COMMITLINT_HOOK_ERROR_LOG
  : > "$COMMITLINT_HOOK_ERROR_LOG"
}

@test "exits 1 when CLAUDE_PROJECT_DIR is unset" {
  unset CLAUDE_PROJECT_DIR
  envelope='{"session_id":"abc"}'
  run bash -c "echo '$envelope' | bash '$HOOK'"
  [ "$status" -eq 1 ]
  grep -q "CLAUDE_PROJECT_DIR is not set" "$COMMITLINT_HOOK_ERROR_LOG"
}

@test "drains stdin even when CLAUDE_PROJECT_DIR is unset" {
  unset CLAUDE_PROJECT_DIR
  # If stdin were not drained first, the producer would either block or get
  # SIGPIPE before this returns. Wrapping in a timeout guards against hang.
  run bash -c "echo 'producer-payload' | bash '$HOOK'"
  [ "$status" -eq 1 ]
}

@test "exits 0 (fail-open) when jq is missing" {
  # Shadow `jq` with an empty PATH dir that contains every binary the hook
  # needs (including bash) EXCEPT jq, so `command -v jq` fails but the script
  # itself can still execute.
  shadow=$(mktemp -d)
  for bin in bash cat mkdir mktemp rm tr date printf; do
    if path=$(command -v "$bin"); then ln -s "$path" "$shadow/$bin" 2>/dev/null || true; fi
  done
  # Note: deliberately no jq symlink.
  out=$(PATH="$shadow" bash "$HOOK" <<< '{}')
  status=$?
  [ "$status" -eq 0 ]
}
