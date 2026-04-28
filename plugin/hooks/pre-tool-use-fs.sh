#!/usr/bin/env bash
set -euo pipefail
ENVELOPE=$(cat)
TOOL=$(echo "$ENVELOPE" | jq -r '.tool_name // empty')
PATH_ARG=$(echo "$ENVELOPE" | jq -r '.tool_input.file_path // empty')
[ -z "$PATH_ARG" ] && exit 0

case "$PATH_ARG" in
  /*) ABS="$PATH_ARG" ;;
  *)  ABS="${CLAUDE_PROJECT_DIR}/${PATH_ARG}" ;;
esac

case "$ABS" in
  "${CLAUDE_PROJECT_DIR}/.claude/cache/"*)
    jq -n --arg t "$TOOL" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: ("auto-allowed plugin cache path: " + $t)
      }
    }'
    ;;
esac
exit 0
