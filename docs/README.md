# Documentation

`@savvy-web/commitlint` generates a commitlint configuration by reading your repository at load time. It checks for DCO files, workspace manifests and changeset config, then produces typed rules for signoff requirements, scope restrictions and release-format validation.

## Quick links

- [Configuration guide](./01-configuration.md) - All configuration options
- [Auto-detection](./02-auto-detection.md) - How automatic detection works
- [CLI reference](./03-cli.md) - Command-line interface usage
- [Commit types](./04-commit-types.md) - Available commit types and their usage

## Overview

`@savvy-web/commitlint` has two configuration modes.

### Dynamic configuration (recommended)

Reads the repository at load time and generates rules to match:

```typescript
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
// returns a commitlint configuration object
```

### Static configuration

A fixed configuration with no runtime detection:

```typescript
export { default } from "@savvy-web/commitlint/static";
```

## Package exports

| Export | Description |
| ------ | ----------- |
| `@savvy-web/commitlint` | Main entry with `CommitlintConfig.silk()` |
| `@savvy-web/commitlint/static` | Static configuration without detection |
| `@savvy-web/commitlint/prompt` | Prompt configuration for interactive commits |
| `@savvy-web/commitlint/formatter` | Custom formatter for better error messages |

## Peer dependencies

Required:

- `@commitlint/cli`
- `@commitlint/config-conventional`
- `husky`

Optional (needed for interactive commits):

- `commitizen`

Install the required peers:

```bash
npm install -D @commitlint/cli @commitlint/config-conventional husky
```
