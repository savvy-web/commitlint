# @savvy-web/commitlint

[![npm version](https://img.shields.io/npm/v/@savvy-web/commitlint)](https://www.npmjs.com/package/@savvy-web/commitlint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-3178c6?logo=typescript)](https://www.typescriptlang.org/)

Dynamic, intelligent commitlint configuration that auto-detects DCO requirements,
workspace scopes, and versioning strategies. Stop manually configuring commit
rules for every project.

## Features

- **Auto-detection** - Detects DCO files, workspace packages, and versioning
  strategies automatically
- **Zero config** - Works out of the box with sensible defaults
- **Type-safe** - Full TypeScript support with Zod schema validation
- **Extended types** - Includes `ai` and `release` commit types beyond
  conventional commits
- **Interactive prompts** - Built-in commitizen adapter with emoji support
- **CLI tooling** - Bootstrap and validate configurations with `savvy-commit`

## Installation

```bash
npm install -D @savvy-web/commitlint @commitlint/cli @commitlint/config-conventional husky
```

## Quick Start

```typescript
// commitlint.config.ts
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
```

Or use the static configuration without auto-detection:

```typescript
// commitlint.config.ts
export { default } from "@savvy-web/commitlint/static";
```

Bootstrap your project automatically with the CLI:

```bash
npx savvy-commit init
```

## Claude Code Plugin

This package has a companion Claude Code plugin that helps AI agents follow
commit standards in your repository:

```bash
# Add the Savvy Web plugin marketplace (one-time setup)
/plugin marketplace add savvy-web/systems

# Install the commitlint plugin for this project
/plugin install commitlint@savvy-web-systems --scope project
```

Once installed, the plugin:

- **Injects context at session start** with your project's commit conventions,
  current branch and inferred ticket id, a GPG/SSH signing diagnostic, and a
  cached list of open issues from `gh`.
- **Auto-allows safe Bash and curated MCP operations** so the agent does not
  prompt for read-only commands, common workflow tools, or vetted GitHub /
  GitKraken operations. Destructive commands (`rm`, `curl`, `git push --force`,
  package installers, `gh repo delete`, `gh secret`, etc.) are never
  auto-allowed.
- **Validates commit messages before they run** by intercepting `git commit`
  and `gh pr create|edit`, denying messages that contain markdown headers or
  code fences, or that conflict with your signing config (`--no-gpg-sign`
  while `commit.gpgsign=true`).
- **Advises on commit quality** for plan/design path leakage, soft-wrapped
  bullets, overly long bodies, and missing `Closes/Fixes/Resolves` trailers
  when the branch encodes a ticket id.
- **Replays commitlint after each commit** and surfaces signing-status or
  Closes-trailer issues so the agent can offer an `--amend` fix.
- **Reminds the agent about commit quality** when a user prompt mentions
  committing, shipping, opening a PR, amending, or squashing.

## Documentation

For configuration options, API reference, and advanced usage, see
[docs/](./docs/).

- [Configuration Guide](./docs/configuration.md) - All configuration options
- [Auto-Detection](./docs/auto-detection.md) - How automatic detection works
- [CLI Reference](./docs/cli.md) - Command-line interface usage
- [Commit Types](./docs/commit-types.md) - Available types and their usage

## License

MIT
