#!/usr/bin/env bash
set -euo pipefail
trap 'echo "ERROR: session-start.sh failed at line $LINENO (exit $?)" >&2; exit 1' ERR

if [ -z "${CLAUDE_PROJECT_DIR:-}" ]; then
  echo "ERROR: CLAUDE_PROJECT_DIR is not set" >&2
  exit 1
fi

cat > /dev/null

RUN=$(bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/run-cli.sh")
$RUN savvy-commit hook session-start
