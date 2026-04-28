#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/.." && pwd)/pre-tool-use-bash.sh"
  CLAUDE_PLUGIN_ROOT="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)"
  export CLAUDE_PLUGIN_ROOT
}

@test "auto-allows safe Bash command" {
  envelope='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"ls -la"}}'
  out=$(echo "$envelope" | bash "$HOOK")
  echo "$out" | jq -e '.hookSpecificOutput.permissionDecision == "allow"'
}

@test "exit 0 silently for unrelated, unsafe Bash command" {
  envelope='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"rm -rf foo"}}'
  out=$(echo "$envelope" | bash "$HOOK" || true)
  [ -z "$out" ]
}
