# Contributing

Thank you for your interest in contributing! This document provides guidelines
and instructions for development.

## Prerequisites

- Node.js 24+
- pnpm 10.28+

## Development Setup

```bash
# Clone the repository
git clone https://github.com/savvy-web/commitlint.git
cd commitlint

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test
```

## Project Structure

```text
commitlint/
├── src/                              # Source code
│   ├── bin/                          # CLI entry point
│   ├── cli/                          # CLI commands
│   ├── config/                       # Configuration factory and schemas
│   ├── detection/                    # Auto-detection modules
│   ├── formatter/                    # Custom commit message formatter
│   └── prompt/                       # Prompt configuration
├── lib/
│   └── configs/                      # Shared configuration files
└── dist/                             # Build output
```

## Available Scripts

| Script                   | Description                      |
| ------------------------ | -------------------------------- |
| `pnpm run build`         | Build all packages (dev + prod)  |
| `pnpm run build:dev`     | Build development output only    |
| `pnpm run build:prod`    | Build production/npm output only |
| `pnpm run test`          | Run all tests                    |
| `pnpm run test:watch`    | Run tests in watch mode          |
| `pnpm run test:coverage` | Run tests with coverage report   |
| `pnpm run lint`          | Check code with Biome            |
| `pnpm run lint:fix`      | Auto-fix lint issues             |
| `pnpm run typecheck`     | Type-check all workspaces        |

## Code Quality

This project uses:

- **Biome** for linting and formatting (tabs, 120 char line width)
- **Commitlint** for enforcing conventional commits
- **Husky** for Git hooks
- **Vitest** for testing with v8 coverage

### Commit Format

All commits must follow the [Conventional Commits](https://conventionalcommits.org)
specification and include a DCO signoff:

```text
feat: add new feature

Signed-off-by: Your Name <your.email@example.com>
```

Allowed commit types: `ai`, `build`, `chore`, `ci`, `docs`, `feat`, `fix`,
`perf`, `refactor`, `release`, `revert`, `style`, `test`

### Pre-commit Hooks

The following checks run automatically:

- **pre-commit**: Runs lint-staged
- **commit-msg**: Validates commit message format
- **pre-push**: Runs tests for affected packages

## Testing

Tests use [Vitest](https://vitest.dev) with v8 coverage and the forks pool
for Effect-TS compatibility.

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

## TypeScript

- Uses tsgo (TypeScript Go) for fast type checking
- Strict mode enabled
- ES2022/ES2023 targets
- Import extensions required (`.js` for ESM)

### Import Conventions

```typescript
// Use .js extensions for relative imports (ESM requirement)
import { myFunction } from "./utils/helpers.js";

// Use node: protocol for Node.js built-ins
import { EventEmitter } from "node:events";

// Separate type imports
import type { MyType } from "./types.js";
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `pnpm run test`
5. Run linting: `pnpm run lint:fix`
6. Commit with conventional format and DCO signoff
7. Push and open a pull request

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
