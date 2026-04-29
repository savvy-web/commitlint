---
"@savvy-web/commitlint": patch
---

## Bug Fixes

- Fixed `post-commit-verify` hook failing on non-pnpm projects by detecting the consumer's package manager from `package.json#packageManager` and lockfile presence, then building the correct invocation (`pnpm exec`, `yarn exec`, `bunx`, or `npx --no --`).
- Fixed `post-commit-verify` hook ignoring custom commitlint config paths by reading the `--config` argument from the managed section of `.husky/commit-msg` (the source of truth written by `savvy-commit init`). Falls back to cosmiconfig auto-discovery when `.husky/commit-msg` is absent.
