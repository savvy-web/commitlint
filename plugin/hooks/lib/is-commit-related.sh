#!/usr/bin/env bash
# Cheap heuristic: does the command look like one whose message we should
# inspect? Exit 0 if yes, 1 if no.
set -euo pipefail

CMD="${1:-}"
[ -z "$CMD" ] && exit 1

if echo "$CMD" | grep -qE '^[[:space:]]*git[[:space:]]+commit\b'; then exit 0; fi
if echo "$CMD" | grep -qE '^[[:space:]]*gh[[:space:]]+pr[[:space:]]+(create|edit)\b'; then exit 0; fi
exit 1
