#!/usr/bin/env bash
set -euo pipefail

# SessionStart hook: inform the agent about Silk commit conventions
# enforced by @savvy-web/commitlint.

# Get repo root directory
ROOT=$(git rev-parse --show-toplevel)

# Detect package manager from package.json or lockfiles
detect_pm() {
  # Check packageManager field in package.json (e.g., "pnpm@9.0.0")
  if [ -f "$ROOT/package.json" ]; then
    pm=$(jq -r '.packageManager // empty' "$ROOT/package.json" 2>/dev/null | cut -d'@' -f1)
    if [ -n "$pm" ]; then
      echo "$pm"
      return
    fi
  fi

  # Fallback to lockfile detection
  if [ -f "$ROOT/pnpm-lock.yaml" ]; then
    echo "pnpm"
  elif [ -f "$ROOT/yarn.lock" ]; then
    echo "yarn"
  elif [ -f "$ROOT/bun.lock" ]; then
    echo "bun"
  else
    echo "npm"
  fi
}

PM=$(detect_pm)

case "$PM" in
  pnpm) RUN="pnpm exec" ;;
  yarn) RUN="yarn exec" ;;
  bun)  RUN="bunx" ;;
  *)    RUN="npx --no --" ;;
esac

# Static content (quoted heredoc preserves backticks)
cat <<'STATIC'
## Commit Conventions

This project enforces commit message rules via `@savvy-web/commitlint` with the **Silk** preset. All commits are validated by a `commit-msg` hook.

### Format

```
type(scope): subject

body (optional)

trailers
```

### Allowed Types

| Type | Use for |
| --- | --- |
| feat | A new feature |
| fix | A bug fix |
| docs | Documentation only changes |
| style | Code style changes (formatting, semicolons, etc) |
| refactor | Code change that neither fixes a bug nor adds a feature |
| perf | A code change that improves performance |
| test | Adding missing tests or correcting existing tests |
| build | Changes to build system or external dependencies |
| ci | Changes to CI configuration files and scripts |
| chore | Other changes that don't modify src or test files |
| revert | Reverts a previous commit |
| release | Release commits (version bumps, changelogs) — managed by CI; do not write manually |
| ai | AI/LLM agent document updates (CLAUDE.md, context files) |

### Rules

- **DCO signoff required** — If a DCO file is in the project root every commit must end with `Signed-off-by: Name <email>` (auto-detected from DCO file)
- **No markdown in commits** — headers, numbered lists, code fences, links, and bold/italic are rejected; plain unordered lists (`-` or `*`) are allowed
- **Body max line length: 300** characters (accommodates detailed AI-generated messages)
- **Subject case: any** — capitalized subjects are acceptable
- **Scopes** — if the project defines allowed scopes, only those are permitted

### Example

```
feat(parser): add support for merge commit messages

Extend the parser to recognize merge commit patterns so they
pass validation without manual reformatting.

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>
```
STATIC

# Dynamic content (unquoted heredoc for variable interpolation)
cat <<DYNAMIC

### CLI Tools

**Validate commits** with \`commitlint\` (via \`@commitlint/cli\`):
- \`${RUN} commitlint --last\` — validate the most recent commit
- \`${RUN} commitlint --from HEAD~3\` — validate the last 3 commits
- \`${RUN} commitlint --from <ref>\` — validate all commits since a ref (branch point, tag, SHA)

**Manage configuration** with \`savvy-commit\`:
- \`${RUN} savvy-commit check\` — validate current setup and show detected settings (DCO, scopes, release format)
- \`${RUN} savvy-commit init\` — bootstrap commitlint config file and husky commit-msg hook
- \`${RUN} savvy-commit init --config <path>\` — custom config path (default: \`lib/configs/commitlint.config.ts\`)
- \`${RUN} savvy-commit init --force\` — overwrite existing hook file entirely

After committing, run \`${RUN} commitlint --last\` to verify the commit message meets standards before pushing.
DYNAMIC

exit 0
