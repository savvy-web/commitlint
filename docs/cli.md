# CLI Reference

`@savvy-web/commitlint` includes a CLI tool called `savvy-commit` for
bootstrapping and validating configurations.

## Installation

The CLI is available after installing the package:

```bash
npm install -D @savvy-web/commitlint @commitlint/cli @commitlint/config-conventional husky
```

## Commands

### savvy-commit init

Bootstrap commitlint configuration and husky hooks.

```bash
npx savvy-commit init
```

**Options:**

| Option | Alias | Description |
| ------ | ----- | ----------- |
| `--force` | `-f` | Overwrite entire hook file (not just managed section) |
| `--config` | `-c` | Relative path for the commitlint config file (default: `lib/configs/commitlint.config.ts`) |

**Generated Files:**

- Commitlint config at the specified path (default `lib/configs/commitlint.config.ts`)
- `.husky/commit-msg` - Git hook with managed section

**Managed Section:**

The hook uses `BEGIN`/`END` markers to define a managed section. You can add
custom hooks above or below the managed block. Re-running `init` updates only
the managed section, preserving your customizations. Use `--force` to replace
the entire file.

In CI environments (`CI` or `GITHUB_ACTIONS` set), the managed section is
skipped so that custom hooks outside the markers still execute.

**Example:**

```bash
# Initialize with defaults
npx savvy-commit init

# Use a custom config path
npx savvy-commit init --config commitlint.config.ts

# Force overwrite entire hook file
npx savvy-commit init --force
```

### savvy-commit check

Validate the current commitlint setup and show detected settings.

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

The check command also reports managed section status: up-to-date, outdated
(run `savvy-commit init` to update), or not found.

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

## Husky Integration

The `init` command creates a husky hook at `.husky/commit-msg` with:

- Managed section markers for safe re-running
- CI environment detection (skips managed section in GitHub Actions)
- Automatic package manager detection (pnpm, yarn, bun, npm)
- Absolute path resolution for reliable config location

Custom hooks can be placed above or below the managed section markers.
Re-running `savvy-commit init` updates only the managed block, preserving
your customizations.

## Manual Setup

If you prefer manual setup over the CLI:

1. Create `commitlint.config.ts` (or `lib/configs/commitlint.config.ts`):

   ```typescript
   import { CommitlintConfig } from "@savvy-web/commitlint";

   export default CommitlintConfig.silk();
   ```

2. Run the init command to generate the hook:

   ```bash
   npx savvy-commit init --config commitlint.config.ts
   ```

3. Alternatively, create `.husky/commit-msg` manually and make it executable:

   ```bash
   chmod +x .husky/commit-msg
   ```
