---
"@savvy-web/commitlint": major
---

## Breaking Changes

### Package Deprecation

The commitlint config factory has moved into the Silk Suite monorepo and now ships as a config-integration shim in `@savvy-web/silk`,
driven by the unified `savvy` CLI.

### Migration:

- Replace `@savvy-web/commitlint` with `@savvy-web/silk` in your devDependencies.
- Point `commitlint.config.ts` at the shim from `@savvy-web/silk/commitlint` instead of this package's factory.
- Replace the `savvy-commit` bin with `savvy commit` (and `savvy check` for setup validation); the per-tool init/check subcommands are gone.

This is the final release. No further fixes or security patches will be published.