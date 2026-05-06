# Documentation

Welcome to the `@savvy-web/commitlint` documentation. This package provides dynamic, intelligent commitlint configuration with auto-detection capabilities.

## Quick links

- [Configuration guide](./01-configuration.md) - All configuration options
- [Auto-detection](./02-auto-detection.md) - How automatic detection works
- [CLI reference](./03-cli.md) - Command-line interface usage
- [Commit types](./04-commit-types.md) - Available commit types and their usage

## Overview

`@savvy-web/commitlint` offers two approaches to configuration:

### Dynamic configuration (recommended)

Auto-detects repository characteristics and generates appropriate rules:

```typescript
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
// returns a commitlint configuration object
```

### Static configuration

Pre-defined configuration without runtime detection:

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

This package requires:

- `@commitlint/cli` (required)
- `@commitlint/config-conventional` (required)
- `husky` (required)

Optional peer for interactive commits:

- `commitizen` (optional)

Install all required peers:

```bash
npm install -D @commitlint/cli @commitlint/config-conventional husky
```
