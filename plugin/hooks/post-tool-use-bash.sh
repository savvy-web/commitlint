#!/usr/bin/env bash
set -euo pipefail
ENVELOPE=$(cat)
COMMAND=$(echo "$ENVELOPE" | jq -r '.tool_input.command // empty')
INTERRUPTED=$(echo "$ENVELOPE" | jq -r '.tool_response.interrupted // false')

[ -z "$COMMAND" ] && exit 0
[ "$INTERRUPTED" = "true" ] && exit 0

if ! bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/is-commit-related.sh" "$COMMAND"; then
  exit 0
fi

RUN=$(bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/run-cli.sh")
echo "$ENVELOPE" | $RUN savvy-commit hook post-commit-verify 2>/dev/null || true
exit 0
