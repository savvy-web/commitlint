---
"@savvy-web/commitlint": patch
---

## Bug Fixes

Migrate Effect dependencies to `catalog:silk` for centralized version management via `@savvy-web/pnpm-plugin-silk`. Adds required transitive peer dependencies (`@effect/cluster`, `@effect/printer`, `@effect/printer-ansi`, `@effect/rpc`, `@effect/sql`). Closes #66.
