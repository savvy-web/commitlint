#!/usr/bin/env bash
set -euo pipefail
ENVELOPE=$(cat)
TOOL=$(echo "$ENVELOPE" | jq -r '.tool_name // empty')
[ -z "$TOOL" ] && exit 0

case "$TOOL" in
  mcp__gk__*)        OP="${TOOL#mcp__gk__}" ;          SERVER="gk" ;;
  mcp__github__*)    OP="${TOOL#mcp__github__}" ;      SERVER="github" ;;
  mcp__github-*__*)  REST="${TOOL#mcp__github-}"
                     OP="${REST#*__}" ;                 SERVER="github" ;;
  *) exit 0 ;;
esac

ALLOW="${CLAUDE_PLUGIN_ROOT}/hooks/lib/safe-mcp-${SERVER}-ops.txt"
if [ ! -f "$ALLOW" ]; then exit 0; fi

# Strip comments/blanks and grep for exact match.
if grep -vE '^[[:space:]]*(#|$)' "$ALLOW" | grep -Fxq "$OP"; then
  jq -n --arg t "$TOOL" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: ("auto-allowed MCP tool: " + $t)
    }
  }'
fi
exit 0
