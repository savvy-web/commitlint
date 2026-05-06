# @savvy-web/commitlint

[![npm version](https://img.shields.io/npm/v/@savvy-web/commitlint?label=npm&color=cb3837)](https://www.npmjs.com/package/@savvy-web/commitlint)
[![License: MIT](https://img.shields.io/badge/License-MIT-4caf50.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-5fa04e?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-3178c6?logo=typescript)](https://www.typescriptlang.org/)

Commitlint configuration that reads your repository at load time — checking for a `DCO` file, workspace manifests and changeset config — then generates the appropriate rules. One call to `CommitlintConfig.silk()` replaces the manual wiring of scope enums, signoff requirements and release-format rules across every project.

## Features

- **Auto-detection** — scans for a `DCO` file, workspace packages and changeset config; no manual flags required
- **Zero config** — `CommitlintConfig.silk()` picks the right rules; no flags needed
- **Type-safe** — ships full TypeScript types; Zod validates every detected value at load time
- **Extended types** — adds `ai`, `release` and `tdd` commit types on top of the conventional-commits baseline
- **Interactive prompts** — includes a commitizen adapter with emoji support
- **`savvy-commit` CLI** — initializes config and reports detected settings with a single command
- **Claude Code plugin** — registers session-start, pre-tool-use and post-tool-use hooks that give AI agents branch context, allow safe Bash commands automatically, and block commits that fail commitlint or DCO signing

## Repository structure

This is a monorepo containing two packages:

| Directory | Description |
| --- | --- |
| [`package/`](./package/) | The `@savvy-web/commitlint` npm package: config factory, interactive prompt, Zod detection and the `savvy-commit` CLI. |
| [`plugin/`](./plugin/) | A Claude Code sidecar that registers `SessionStart`, `PreToolUse`, `PostToolUse` and `UserPromptSubmit` hooks — injects branch and signing context, auto-allows safe Bash and curated MCP operations, and replays commitlint plus signing checks after each commit. |

## Quick start

```bash
npm install -D @savvy-web/commitlint @commitlint/cli @commitlint/config-conventional husky
```

```typescript
// commitlint.config.ts
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
```

To let `savvy-commit` wire up the config file and hooks for you:

```bash
npx savvy-commit init
# example output (varies by environment)
```

For configuration options, API reference and advanced usage, see the [package README](./package/README.md) and [docs](./docs/).

## Documentation

- [Configuration guide](./docs/01-configuration.md) — all configuration options
- [Auto-detection](./docs/02-auto-detection.md) — how detection works and what it reads
- [CLI reference](./docs/03-cli.md) — `savvy-commit` commands and flags
- [Commit types](./docs/04-commit-types.md) — available types and when to use each

## License

[MIT](LICENSE)
