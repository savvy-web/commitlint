# @savvy-web/commitlint

[![npm version](https://img.shields.io/npm/v/@savvy-web/commitlint)](https://www.npmjs.com/package/@savvy-web/commitlint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-3178c6?logo=typescript)](https://www.typescriptlang.org/)

Dynamic, intelligent commitlint configuration that auto-detects DCO
requirements, workspace scopes, and versioning strategies. Stop manually
configuring commit rules for every project.

## Features

- **Auto-detection** - Detects DCO files, workspace packages, and versioning
  strategies automatically
- **Zero config** - Works out of the box with sensible defaults
- **Type-safe** - Full TypeScript support with Zod schema validation
- **Extended types** - Includes `ai` and `release` commit types beyond
  conventional commits
- **Interactive prompts** - Built-in commitizen adapter with emoji support
- **CLI tooling** - Bootstrap and validate configurations with `savvy-commit`
- **Claude Code plugin** - Companion plugin keeps AI agents inside your commit
  conventions: injects branch and signing context at session start, auto-allows
  safe Bash and curated MCP operations, validates commit messages before
  `git commit` runs, and replays commitlint plus signing checks afterwards

## Repository Structure

This is a monorepo containing two packages:

| Directory | Description |
| --- | --- |
| [`package/`](./package/) | The `@savvy-web/commitlint` npm package. Dynamic commitlint configuration with auto-detection, interactive prompts, and the `savvy-commit` CLI. |
| [`plugin/`](./plugin/) | A Claude Code sidecar plugin that registers `SessionStart`, `PreToolUse`, `PostToolUse`, and `UserPromptSubmit` hooks to inform AI agents about Silk commit conventions, auto-allow safe Bash and curated MCP operations, validate commit messages before they run, and replay commitlint plus signing checks afterwards. |

## Quick Start

```bash
npm install -D @savvy-web/commitlint @commitlint/cli @commitlint/config-conventional husky
```

```typescript
// commitlint.config.ts
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
```

Or bootstrap everything automatically:

```bash
npx savvy-commit init
```

For configuration options, API reference, and advanced usage, see the
[package README](./package/README.md) and [docs](./docs/).

## Documentation

- [Configuration Guide](./docs/configuration.md) - All configuration options
- [Auto-Detection](./docs/auto-detection.md) - How automatic detection works
- [CLI Reference](./docs/cli.md) - Command-line interface usage
- [Commit Types](./docs/commit-types.md) - Available types and their usage

## License

[MIT](./LICENSE)
