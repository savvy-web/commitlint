#!/usr/bin/env bash
set -euo pipefail
ENVELOPE=$(cat)
PROMPT=$(echo "$ENVELOPE" | jq -r '.prompt // empty')
[ -z "$PROMPT" ] && exit 0

if echo "$PROMPT" | grep -iqE '(\bcommit\b|\bcommitting\b|\bship (it|this)\b|\bwrap (it )?up\b|\b(create|open) a (pr|pull request)\b|\bfinalize\b|/finalize\b|\bsquash\b|\bamend\b)'; then
  RUN=$(bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/run-cli.sh")
  echo "$ENVELOPE" | $RUN savvy-commit hook user-prompt-submit 2>/dev/null || true
fi
exit 0
