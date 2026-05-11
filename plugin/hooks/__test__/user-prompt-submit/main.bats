#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)/user-prompt-submit/main.sh"
  CLAUDE_PLUGIN_ROOT="$(cd "${BATS_TEST_DIRNAME}/../../.." && pwd)"
  export CLAUDE_PLUGIN_ROOT
  COMMITLINT_HOOK_ERROR_LOG="${BATS_TMPDIR}/commitlint-test-errors.log"
  export COMMITLINT_HOOK_ERROR_LOG
  : > "$COMMITLINT_HOOK_ERROR_LOG"
}

@test "exits silently for empty prompt" {
  out=$(echo '{"prompt":""}' | bash "$HOOK" || true)
  [ -z "$out" ]
}

@test "exits silently for unrelated prompt" {
  out=$(echo '{"prompt":"explain this code"}' | bash "$HOOK" || true)
  # The hook may invoke the CLI but the CLI is a real binary that produces no
  # output for non-commit prompts, so stdout should be empty.
  if [ -n "$out" ]; then
    decision=$(echo "$out" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null || true)
    [ -z "$decision" ]
  fi
}

@test "/finalize is recognized via word boundary" {
  # Smoke: the hook should attempt to invoke the CLI for /finalize and exit 0.
  envelope=$(jq -nc --arg p "please run /finalize now" '{prompt:$p}')
  out=$(printf '%s\n' "$envelope" | bash "$HOOK")
  status=$?
  [ "$status" -eq 0 ]
}
