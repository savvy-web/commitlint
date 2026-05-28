---
"@savvy-web/commitlint": minor
---

## Features

### `savvy-commit init`: ordered managed sections in commit-msg hook

`savvy-commit init` now writes `.husky/commit-msg` as an ordered pair of
silk-effects managed sections:

1. A shared `savvy-base` preamble — `ROOT`, `in_ci()`, `detect_pm()`,
   `PM`, and `pm_exec()` — owned by this package.
2. A one-line `savvy-commit` section that runs the commitlint check:

```sh
in_ci || pm_exec commitlint --config "$ROOT/<path>" --edit "$1"
```

The package-manager runner is now standardized on local exec semantics
for all four supported PMs (`pnpm exec` / `yarn exec` / `bun x` /
`npx --no`), fixing the previous `yarn dlx` / `bun x` inconsistency.

Users may inject custom shell above, below, or between the sections.
Existing hooks are updated in place; unmanaged content is preserved.

### `savvy-commit init`: hygiene hooks in `post-checkout` and `post-merge`

`savvy-commit init` now writes a `savvy-hooks` section into
`.husky/post-checkout` and `.husky/post-merge`. This section ensures
tracked `.sh` files stay executable across platforms:

```sh
git config core.fileMode false
find . -name "*.sh" -not -path "./.git/*" | xargs chmod +x 2>/dev/null || true
```

The write is self-guarded and idempotent — running `init` twice or
alongside another package that writes the same section produces no diff.

The `--force` flag now only resets `.husky/commit-msg` and the config
file; the hygiene hooks are never force-reset.

### `savvy-commit check`: per-section validation

`savvy-commit check` now validates the `savvy-base`, `savvy-commit`, and
`savvy-hooks` sections (in both hygiene hooks) independently, reporting
per-section health for each. The final "configured correctly" verdict
now factors in section staleness in addition to file existence.

## Breaking Changes

The options schema for `CommitlintConfig.silk(options)` has migrated from
`zod` to Effect Schema. The accepted input shape and all defaults are
unchanged. However, if your code catches the validation error thrown on
invalid options by type, the error is now an Effect Schema `ParseError`
rather than a `ZodError`:

```ts
// Before
import { ZodError } from "zod";
try {
  CommitlintConfig.silk(badOptions);
} catch (e) {
  if (e instanceof ZodError) { /* ... */ }
}

// After — Effect Schema ParseError
import { ParseError } from "@effect/schema/ParseResult";
try {
  CommitlintConfig.silk(badOptions);
} catch (e) {
  if (e instanceof ParseError) { /* ... */ }
}
```

`zod` is no longer a runtime dependency of this package.
