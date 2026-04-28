#!/usr/bin/env bash
# Detect package manager and emit the runner prefix that should be used to
# invoke `savvy-commit`. Used by all bash hooks that need to call the CLI.
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PM="npm"

if [ -f "$ROOT/package.json" ]; then
  pm_field=$(jq -r '.packageManager // empty' "$ROOT/package.json" 2>/dev/null | cut -d'@' -f1 || true)
  if [ -n "$pm_field" ]; then PM="$pm_field"; fi
fi

if [ "$PM" = "npm" ]; then
  if   [ -f "$ROOT/pnpm-lock.yaml" ]; then PM="pnpm"
  elif [ -f "$ROOT/yarn.lock" ];      then PM="yarn"
  elif [ -f "$ROOT/bun.lock" ];       then PM="bun"
  fi
fi

case "$PM" in
  pnpm) echo "pnpm exec" ;;
  yarn) echo "yarn exec" ;;
  bun)  echo "bunx" ;;
  *)    echo "npx --no --" ;;
esac
