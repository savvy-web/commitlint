# @savvy-web/commitlint

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
