# CLI reference

`@savvy-web/commitlint` ships a CLI called `savvy-commit` for writing the commitlint config and the husky hooks it relies on.

## Install

The CLI is available after installing the package:

```bash
npm install -D @savvy-web/commitlint @commitlint/cli @commitlint/config-conventional husky
```

## Commands

### savvy-commit init

Write the commitlint config file and three husky hooks: `commit-msg`, `post-checkout` and `post-merge`.

```bash
npx savvy-commit init
# example output (varies by environment)
```

**Options:**

| Option | Alias | Description |
| ------ | ----- | ----------- |
| `--force` | `-f` | Overwrite the commit-msg hook file and config file entirely (hygiene sections in post-checkout/post-merge are never force-reset) |
| `--config` | `-c` | Relative path for the commitlint config file (default: `lib/configs/commitlint.config.ts`) |

**Generated files:**

- Commitlint config at the specified path (default `lib/configs/commitlint.config.ts`)
- `.husky/commit-msg` — savvy-base preamble followed by a one-line savvy-commit tool section
- `.husky/post-checkout` and `.husky/post-merge` — savvy-hooks hygiene section (co-owned with `@savvy-web/lint-staged`; both packages write identical content)

**Managed sections:**

Each hook file is split into named sections delimited by `# --- BEGIN SAVVY-<NAME> MANAGED SECTION ---` and `# --- END SAVVY-<NAME> MANAGED SECTION ---` markers. The section identities written by `savvy-commit init` are:

| Section | File | Purpose |
| ------- | ---- | ------- |
| `savvy-base` | `.husky/commit-msg` | Shared preamble: `ROOT`, `in_ci()`, `detect_pm()`, `PM`, `pm_exec()` |
| `savvy-commit` | `.husky/commit-msg` | One-line tool invocation: `in_ci \|\| pm_exec commitlint --config "$ROOT/<path>" --edit "$1"` |
| `savvy-hooks` | `.husky/post-checkout`, `.husky/post-merge` | File-mode hygiene: `git config core.fileMode false` and chmod tracked `.sh` files |

You can add custom commands above, below or between the managed sections in any of these files. Re-running `init` updates only the managed sections and leaves the rest alone. Use `--force` to replace the entire commit-msg hook file (the hygiene hooks are never force-reset because they are co-owned with other tools).

The `savvy-base` preamble is side-effect free — it only defines shell functions. The CI guard lives on each tool line (`in_ci || pm_exec ...`), so custom hooks outside the managed sections still run in CI. The hygiene section is self-guarded against CI.

**Package-manager runner:**

The `pm_exec()` helper in the `savvy-base` preamble resolves to the local-exec form for the detected package manager:

| Package manager | Runner |
| --------------- | ------ |
| pnpm | `pnpm exec` |
| yarn | `yarn exec` |
| bun | `bun x` |
| npm (fallback) | `npx --no` |

This matches the runner used by sibling packages such as `@savvy-web/lint-staged`, so the same dispatch logic appears in every managed `savvy-base` section.

**Example:**

```bash
# Initialize with defaults
npx savvy-commit init
# example output (varies by environment)

# Use a custom config path
npx savvy-commit init --config commitlint.config.ts
# example output (varies by environment)

# Force overwrite the commit-msg hook file (hygiene hooks unaffected)
npx savvy-commit init --force
# example output (varies by environment)
```

### savvy-commit check

Show the current commitlint setup: config file, husky hooks, the health of each managed section and the detected settings the config factory will use.

```bash
npx savvy-commit check
```

**Output:**

```text
Checking commitlint configuration...

✓ Config file: commitlint.config.ts
✓ Husky hook: .husky/commit-msg
✓ Base section: up-to-date
✓ Commit section: up-to-date
✓ Hygiene hook: .husky/post-checkout
✓ Hygiene hook: .husky/post-merge
✓ DCO file: DCO

Detected settings:
  DCO required: true
  Release format: semver
  Detected scopes: api, cli, core, docs

✓ Commitlint is configured correctly.
```

Each section line reports one of three states:

- `up-to-date` — the on-disk content matches what `savvy-commit init` would write
- `outdated` — the markers are present but the content has drifted; re-run `savvy-commit init` to refresh
- `not found` — the markers are missing entirely; re-run `savvy-commit init` to add the section

The final verdict is `Commitlint is configured correctly` only when the config file exists, the commit-msg hook exists and every section (`savvy-base`, `savvy-commit`, plus `savvy-hooks` in both hygiene hooks) is up-to-date. Any missing or outdated section flips the verdict to `Commitlint needs configuration. Run: savvy-commit init`.

## Using with npm scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "commit:init": "savvy-commit init",
    "commit:check": "savvy-commit check"
  }
}
```

## Husky integration

`savvy-commit init` writes its managed sections into the husky hook files using `BEGIN`/`END` markers, so custom commands placed outside the markers survive re-runs. The CI guard lives on each tool line rather than around the entire managed section, so custom hooks outside the managed area still run in CI.

The `savvy-hooks` hygiene section in `post-checkout` and `post-merge` is co-owned with `@savvy-web/lint-staged`: both packages emit byte-identical content and treat the section as idempotent. Whichever tool runs `init` last leaves the section unchanged.

## Manual setup

To set up without the CLI:

1. Create `commitlint.config.ts` (or `lib/configs/commitlint.config.ts`):

   ```typescript
   import { CommitlintConfig } from "@savvy-web/silk/commitlint";

   export default CommitlintConfig.silk();
   ```

2. Run `init` to generate the hooks:

   ```bash
   npx savvy-commit init --config commitlint.config.ts
   # example output (varies by environment)
   ```

3. Or create the husky hooks by hand and make them executable:

   ```bash
   chmod +x .husky/commit-msg .husky/post-checkout .husky/post-merge
   ```
