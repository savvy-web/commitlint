# @savvy-web/commitlint

## 0.3.3

### Patch Changes

- e4524ff: ## Features
  - Support for @savvy-web/changesets
- 00dffc2: ## Dependencies
  - @savvy-web/rslib-builder: ^0.12.1 → ^0.12.2
- 5a32404: ## Dependencies
  - @savvy-web/rslib-builder: ^0.12.2 → ^0.14.1

## 0.3.2

### Patch Changes

- 71ddb1a: Update dependencies:

  **Dependencies:**
  - @savvy-web/lint-staged: ^0.3.1 → ^0.4.0
  - @savvy-web/rslib-builder: ^0.12.0 → ^0.12.1

## 0.3.1

### Patch Changes

- d106029: Update dependencies:

  **Dependencies:**
  - @savvy-web/lint-staged: ^0.2.2 → ^0.3.1

## 0.3.0

### Minor Changes

- fd8af78: Add managed section pattern to init command hook generation

  The `savvy-commit init` command now uses BEGIN/END markers in the `.husky/commit-msg` hook, allowing users to add custom code above or below the managed block. Re-running `init` updates only the managed section, preserving user customizations. The CI environment check now wraps the managed block in an `if` guard instead of `exit 0`, so user-defined hooks outside the markers still execute in CI. The `check` command now reports managed section status (up-to-date, outdated, or not found).

  Remove auto-detected scope restriction from silk preset

  The silk preset no longer auto-detects workspace package names and enforces them as the only allowed commit scopes. Previously, scopes like `ci`, `deps`, or `docs` would be rejected unless explicitly added via `additionalScopes`. Scopes are now unrestricted by default; users can still provide explicit `scopes` or `additionalScopes` to enforce an allowlist.

## 0.2.1

### Patch Changes

- e00fd8f: Switches to managed dependecies with @savvy-web/pnpm-plugin-silk

## 0.2.0

### Minor Changes

- 92cd2f7: Add interactive commit prompt with commitizen adapter
  - Add built-in commitizen adapter at `@savvy-web/commitlint/prompt` with `prompter` function
  - Use Unicode emojis for terminal display (🤖, ✨, 🐛, etc.)
  - Allow simple unordered lists (`-` and `*`) in commit bodies while still rejecting other markdown
  - Include full prompt configuration in `CommitlintConfig.silk()` output
  - Remove `@commitlint/cz-commitlint` dependency (users can install separately if preferred)

## 0.1.2

### Patch Changes

- 6d18e93: Update husky commit-msg hook template for modern Husky compatibility
  - Remove deprecated `dirname` sourcing (no longer needed in Husky v9+)
  - Add CI environment skip for GitHub Actions
  - Use `git rev-parse --show-toplevel` for reliable repo root detection
  - Update all file path checks to use absolute paths from repo root
  - Fix bun lockfile detection (`bun.lock` instead of `bun.lockb`)
  - Add explicit config path to commitlint command

## 0.1.1

### Patch Changes

- 66f5591: Fix missing type exports and hoist markdownlint-cli2 peer dependencies for CI compatibility

## 0.1.0

### Minor Changes

- 907c2bc: Initial implementation of dynamic commitlint configuration with auto-detection of DCO requirements, workspace scopes, and versioning strategies.
