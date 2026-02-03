---
"@savvy-web/commitlint": patch
---

Update husky commit-msg hook template for modern Husky compatibility

- Remove deprecated `dirname` sourcing (no longer needed in Husky v9+)
- Add CI environment skip for GitHub Actions
- Use `git rev-parse --show-toplevel` for reliable repo root detection
- Update all file path checks to use absolute paths from repo root
- Fix bun lockfile detection (`bun.lock` instead of `bun.lockb`)
- Add explicit config path to commitlint command
