---
"@savvy-web/commitlint": minor
---

Add managed section pattern to init command hook generation

The `savvy-commit init` command now uses BEGIN/END markers in the `.husky/commit-msg` hook, allowing users to add custom code above or below the managed block. Re-running `init` updates only the managed section, preserving user customizations. The CI environment check now wraps the managed block in an `if` guard instead of `exit 0`, so user-defined hooks outside the markers still execute in CI. The `check` command now reports managed section status (up-to-date, outdated, or not found).

Remove auto-detected scope restriction from silk preset

The silk preset no longer auto-detects workspace package names and enforces them as the only allowed commit scopes. Previously, scopes like `ci`, `deps`, or `docs` would be rejected unless explicitly added via `additionalScopes`. Scopes are now unrestricted by default; users can still provide explicit `scopes` or `additionalScopes` to enforce an allowlist.
