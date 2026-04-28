#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/.." && pwd)/pre-tool-use-fs.sh"
  CLAUDE_PLUGIN_ROOT="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)"
  export CLAUDE_PLUGIN_ROOT
  CLAUDE_PROJECT_DIR="${BATS_TMPDIR}/proj"
  mkdir -p "$CLAUDE_PROJECT_DIR/.claude/cache"
  export CLAUDE_PROJECT_DIR
}

@test "allows Write to .claude/cache path" {
  envelope=$(jq -n --arg p "$CLAUDE_PROJECT_DIR/.claude/cache/issues.json" '{
    tool_name:"Write", tool_input:{file_path:$p, content:"x"}
  }')
  out=$(echo "$envelope" | bash "$HOOK")
  echo "$out" | jq -e '.hookSpecificOutput.permissionDecision == "allow"'
}

@test "does not allow Write to other paths" {
  envelope=$(jq -n --arg p "$CLAUDE_PROJECT_DIR/src/foo.ts" '{
    tool_name:"Write", tool_input:{file_path:$p, content:"x"}
  }')
  out=$(echo "$envelope" | bash "$HOOK" || true)
  [ -z "$out" ]
}
