#!/usr/bin/env bash
# Exit 0 if the command matches a pattern in safe-bash-patterns.txt; 1 otherwise.
# Excludes always-dangerous commands first (rm, curl, force push, install, npx).
set -euo pipefail

CMD="${1:-}"
[ -z "$CMD" ] && exit 1

# Hard exclusions — always require user approval.
if echo "$CMD" | grep -qE '^[[:space:]]*(rm|mv|cp|chmod|chown|curl|wget)(\b|$)'; then exit 1; fi
if echo "$CMD" | grep -qE 'git[[:space:]]+push[[:space:]]+(.*)(--force|-f)'; then exit 1; fi
if echo "$CMD" | grep -qE 'git[[:space:]]+reset[[:space:]]+--hard\b'; then exit 1; fi
if echo "$CMD" | grep -qE '^[[:space:]]*pnpm[[:space:]]+(install|add|remove|update|dlx)(\b|$)'; then exit 1; fi
if echo "$CMD" | grep -qE '^[[:space:]]*(npm|yarn|bun)[[:space:]]+(install|add|remove|update)(\b|$)'; then exit 1; fi
if echo "$CMD" | grep -qE '^[[:space:]]*(npx|bunx|yarn[[:space:]]+dlx)(\b|$)'; then exit 1; fi
if echo "$CMD" | grep -qE 'gh[[:space:]]+(repo[[:space:]]+delete|secret\b)'; then exit 1; fi

PATTERNS="${BASH_SOURCE%/*}/safe-bash-patterns.txt"
# grep -E reads patterns from a file; -f tells it to use that file. Skip comments + blanks.
grep -vE '^[[:space:]]*(#|$)' "$PATTERNS" > /tmp/savvy-bash-patterns.$$ 2>/dev/null
trap 'rm -f /tmp/savvy-bash-patterns.$$' EXIT
if echo "$CMD" | grep -qE -f /tmp/savvy-bash-patterns.$$; then exit 0; fi
exit 1
