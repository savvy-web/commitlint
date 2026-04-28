---
"@savvy-web/commitlint": patch
---

## Bug Fixes

- `savvy-commit init` now generates a husky `commit-msg` hook that runs commitlint via `pnpm exec` instead of `pnpm dlx`. The dlx form runs commitlint in an isolated package cache that cannot resolve workspace-local imports in `commitlint.config.ts` (e.g., `import { CommitlintConfig } from "@savvy-web/commitlint"`), causing every commit to fail with `Cannot find module '@savvy-web/commitlint'`. `pnpm exec` runs the locally installed binary so workspace package resolution works as expected. Other package managers (yarn, bun, npm) are unchanged.
