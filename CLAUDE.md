# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This monorepo ships `@savvy-web/commitlint` plus a companion Claude Code
plugin that enforces commit conventions for savvy-web projects.

- `package/` — the `@savvy-web/commitlint` npm package (config factory,
  prompt, formatter, `savvy-commit` CLI, and the internal `savvy-commit hook`
  subcommand tree).
- `plugin/` — Claude Code plugin (`commitlint`) registering bash hooks that
  shim into `savvy-commit hook`.

## Design Documentation

Architecture, plugin hook design, CLI surface, rule pipeline, and detection
strategy live in design docs. **Load these only when directly relevant.**

- Architecture overview, CLI tree, plugin hooks → `@./.claude/design/commitlint/overview.md`

Load when changing the config factory, detection modules, CLI commands, hook
rules, plugin shims, or the JSON envelope contract. Do **not** load for
routine tests, lint fixes, or doc edits.

## Commands

### Development

```bash
pnpm run lint              # Check code with Biome
pnpm run lint:fix          # Auto-fix lint issues
pnpm run typecheck         # Type-check all workspaces via Turbo
pnpm run test              # Run all tests (vitest + bats)
pnpm run test:watch        # Run tests in watch mode
pnpm run test:coverage     # Run tests with coverage report
```

### Building

```bash
pnpm run build             # Build all packages (dev + prod)
pnpm run build:dev         # Build development output only
pnpm run build:prod        # Build production/npm output only
```

### Running a Single Test

```bash
# Vitest: filter by package or file
pnpm run test -- --filter=@savvy-web/commitlint
pnpm vitest run package/src/hook/envelope.test.ts

# Bats: shell-hook tests (require bats-core on PATH)
bats plugin/hooks/__test__/match-safe-bash.bats
```

## Architecture

### Monorepo Structure

- **Package Manager**: pnpm with workspaces.
- **Build Orchestration**: Turbo for caching and task dependencies.
- **Package**: `package/` (single npm package, `@savvy-web/commitlint`).
- **Plugin**: `plugin/` (Claude Code sidecar with bash hooks under
  `plugin/hooks/`).
- **Shared Configs**: `lib/configs/`.

### Package Layout (high level)

`package/src/` holds:

- `index.ts`, `static.ts` — public entry points (`CommitlintConfig.silk()`
  and the static config).
- `config/`, `detection/`, `prompt/`, `formatter/` — config factory and the
  pieces consumers wire up.
- `cli/` — `@effect/cli` command tree. `commands/init.ts` and
  `commands/check.ts` are the user-facing commands; `commands/hook.ts`
  parents the **internal** `savvy-commit hook` subcommand tree under
  `commands/hooks/` (`session-start`, `pre-commit-message`,
  `post-commit-verify`, `user-prompt-submit`).
- `hook/` — helpers shared by hook subcommands: Effect Schemas for the four
  hook envelopes (`envelope.ts`), JSON output builders (`output.ts`), the
  shell-quote-based `parse-bash-command.ts`, the `HookSilencer` Layer
  (`silence-logger.ts`), `diagnostics/` (branch, signing, cache,
  open-issues), and a `rules/` pipeline of typed `Rule<Input, Ctx>` units
  partitioned into `deny` / `advise` hits.

### Plugin Layout

`plugin/hooks/` contains thin bash shims registered in `hooks.json`:
`session-start.sh`, `pre-tool-use-{bash,mcp,fs}.sh`,
`post-tool-use-bash.sh`, `user-prompt-submit.sh`. Helpers under
`plugin/hooks/lib/` (`run-cli.sh`, `is-commit-related.sh`,
`match-safe-bash.sh`, plus `safe-bash-patterns.txt` / `safe-mcp-*.txt`
allow-lists) keep the hot path (auto-allow safe commands) cheap and
delegate the cold path to `savvy-commit hook` over JSON on stdio. Hooks are
invoked as `bash <script>` from `hooks.json`; **do not chmod +x them**.

### Stdout Contract

Hook subcommands reserve **stdout exclusively for the JSON envelope**
returned to Claude Code. The CLI's root layer routes Effect logs to
**stderr at `Warning+`** (see `package/src/cli/index.ts`); hook subcommands
additionally provide `HookSilencer` so even `Logger.info` cannot leak.
When editing hook code or the CLI logger, preserve this contract.

### Package Build Pipeline

The package uses Rslib with dual output:

1. `dist/dev/` — development build with source maps.
2. `dist/npm/` — production build for npm publishing.

Turbo: `typecheck` depends on `build` completing first.

### Code Quality

- **Biome**: Unified linting and formatting (replaces ESLint + Prettier).
- **Commitlint**: Enforces conventional commits with DCO signoff (this repo
  dogfoods its own package).
- **Husky Hooks**:
  - `pre-commit`: Runs lint-staged.
  - `commit-msg`: Validates commit message format.
  - `pre-push`: Runs tests for affected packages.

### TypeScript Configuration

- Composite builds with project references.
- Strict mode enabled.
- ES2022/ES2023 targets.
- Import extensions required (`.js` for ESM).

### Testing

- **TS framework**: Vitest with v8 coverage; pool uses **forks** (not
  threads) for Effect-TS compatibility. `vitest.config.ts` supports
  project-based filtering via `--project`.
- **Shell framework**: **bats-core** harness at `plugin/hooks/__test__/`.
  `lib/` helpers have dedicated specs (`is-commit-related.bats`,
  `match-safe-bash.bats`, `run-cli.bats`); the `pre-tool-use-{bash,mcp,fs}`
  shims have integration specs that fixture envelope JSON and assert the
  emitted `permissionDecision` envelope. Specs invoke hooks the same way
  `hooks.json` does (`bash <script>`).

## Conventions

### Imports

- Use `.js` extensions for relative imports (ESM requirement).
- Use `node:` protocol for Node.js built-ins.
- Separate type imports: `import type { Foo } from './bar.js'`.

### Commits

All commits require:

1. Conventional commit format (feat, fix, chore, etc.).
2. DCO signoff: `Signed-off-by: Name <email>`.

### Publishing

The package publishes to both GitHub Packages and npm with provenance.
