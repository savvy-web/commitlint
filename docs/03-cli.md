# CLI reference

`@savvy-web/commitlint` ships a CLI called `savvy-commit` for writing the commitlint config and the husky hook.

## Install

The CLI is available after installing the package:

```bash
npm install -D @savvy-web/commitlint @commitlint/cli @commitlint/config-conventional husky
```

## Commands

### savvy-commit init

Write the commitlint config and the `.husky/commit-msg` hook.

```bash
npx savvy-commit init
# example output (varies by environment)
```

**Options:**

| Option | Alias | Description |
| ------ | ----- | ----------- |
| `--force` | `-f` | Overwrite entire hook file (not just managed section) |
| `--config` | `-c` | Relative path for the commitlint config file (default: `lib/configs/commitlint.config.ts`) |

**Generated files:**

- Commitlint config at the specified path (default `lib/configs/commitlint.config.ts`)
- `.husky/commit-msg` — git hook with a managed section

**Managed section:**

The hook uses `BEGIN`/`END` markers to define a managed section. You can add custom hooks above or below the managed block. Re-running `init` updates only the managed section and leaves the rest of the file alone. Use `--force` to replace the entire file.

In CI environments (`CI` or `GITHUB_ACTIONS` set), the managed section is skipped so custom hooks outside the markers still execute.

**Example:**

```bash
# Initialize with defaults
npx savvy-commit init
# example output (varies by environment)

# Use a custom config path
npx savvy-commit init --config commitlint.config.ts
# example output (varies by environment)

# Force overwrite entire hook file
npx savvy-commit init --force
# example output (varies by environment)
```

### savvy-commit check

Show the current commitlint config and whether the managed section in the hook is up to date.

```bash
npx savvy-commit check
```

**Output:**

```text
Checking commitlint configuration...

Config file: commitlint.config.ts
Husky hook: .husky/commit-msg
Managed section: up-to-date
DCO file: DCO

Detected settings:
  DCO required: true
  Release format: semver
  Detected scopes: api, cli, core, docs
```

The managed section status is one of: `up-to-date`, `outdated` (run `savvy-commit init` to update), or `not found`.

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

`savvy-commit init` writes `.husky/commit-msg` with `BEGIN`/`END` markers around the managed section. Custom hooks placed above or below those markers survive re-runs. The managed section detects your package manager (npm, pnpm, yarn or bun), uses an absolute path for the config so the hook works from any working directory, and is skipped entirely in CI.

## Manual setup

To set up without the CLI:

1. Create `commitlint.config.ts` (or `lib/configs/commitlint.config.ts`):

   ```typescript
   import { CommitlintConfig } from "@savvy-web/commitlint";

   export default CommitlintConfig.silk();
   ```

2. Run `init` to generate the hook:

   ```bash
   npx savvy-commit init --config commitlint.config.ts
   # example output (varies by environment)
   ```

3. Or create `.husky/commit-msg` by hand and make it executable:

   ```bash
   chmod +x .husky/commit-msg
   ```
