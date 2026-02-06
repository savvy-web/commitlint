---
"@savvy-web/commitlint": minor
---

Add managed section pattern to init command hook generation

The `savvy-commit init` command now uses BEGIN/END markers in the `.husky/commit-msg` hook, allowing users to add custom code above or below the managed block. Re-running `init` updates only the managed section, preserving user customizations. The CI environment check now wraps the managed block in an `if` guard instead of `exit 0`, so user-defined hooks outside the markers still execute in CI. The `check` command now reports managed section status (up-to-date, outdated, or not found).
