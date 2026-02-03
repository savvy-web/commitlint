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
- **CLI included** - Bootstrap and validate configurations with `savvy-commit`

## Installation

```bash
npm install -D @savvy-web/commitlint @commitlint/cli
```

## Quick Start

```typescript
// commitlint.config.ts
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
```

For static configuration without auto-detection:

```typescript
// commitlint.config.ts
export { default } from "@savvy-web/commitlint/static";
```

## Interactive Commits

The package includes a built-in [commitizen](https://github.com/commitizen/cz-cli)
adapter for interactive commit prompts with emoji support.

### Setup

```bash
npm install -D commitizen
```

Add to `package.json`:

```json
{
  "scripts": {
    "commit": "cz"
  },
  "config": {
    "commitizen": {
      "path": "@savvy-web/commitlint/prompt"
    }
  }
}
```

### Usage

```bash
git add .
npm run commit
```

The interactive prompt guides you through:

- Type selection with emojis (🤖 ai, ✨ feat, 🐛 fix, etc.)
- Scope selection
- Subject and body input
- Breaking changes and issue references

## Documentation

For configuration options, API reference, and advanced usage, see
[docs/](./docs/).

## License

MIT
