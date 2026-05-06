---
name: smoketest
description: Use when validating that commitlint rules enforce correctly after modifying the @savvy-web/commitlint package, plugins, or config factory. Covers all active silk/ rules and the tdd scope format.
---

# Smoketest: Commitlint Rule Validation

## Overview

Runs valid and invalid commit messages through all active commitlint rules, exercising both the git commit-msg hook path and the commitlint CLI. Both paths must agree on every case.

Test cases live in `cases.json`. The runner is `smoketest.mjs`.

## When to Use

- After modifying `package/src/config/` (rules, plugins, factory, static)
- After rebuilding the package (`pnpm ci:build`)
- When debugging unexpected rule acceptance or rejection
- Before completing a branch that changes commitlint behavior

## Running the Smoketest

Always run from the repo root:

```bash
# All categories, both paths
node .claude/skills/smoketest/smoketest.mjs

# With a fresh build first
node .claude/skills/smoketest/smoketest.mjs build

# Specific categories
node .claude/skills/smoketest/smoketest.mjs tdd
node .claude/skills/smoketest/smoketest.mjs tdd dco

# Force one path
node .claude/skills/smoketest/smoketest.mjs hook        # hook only
node .claude/skills/smoketest/smoketest.mjs cli         # CLI only
node .claude/skills/smoketest/smoketest.mjs tdd cli     # tdd via CLI only
```

## Arguments

| Arg | Meaning |
| --- | --- |
| `types` | Commit type enum (`type-enum`) |
| `dco` | DCO signoff (`silk/signed-off-by`) |
| `markdown` | Markdown rejection (`silk/body-no-markdown`, `silk/subject-no-markdown`) |
| `tdd` | TDD scope validation (`silk/tdd-scope`) |
| `hook` | Test via git commit-msg hook only |
| `cli` | Test via commitlint CLI only |
| `build` | Run `pnpm ci:build` before testing |

## Interpreting Output

Each test line shows the path, expected result, and name:

```text
✅ CLI [pass] feat: valid type
✅ HOOK [pass] feat: valid type
❌ CLI [expected=fail got=pass] tdd: missing scope
```

The final summary shows total pass/fail count and exits 1 on any failure.

## Adding Test Cases

Edit `cases.json`. Each entry needs:

```json
{
  "name": "short description of what is being tested",
  "message": "type: subject\n\nBody if needed.\n\nSigned-off-by: Test <test@example.com>",
  "expect": "pass"
}
```

Use `\n` for newlines — JSON parses them to real newlines before writing to the temp file.
