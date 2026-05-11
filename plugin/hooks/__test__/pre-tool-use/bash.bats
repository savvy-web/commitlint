#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)/pre-tool-use/bash.sh"
  CLAUDE_PLUGIN_ROOT="$(cd "${BATS_TEST_DIRNAME}/../../.." && pwd)"
  export CLAUDE_PLUGIN_ROOT
}

@test "auto-allows safe Bash command" {
  envelope='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"ls -la"}}'
  out=$(echo "$envelope" | bash "$HOOK")
  echo "$out" | jq -e '.hookSpecificOutput.permissionDecision == "allow"'
}

@test "decision reason includes truncated command" {
  long_cmd=$(printf 'ls %0.s-la-foo-bar-baz ' {1..10})
  envelope=$(jq -n --arg c "$long_cmd" '{tool_name:"Bash", tool_input:{command:$c}}')
  out=$(echo "$envelope" | bash "$HOOK")
  reason=$(echo "$out" | jq -r '.hookSpecificOutput.permissionDecisionReason')
  # 60 chars truncation cap plus the static prefix.
  prefix_len=$(printf 'auto-allowed safe Bash: ' | wc -c | tr -d ' ')
  reason_len=$(printf '%s' "$reason" | wc -c | tr -d ' ')
  [ "$reason_len" -le $((prefix_len + 60)) ]
}

@test "exits silently for empty envelope" {
  out=$(echo '{}' | bash "$HOOK" || true)
  [ -z "$out" ]
}

@test "exits silently when command field is missing" {
  out=$(echo '{"tool_name":"Bash","tool_input":{}}' | bash "$HOOK" || true)
  [ -z "$out" ]
}

@test "exits silently for unsafe, non-commit Bash command (cold path no-op)" {
  envelope='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"rm -rf foo"}}'
  out=$(echo "$envelope" | bash "$HOOK" || true)
  [ -z "$out" ]
}

@test "compound command containing git commit does NOT auto-allow" {
  envelope='{"tool_name":"Bash","tool_input":{"command":"git status && git commit -m bypass"}}'
  out=$(echo "$envelope" | bash "$HOOK" 2>/dev/null || true)
  # Must NOT emit a hot-path allow. The cold path may invoke the CLI, which
  # produces its own envelope or no envelope; either way, no `"allow"` here.
  if [ -n "$out" ]; then
    decision=$(echo "$out" | jq -r '.hookSpecificOutput.permissionDecision // empty')
    [ "$decision" != "allow" ]
  fi
}
