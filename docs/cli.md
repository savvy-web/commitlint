# CLI Reference

`@savvy-web/commitlint` includes a CLI tool called `savvy-commit` for
bootstrapping and validating configurations.

## Installation

The CLI is available after installing the package:

```bash
npm install -D @savvy-web/commitlint @commitlint/cli
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
| `--force` | `-f` | Overwrite existing files |

**Generated Files:**

- `commitlint.config.ts` - Configuration using `CommitlintConfig.silk()`
- `.husky/commit-msg` - Git hook for commit message validation

**Example:**

```bash
# Initialize with defaults
npx savvy-commit init

# Force overwrite existing files
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

Detected settings:
  DCO required: true
  Release format: semver
  Detected scopes: api, cli, core, docs
```

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

- CI environment detection (skips validation in GitHub Actions)
- Automatic package manager detection (pnpm, yarn, bun, npm)
- Absolute path resolution for reliable config location

This validates every commit message against your configuration.

## Manual Setup

If you prefer manual setup over the CLI:

1. Create `commitlint.config.ts` (or `lib/configs/commitlint.config.ts`):

```typescript
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
```

1. Run the init command to generate the hook:

```bash
npx savvy-commit init --config lib/configs/commitlint.config.ts
```

1. Alternatively, create `.husky/commit-msg` manually and make it executable:

```bash
chmod +x .husky/commit-msg
```
