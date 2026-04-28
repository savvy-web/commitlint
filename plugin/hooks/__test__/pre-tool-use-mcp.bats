#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/.." && pwd)/pre-tool-use-mcp.sh"
  CLAUDE_PLUGIN_ROOT="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)"
  export CLAUDE_PLUGIN_ROOT
}

@test "allows mcp__github__list_issues (unscoped)" {
  out=$(echo '{"tool_name":"mcp__github__list_issues"}' | bash "$HOOK")
  echo "$out" | jq -e '.hookSpecificOutput.permissionDecision == "allow"'
}

@test "allows mcp__github-acme__list_issues (scoped)" {
  out=$(echo '{"tool_name":"mcp__github-acme__list_issues"}' | bash "$HOOK")
  echo "$out" | jq -e '.hookSpecificOutput.permissionDecision == "allow"'
}

@test "allows mcp__gk__git_status" {
  out=$(echo '{"tool_name":"mcp__gk__git_status"}' | bash "$HOOK")
  echo "$out" | jq -e '.hookSpecificOutput.permissionDecision == "allow"'
}

@test "does not allow mcp__github__merge_pull_request" {
  out=$(echo '{"tool_name":"mcp__github__merge_pull_request"}' | bash "$HOOK" || true)
  [ -z "$out" ]
}

@test "does not allow mcp__other__anything" {
  out=$(echo '{"tool_name":"mcp__other__list"}' | bash "$HOOK" || true)
  [ -z "$out" ]
}
