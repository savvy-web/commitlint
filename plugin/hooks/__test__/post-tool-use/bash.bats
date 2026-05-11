#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)/post-tool-use/bash.sh"
  CLAUDE_PLUGIN_ROOT="$(cd "${BATS_TEST_DIRNAME}/../../.." && pwd)"
  export CLAUDE_PLUGIN_ROOT
  COMMITLINT_HOOK_ERROR_LOG="${BATS_TMPDIR}/commitlint-test-errors.log"
  export COMMITLINT_HOOK_ERROR_LOG
  : > "$COMMITLINT_HOOK_ERROR_LOG"
}

@test "exits silently with empty command" {
  out=$(echo '{"tool_name":"Bash","tool_input":{}}' | bash "$HOOK" || true)
  [ -z "$out" ]
}

@test "exits silently when interrupted" {
  envelope='{"tool_name":"Bash","tool_input":{"command":"git commit -m x"},"tool_response":{"interrupted":true}}'
  out=$(echo "$envelope" | bash "$HOOK" || true)
  [ -z "$out" ]
}

@test "exits silently for non-commit-related command" {
  envelope='{"tool_name":"Bash","tool_input":{"command":"ls -la"},"tool_response":{"interrupted":false}}'
  out=$(echo "$envelope" | bash "$HOOK" || true)
  [ -z "$out" ]
}
