#!/usr/bin/env bash
set -euo pipefail
ENVELOPE=$(cat)
COMMAND=$(echo "$ENVELOPE" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0

# Hot path - auto-allow safe commands.
if bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/match-safe-bash.sh" "$COMMAND"; then
  jq -n --arg cmd "$(echo "$COMMAND" | head -c 60)" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: ("auto-allowed safe Bash: " + $cmd)
    }
  }'
  exit 0
fi

# Cold path - pre-commit-message check via CLI.
if bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/is-commit-related.sh" "$COMMAND"; then
  RUN=$(bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/run-cli.sh")
  echo "$ENVELOPE" | $RUN savvy-commit hook pre-commit-message 2>/dev/null || true
  exit 0
fi

exit 0
