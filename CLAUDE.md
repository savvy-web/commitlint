# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This monorepo ships `@savvy-web/commitlint` plus a companion Claude Code
plugin that enforces commit conventions for savvy-web projects.

- `package/` — the `@savvy-web/commitlint` npm package (config factory,
  prompt, formatter, `savvy-commit` CLI, and the internal `savvy commit hook`
  subcommand tree).
- `plugin/` — Claude Code plugin (`commitlint`) registering bash hooks that
  shim into `savvy commit hook`.

## Design Documentation

Architecture, plugin hook design, CLI surface, rule pipeline, and detection
strategy live in design docs. **Load these only when directly relevant.**

- Architecture overview, CLI tree, plugin hooks → `@./.claude/design/commitlint/overview.md`

Load when changing the config factory, detection modules, CLI commands, hook
rules, plugin shims, or the JSON envelope contract. Do **not** load for
routine tests, lint fixes, or doc edits.

## Live Package Development

The `@savvy-web/commitlint` package is workspace-linked into `node_modules/@savvy-web/commitlint`
pointing at `package/dist/dev`. Changes to `package/src/` are not live until you rebuild:

```bash
pnpm ci:build              # CI-mode full rebuild — updates the live workspace link
```

The commitlint CLI is available immediately after rebuild:

```bash
pnpm exec savvy-commit check   # validate config, husky hooks, and managed-section health (not a message linter)
pnpm exec commitlint --config lib/configs/commitlint.config.ts --edit <file>  # lint a message
```

`savvy-commit init` writes three husky hooks via silk-effects managed sections: `.husky/commit-msg` (ordered `savvy-base` preamble + `savvy-commit` tool section) and the co-owned `savvy-hooks` hygiene section in both `.husky/post-checkout` and `.husky/post-merge`. `savvy-commit check` reports all three section identities and factors section health into its verdict.

The git commit-msg hook also runs the live build — `git commit --allow-empty -m "..."` exercises
the full hook pipeline.

## Skills

### `/smoketest`

Runs valid and invalid commit messages through all active commitlint rules, covering both the
git commit-msg hook path and the CLI path. Supports optional args to target specific rule
categories (`types`, `dco`, `markdown`, `tdd`, `hook`, `cli`).

Use after modifying `package/src/config/` or rebuilding the package to verify rule enforcement
is correct.

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
  pieces consumers wire up. `config/schema.ts` validates `ConfigOptions`
  with **Effect Schema** (`decodeConfigOptions`); zod is no longer a
  dependency.
- `cli/` — `@effect/cli` command tree. User-facing commands live in
  `commands/init.ts` (writes `.husky/commit-msg` as ordered `savvy-base` +
  `savvy-commit` managed sections via `ManagedSection.syncMany`, plus the
  co-owned `savvy-hooks` hygiene section in `.husky/post-checkout` and
  `.husky/post-merge`) and `commands/check.ts` (validates config presence,
  husky hook presence, and all three managed-section identities, factoring
  section health into the verdict). `commands/constants.ts` holds the
  three husky hook paths. `commands/hook.ts` parents the **internal**
  `savvy commit hook` subcommand tree under `commands/hooks/`
  (`session-start`, `pre-commit-message`, `post-commit-verify`,
  `user-prompt-submit`).
- `hook/` — helpers shared by hook subcommands: Effect Schemas for the four
  hook envelopes (`envelope.ts`), JSON output builders (`output.ts`), the
  shell-quote-based `parse-bash-command.ts`, the `HookSilencer` Layer
  (`silence-logger.ts`), `diagnostics/` (branch, signing, cache,
  open-issues, package-manager, commitlint-config), and a `rules/` pipeline
  of typed `Rule<Input, Ctx>` units
  partitioned into `deny` / `advise` hits.

### Plugin Layout

`plugin/hooks/` follows the canonical subdirectory-per-event layout. Each
event has its own folder with one shim per matcher: `session-start/main.sh`,
`pre-tool-use/{bash,mcp,fs}.sh`, `post-tool-use/bash.sh`,
`user-prompt-submit/main.sh`. Tests mirror this layout under
`plugin/hooks/__test__/<event>/`.

Helpers under `plugin/hooks/lib/`:

- `hook-output.sh` — `emit_noop` / `emit_allow` / `emit_deny` / `emit_context`.
- `hook-debug.sh` — `hook_error` / `hook_debug`, configurable via
  `COMMITLINT_HOOK_ERROR_LOG` / `COMMITLINT_HOOK_DEBUG_LOG` /
  `COMMITLINT_HOOK_DEBUG`. Default log dir is `$XDG_STATE_HOME/commitlint/`.
- `match-safe-bash.sh` — hard exclusions (including any compound script that
  contains `git commit` or `gh pr create|edit`) plus the auto-allow
  patterns in `safe-bash-patterns.txt`.
- `is-commit-related.sh` — cold-path classifier for commit-adjacent commands.
- `run-cli.sh` — emits the package-manager runner prefix.
- `safe-mcp-*.txt` — allow-lists for MCP operation suffixes.

The hot path (allow-list match) is cheap pure bash; the cold path delegates
to `savvy commit hook` over JSON on stdio. Hooks are invoked as
`bash <script>` from `hooks.json`; **do not chmod +x them**.

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
- **Husky Hooks** (managed via silk-effects `ManagedSection`):
  - `pre-commit`: Runs lint-staged.
  - `commit-msg`: `savvy-base` preamble (`ROOT`, `in_ci`, `pm_exec`) +
    `savvy-commit` tool section that runs `commitlint --edit "$1"`.
  - `post-checkout` / `post-merge`: Co-owned `savvy-hooks` hygiene section
    (`git config core.fileMode false` + chmod of tracked `.sh`). Shared
    with `@savvy-web/lint-staged`; both packages write it idempotently.
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
- **Shell framework**: **bats-core** harness at `plugin/hooks/__test__/`,
  mirroring the subdirectory-per-event layout
  (`__test__/<event>/<scope>.bats`). `lib/` helpers have dedicated specs
  under `__test__/lib/` (`is-commit-related.bats`, `match-safe-bash.bats`,
  `run-cli.bats`). Specs invoke hooks the same way `hooks.json` does
  (`bash <script>`), feeding fixture envelope JSON on stdin and asserting
  the emitted `permissionDecision` envelope.

## Conventions

### Imports

- Use `.js` extensions for relative imports (ESM requirement).
- Use `node:` protocol for Node.js built-ins.
- Separate type imports: `import type { Foo } from './bar.js'`.

### Commits

All commits require:

1. Conventional commit format (feat, fix, chore, tdd, etc.).
2. DCO signoff: `Signed-off-by: Name <email>`.

`tdd` commits require a mandatory scope in `<goalId>:<state>` format where
state is one of `spike`, `red`, `green`, or `refactor`
(e.g. `tdd(42:green): implement parser`).

### Publishing

The package publishes to both GitHub Packages and npm with provenance.
