---
status: current
module: commitlint
category: architecture
created: 2026-02-02
updated: 2026-04-28
last-synced: 2026-04-28
completeness: 92
related: []
dependencies:
  - "@savvy-web/silk-effects"
  - workspaces-effect
  - "@effect/cli"
  - "@effect/platform-node"
  - effect
  - zod
  - shell-quote
implementation-plans:
  - ../plans/wondrous-purring-bee.md
  - ../plans/2026-04-28-commit-hooks-upgrade.md
---

# Commitlint Configuration Package - Architecture

A dynamic, intelligent commitlint configuration package for standardizing
conventional commit practices across savvy-web open source projects with
auto-detection of DCO requirements, workspace scopes, and versioning strategies.

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Rationale](#rationale)
4. [Package Architecture](#package-architecture)
5. [Dynamic Configuration API](#dynamic-configuration-api)
6. [Auto-Detection Features](#auto-detection-features)
7. [CLI Tool](#cli-tool)
8. [Plugin Hook Architecture](#plugin-hook-architecture)
9. [Configuration Options](#configuration-options)
10. [Peer Dependencies](#peer-dependencies)
11. [Integration](#integration)
12. [Testing Strategy](#testing-strategy)
13. [Future Enhancements](#future-enhancements)
14. [Related Documentation](#related-documentation)

Note: The Custom Plugin System and Factory Implementation are subsections of
the Dynamic Configuration API section. The Hook Subcommand Tree is a
subsection of CLI Tool.

---

## Overview

The `@savvy-web/commitlint` package provides a dynamic, intelligent
commitlint configuration that auto-detects repository characteristics and
enforces conventional commit standards across all savvy-web open source
repositories.

**Key Design Principles:**

- **Dynamic Configuration**: Factory function that auto-detects repo settings
- **Intelligent Detection**: Automatically detect DCO, scopes, versioning
- **Single Package**: Config, prompt, formatter, and CLI in one package
- **Peer Dependencies**: Commitlint packages as peers for version flexibility
- **Convention over Configuration**: Sensible defaults with easy overrides
- **Zod Validation**: Type-safe configuration with rich error messages

**When to reference this document:**

- When modifying the commitlint configuration rules
- When adding new commit types or scopes
- When integrating the package into new projects
- When troubleshooting commit message validation issues
- When extending the CLI or detection features

---

## Current State

### Existing Configuration

The repository currently has a local configuration at
`lib/configs/commitlint.config.ts`:

```typescript
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 300],
    "type-enum": [
      2,
      "always",
      [
        "build", "chore", "ci", "docs", "feat", "fix",
        "perf", "refactor", "release", "revert", "style", "test"
      ],
    ],
  },
};
```

### Key Observations

1. Extends `@commitlint/config-conventional` as the base
2. Increases `body-max-line-length` to 300 (default is 100)
3. Custom `type-enum` includes `release` type (not in conventional config)
4. No DCO signoff rule currently configured (but required per CLAUDE.md)

### Detection Architecture (silk-effects Migration)

The detection modules have been migrated from `workspace-tools` to Effect-based
services provided by `@savvy-web/silk-effects` and `workspaces-effect`:

- **Versioning detection**: Deleted `package/src/detection/versioning.ts` entirely.
  Replaced by `VersioningStrategy` service from `@savvy-web/silk-effects/versioning`,
  consumed as an Effect service in the CLI check command.
- **Scope detection**: `package/src/detection/scopes.ts` is now effectful, using
  `WorkspaceDiscovery` from `workspaces-effect` instead of `workspace-tools`.
  Returns `Effect.Effect<string[], WorkspaceDiscoveryError, WorkspaceDiscovery>`.
- **DCO detection**: Remains synchronous. Replaced `findProjectRoot` from
  `workspace-tools` with an inlined implementation that walks up the directory
  tree looking for root markers (`pnpm-workspace.yaml`, `.git`, `package.json`).
- **Managed sections**: `init.ts` and `check.ts` use `ManagedSection` service
  from `@savvy-web/silk-effects` instead of manual BEGIN/END marker parsing.
- **Deleted files**: `package/src/detection/versioning.ts`, `package/src/detection/versioning.test.ts`,
  `package/src/detection/utils.ts`

### Missing Elements

- No dynamic configuration factory
- No `signed-off-by` rule enforcement
- No prompt configuration with emojis
- No custom formatter for error messages
- No CLI for bootstrapping
- Not packaged for reuse across projects

---

## Rationale

### Dynamic Configuration Factory

**Context:** How should consumers configure the package?

**Decision:** Provide a factory function `CommitlintConfig.silk()` that
auto-detects settings

**Reasoning:**

1. **Ergonomic API**: Single function call with optional overrides
2. **Intelligence**: Auto-detect DCO, scopes, versioning without manual config
3. **Consistency**: Similar pattern to `@savvy-web/lint-staged` Preset.full()
4. **Flexibility**: Easy to override any detected setting

**API Design:**

```typescript
import { CommitlintConfig } from "@savvy-web/commitlint";

// Auto-detect everything
export default CommitlintConfig.silk();

// With explicit overrides
export default CommitlintConfig.silk({
  dco: true,                    // Override DCO detection
  scopes: ["api", "cli"],       // Merge with auto-detected
  releaseFormat: "semver",      // Override versioning detection
  emojis: true,                 // Enable emojis in prompts
});
```

### Auto-Detection Strategy

**Context:** What should be automatically detected?

**Decision:** Detect DCO requirements, workspace scopes, and versioning strategy

**Reasoning:**

1. **DCO Detection**: Check for `DCO` file at repo root (synchronous, inlined
   `findProjectRoot`)
2. **Scope Detection**: Use `WorkspaceDiscovery` from `workspaces-effect` to
   find package names (effectful)
3. **Versioning Detection**: Use `VersioningStrategy` service from
   `@savvy-web/silk-effects` (via `VersioningStrategyLive` layer) to analyze
   changeset config for release format
4. **Zero Config**: Works out of the box for most repositories

### Zod for Configuration Validation

**Context:** How to validate and type configuration?

**Decision:** Use Zod schemas for all configuration objects

**Reasoning:**

1. **Type Safety**: Full TypeScript inference from schemas
2. **Validation**: Rich error messages for invalid configs
3. **Schema Export**: Can generate JSON Schema for documentation
4. **Formatter Integration**: Use schema info for better error explanations

### Custom Formatter

**Context:** How to improve error messages?

**Decision:** Export `@savvy-web/commitlint/formatter`

**Reasoning:**

1. **Better UX**: Explain why a commit failed, not just what failed
2. **Actionable**: Suggest how to fix common issues
3. **Consistent**: Same formatting across all projects

### Effect CLI

**Context:** How to provide bootstrapping tools?

**Decision:** Use `@effect/cli` for the CLI implementation

**Reasoning:**

1. **Proven Pattern**: Already used in `github-action-builder`
2. **Type Safety**: Full type inference for commands and options
3. **Composable**: Layer-based dependency injection
4. **Testable**: Easy to test commands in isolation

### Static Exports

**Context:** What if users don't need dynamic features?

**Decision:** Also export static configs at `@savvy-web/commitlint/static`

**Reasoning:**

1. **Simplicity**: For projects that don't need detection
2. **Performance**: No runtime detection overhead
3. **Compatibility**: Works in environments where detection fails

---

## Package Architecture

### Directory Structure

This is a monorepo with two top-level directories: `package/` contains the
`@savvy-web/commitlint` npm package, and `plugin/` contains a Claude Code
sidecar plugin that informs agents about commit conventions via hooks.

```text
package/
  src/
    index.ts                      # Main entry: CommitlintConfig class
    static.ts                     # Static config export (no detection)
    static.test.ts                # Static config tests

    config/
      factory.ts                  # createConfig() implementation
      factory.test.ts             # Factory unit tests
      schema.ts                   # Zod schemas + ConfigOptions interface
      types.ts                    # TypeScript type definitions
      rules.ts                    # Rule definitions and defaults
      plugins.ts                  # Custom commitlint plugin (silk/ rules)
      plugins.test.ts             # Plugin rule tests

    detection/
      dco.ts                      # DCO file detection (synchronous, inlined findProjectRoot)
      dco.test.ts                 # DCO detection tests
      scopes.ts                   # Workspace scope detection (effectful, uses WorkspaceDiscovery)
      scopes.test.ts              # Scope detection tests

    prompt/
      index.ts                    # Prompt module exports
      index.test.ts               # Prompt module export tests
      config.ts                   # Prompt configuration for cz-commitlint
      config.test.ts              # Prompt config tests
      emojis.ts                   # Emoji definitions (shortcodes + Unicode)
      emojis.test.ts              # Emoji definition tests
      prompter.ts                 # Commitizen adapter implementation
      prompter.test.ts            # Commitizen adapter tests

    formatter/
      index.ts                    # Custom formatter entry
      index.test.ts               # Formatter entry tests
      format.ts                   # Formatting implementation
      format.test.ts              # Formatter tests
      messages.ts                 # Error message templates

    cli/
      index.ts                    # Effect CLI entry (runCli, exports)
      index.test.ts               # CLI integration tests
      commands/
        constants.ts              # Shared constants (CHECK_MARK, WARNING, paths)
        init.ts                   # Bootstrap husky hooks (managed section)
        init.test.ts              # Init command tests
        check.ts                  # Validate current setup + managed status
        check.test.ts             # Check command tests
        hook.ts                   # `hook` parent command (internal)
        hook.test.ts              # Parent-command tests
        hooks/                    # `hook` subcommand handlers (internal)
          session-start.ts        # Emits SessionStart additionalContext
          pre-commit-message.ts   # PreToolUse(Bash) commit-message validator
          post-commit-verify.ts   # PostToolUse(Bash) verifier (commitlint replay + signature + closes)
          user-prompt-submit.ts   # UserPromptSubmit reminder injector
          __test__/               # Co-located hook subcommand tests

    hook/                         # Hook helpers shared by the CLI hook subcommands
      envelope.ts                 # Effect Schemas for the four hook envelopes
      output.ts                   # JSON output builders (allow / deny / advise / silent / context)
      parse-bash-command.ts       # shell-quote-based parser for git commit / gh pr create|edit
      silence-logger.ts           # HookSilencer Layer (Warning+ only, stdout reserved for envelopes)
      diagnostics/
        branch.ts                 # Current branch + inferred ticket id (regex on branch name)
        signing.ts                # GPG/SSH signing diagnostic (format, autoSign, key resolution, agent)
        cache.ts                  # JSON file cache with TTL (atomic-ish writes)
        open-issues.ts            # gh-CLI-backed open issues, cached at .claude/cache/issues.json
      rules/
        types.ts                  # Rule<Input,Ctx>, RuleHit, partitionHits
        forbidden-content.ts      # deny: markdown headers / code fences in body
        plan-leakage.ts           # advise: .claude/plans|design paths or planning narrative
        soft-wrap.ts              # advise: short bullet followed by indented continuation
        verbosity.ts              # advise: body lines > 25 or words > 400
        closes-trailer.ts         # advise: branch ticket id with no Closes/Fixes/Resolves trailer
        signing-flag-conflict.ts  # deny: --no-gpg-sign while commit.gpgsign=true
      __test__/                   # Co-located hook helper tests

    bin/
      cli.ts                      # CLI bin entry point
      cli.test.ts                 # CLI bin tests

  package.json
  tsconfig.json
  rslib.config.ts

plugin/
  .claude-plugin/
    plugin.json                   # Plugin manifest (version auto-synced via versionFiles)
  hooks/
    hooks.json                    # Hook registration (SessionStart, PreToolUse x3, PostToolUse, UserPromptSubmit)
    session-start.sh              # CLI shim → savvy-commit hook session-start
    pre-tool-use-bash.sh          # Hot path: safe-bash auto-allow; cold path: pre-commit-message
    pre-tool-use-mcp.sh           # Auto-allow curated GitHub / GitKraken MCP ops
    pre-tool-use-fs.sh            # Auto-allow Read/Write/Edit under .claude/cache/
    post-tool-use-bash.sh         # Cold path: post-commit-verify
    user-prompt-submit.sh         # Trigger-regex shim → savvy-commit hook user-prompt-submit
    lib/
      run-cli.sh                  # Detect package manager, emit `pnpm exec` / `npx --no --` / etc.
      is-commit-related.sh        # Heuristic: is this `git commit` or `gh pr create|edit`?
      match-safe-bash.sh          # Match command against safe-bash-patterns.txt (with hard exclusions)
      safe-bash-patterns.txt      # POSIX-ERE regex allow-list (Tier A read + Tier B workflow-essential)
      safe-mcp-github-ops.txt     # Allow-list of MCP github(-*) operation suffixes
      safe-mcp-gk-ops.txt         # Allow-list of MCP gk operation suffixes
    __test__/                     # bats test harness
```

### Package Exports

```json
{
  "name": "@savvy-web/commitlint",
  "exports": {
    ".": {
      "import": "./dist/npm/index.mjs",
      "require": "./dist/npm/index.cjs",
      "types": "./dist/npm/index.d.ts"
    },
    "./static": {
      "import": "./dist/npm/static.mjs",
      "require": "./dist/npm/static.cjs",
      "types": "./dist/npm/static.d.ts"
    },
    "./prompt": {
      "import": "./dist/npm/prompt/index.mjs",
      "require": "./dist/npm/prompt/index.cjs",
      "types": "./dist/npm/prompt/index.d.ts"
    },
    "./formatter": {
      "import": "./dist/npm/formatter/index.mjs",
      "require": "./dist/npm/formatter/index.cjs",
      "types": "./dist/npm/formatter/index.d.ts"
    }
  },
  "bin": {
    "savvy-commit": "./dist/npm/bin/cli.mjs"
  }
}
```

---

## Dynamic Configuration API

### Main Factory

The `CommitlintConfig` is implemented as a class with a private constructor
and static methods. This prevents instantiation while providing a clean API
namespace for configuration creation.

```typescript
// package/src/index.ts
import { createConfig } from "./config/factory.js";
import type { ConfigOptions } from "./config/schema.js";
import { ConfigOptionsSchema } from "./config/schema.js";
import type { CommitlintUserConfig } from "./config/types.js";

export type { CommitlintUserConfig, ConfigOptions };

export class CommitlintConfig {
  static silk(options: ConfigOptions = {}): CommitlintUserConfig {
    const validated = ConfigOptionsSchema.parse(options);
    return createConfig(validated);
  }

  private constructor() {
    // Prevent instantiation - use static methods only
  }
}

export default CommitlintConfig;
```

The module also re-exports all public types, constants, detection utilities,
and schema definitions for consumers who need fine-grained access.

### Configuration Schema

The configuration uses a dual-definition pattern: a Zod schema for runtime
validation and a manually-written `ConfigOptions` interface for better JSDoc
documentation. The interface is the public-facing type; the schema is used
internally by `CommitlintConfig.silk()` to validate and apply defaults.

```typescript
// package/src/config/schema.ts
import { z } from "zod";

export type ReleaseFormat = "semver" | "packages" | "scoped";
export const ReleaseFormatSchema = z.enum(["semver", "packages", "scoped"]);

// Internal: Zod schema for validation and defaults
export const ConfigOptionsSchema = z.object({
  dco: z.boolean().optional(),
  scopes: z.array(z.string()).optional(),
  additionalScopes: z.array(z.string()).optional(),
  releaseFormat: ReleaseFormatSchema.optional(),
  emojis: z.boolean().default(false),
  bodyMaxLineLength: z.number().positive().default(300),
  noMarkdown: z.boolean().default(true),
  cwd: z.string().optional(),
});

// Public: manually-written interface with rich JSDoc
export interface ConfigOptions {
  /** Enable DCO signoff requirement (auto-detected from DCO file if omitted) */
  dco?: boolean;
  /** Allowed scopes (replaces auto-detected when provided) */
  scopes?: string[];
  /** Additional scopes to merge with auto-detected */
  additionalScopes?: string[];
  /** Release commit format (auto-detected from versioning strategy if omitted) */
  releaseFormat?: ReleaseFormat;
  /** Enable emojis in prompt configuration @defaultValue false */
  emojis?: boolean;
  /** Maximum body line length @defaultValue 300 */
  bodyMaxLineLength?: number;
  /** Reject markdown formatting in commit messages @defaultValue true */
  noMarkdown?: boolean;
  /** Working directory for auto-detection @defaultValue process.cwd() */
  cwd?: string;
}

// Resolved type after Zod parsing applies defaults (internal)
export type ResolvedConfigOptions = z.output<typeof ConfigOptionsSchema>;
```

The `ConfigOptions` interface is manually written rather than inferred from the
Zod schema (`z.input<typeof ConfigOptionsSchema>`) to provide richer JSDoc
documentation including `@remarks`, `@defaultValue`, and `@example` tags that
Zod schemas cannot express. The Zod schema and interface are kept in sync
manually.

### Custom Plugin System

The package includes a custom commitlint plugin (`silkPlugin`) defined in
`package/src/config/plugins.ts` that provides four rules namespaced under `silk/`.
These rules are loaded into the commitlint configuration via the `plugins`
array in the factory output.

```typescript
// package/src/config/plugins.ts
export const silkPlugin = {
  rules: {
    "silk/body-no-markdown": bodyNoMarkdown,
    "silk/subject-no-markdown": subjectNoMarkdown,
    "silk/body-prose-only": bodyProseOnly,
    "silk/signed-off-by": signedOffBy,
  },
};
```

**Custom Rules:**

| Rule | Purpose | When Active |
| :--- | :------ | :---------- |
| `silk/body-no-markdown` | Rejects markdown formatting in commit body (headers, numbered lists, code fences, links, bold, horizontal rules). Allows simple unordered lists and up to 2 inline code spans. | `noMarkdown: true` (default) |
| `silk/subject-no-markdown` | Rejects markdown formatting in commit subject line. | `noMarkdown: true` (default) |
| `silk/body-prose-only` | Stricter rule requiring prose paragraphs only (rejects all list-like structures including `-` and `*`). | Not enabled by default; available for opt-in. |
| `silk/signed-off-by` | Case-insensitive DCO signoff check. Replaces the built-in `signed-off-by` rule which is case-sensitive. Matches `Signed-off-by:`, `signed-off-by:`, etc. | `dco: true` (or auto-detected) |

The `silk/signed-off-by` rule replaces the built-in commitlint `signed-off-by`
rule because the built-in version is case-sensitive, which causes false failures
when tools produce different casing of the trailer.

**Markdown Detection:**

The markdown detection function checks for these patterns:

- Headers (`#`, `##`, etc.)
- Numbered lists (`1.`, `2.`)
- Code fences (triple backticks)
- Bold formatting (`**text**` or `__text__`)
- Links (`[text](url)`)
- Horizontal rules (`---`, `***`, `___`)
- Excessive inline code (more than 2 backtick-delimited spans)

Simple unordered lists (`- item` or `* item`) are intentionally allowed for
readability.

### Factory Implementation

The factory (`package/src/config/factory.ts`) assembles the full commitlint
configuration by combining auto-detected settings with user overrides.

Key implementation details that differ from the earlier design:

1. The `silkPlugin` is loaded via the `plugins` array (not built-in rules)
2. DCO uses the custom `silk/signed-off-by` rule instead of the built-in one
3. An environment variable `COMMITLINT_SKIP_DCO` can disable DCO checks
   (useful for CI PR title validation)
4. `subject-case` is explicitly disabled (`[0]`) to tolerate AI-generated
   capitalized subjects
5. Scopes are sorted after deduplication

```typescript
// package/src/config/factory.ts
import { detectDCO } from "../detection/dco.js";
import { createPromptConfig } from "../prompt/config.js";
import { silkPlugin } from "./plugins.js";
import { COMMIT_TYPES } from "./rules.js";
import type { ResolvedConfigOptions } from "./schema.js";
import type { CommitlintUserConfig, RulesConfig } from "./types.js";

export function createConfig(options: ResolvedConfigOptions): CommitlintUserConfig {
  const cwd = options.cwd ?? process.cwd();

  // COMMITLINT_SKIP_DCO=1 disables DCO check (useful for PR title validation)
  const skipDco =
    process.env.COMMITLINT_SKIP_DCO === "1" ||
    process.env.COMMITLINT_SKIP_DCO === "true";
  const dco = skipDco ? false : (options.dco ?? detectDCO(cwd));
  // Scopes no longer auto-detected here; detectScopes is effectful and
  // used only by the CLI check command. The factory defaults to empty scopes.
  const scopes = options.scopes ?? [];
  const allScopes = [...new Set([...scopes, ...(options.additionalScopes ?? [])])].sort();

  const rules: RulesConfig = {
    "body-max-line-length": [2, "always", options.bodyMaxLineLength],
    "type-enum": [2, "always", [...COMMIT_TYPES]],
    "subject-case": [0],  // Allow any case (AI tools often capitalize)
  };

  if (allScopes.length > 0) {
    rules["scope-enum"] = [2, "always", allScopes];
  }

  if (dco) {
    rules["silk/signed-off-by"] = [2, "always"];
  }

  if (options.noMarkdown) {
    rules["silk/body-no-markdown"] = [2, "always"];
    rules["silk/subject-no-markdown"] = [2, "always"];
  }

  return {
    extends: ["@commitlint/config-conventional"],
    plugins: [silkPlugin],
    rules,
    prompt: createPromptConfig({ emojis: options.emojis, ...(allScopes.length > 0 ? { scopes: allScopes } : {}) }),
  };
}
```

---

## Auto-Detection Features

### DCO Detection

DCO detection remains synchronous. It now inlines a `findProjectRoot` helper
that walks up the directory tree looking for root markers, replacing the
previous dependency on `workspace-tools.findProjectRoot`.

```typescript
// package/src/detection/dco.ts
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT_MARKERS = ["pnpm-workspace.yaml", ".git", "package.json"];

function findProjectRoot(cwd: string): string | null {
  let dir = resolve(cwd);
  while (true) {
    for (const marker of ROOT_MARKERS) {
      if (existsSync(join(dir, marker))) {
        return dir;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function detectDCO(cwd: string = process.cwd()): boolean {
  const repoRoot = findProjectRoot(cwd);
  const searchDir = repoRoot ?? cwd;
  return existsSync(join(searchDir, "DCO"));
}
```

### Scope Detection (Effectful)

Scope detection is now effectful, using `WorkspaceDiscovery` from
`workspaces-effect` instead of the synchronous `workspace-tools` API.

```typescript
// package/src/detection/scopes.ts
import { Effect } from "effect";
import type { WorkspaceDiscoveryError } from "workspaces-effect";
import { WorkspaceDiscovery } from "workspaces-effect";

function extractScopeName(name: string): string | undefined {
  if (name.startsWith("@")) {
    return name.split("/")[1];
  }
  return name;
}

export const detectScopes: Effect.Effect<
  string[],
  WorkspaceDiscoveryError,
  WorkspaceDiscovery
> = Effect.gen(function* () {
  const discovery = yield* WorkspaceDiscovery;
  const packages = yield* discovery.listPackages();

  const scopes: string[] = [];
  for (const pkg of packages) {
    const scopeName = extractScopeName(pkg.name);
    if (scopeName) {
      scopes.push(scopeName);
    }
  }

  return scopes.sort();
});
```

### Versioning Strategy Detection (Service-Based)

The versioning detection module (`package/src/detection/versioning.ts`) has been
**deleted**. Versioning strategy detection is now handled by the
`VersioningStrategy` service from `@savvy-web/silk-effects/versioning`,
consumed directly in the CLI check command:

```typescript
// In package/src/cli/commands/check.ts
import { VersioningStrategy } from "@savvy-web/silk-effects";

const STRATEGY_TO_FORMAT: Record<string, ReleaseFormat> = {
  single: "semver",
  "fixed-group": "semver",
  independent: "packages",
};

const detectReleaseFormat = Effect.gen(function* () {
  const versioning = yield* VersioningStrategy;
  const discovery = yield* WorkspaceDiscovery;

  const packages = yield* Effect.catchAll(
    discovery.listPackages(),
    () => Effect.succeed([] as const),
  );

  const publishableNames = packages
    .filter((pkg) => !pkg.private || pkg.publishConfig?.access !== undefined)
    .map((pkg) => pkg.name);

  const result = yield* Effect.catchAll(
    versioning.detect(publishableNames, process.cwd()),
    () => Effect.succeed({ type: "single" as const }),
  );

  return STRATEGY_TO_FORMAT[result.type] ?? ("semver" as ReleaseFormat);
});
```

This approach replaces the deleted `package/src/detection/versioning.ts` and
`package/src/detection/utils.ts` modules entirely. The versioning service is provided
via the CLI layer composition (see CLI Entry Point below).

---

## CLI Tool

### CLI Entry Point

The CLI uses `@effect/cli` with Effect for functional error handling. The
`runCli()` function is exported for the bin entry point. The `init`, `check`,
and `hook` subcommands are implemented (no `migrate` command yet); `hook` is
an internal subcommand tree consumed by the companion plugin's bash hooks.

The CLI composes a layer stack providing all silk-effects and workspaces-effect
services needed by the commands. It also installs a custom logger that routes
all Effect log output to stderr at `Warning` level or higher — the `hook`
subcommands reserve stdout exclusively for the JSON envelope they emit back to
Claude Code, and stray Info-level messages (e.g., `workspaces-effect` emitting
"Workspace root found") would otherwise corrupt that contract:

```typescript
// package/src/cli/index.ts
import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { ChangesetConfigReaderLive, ManagedSectionLive, VersioningStrategyLive } from "@savvy-web/silk-effects";
import { Effect, Layer, LogLevel, Logger } from "effect";
import { WorkspaceDiscoveryLive, WorkspaceRootLive } from "workspaces-effect";
import { checkCommand } from "./commands/check.js";
import { hookCommand } from "./commands/hook.js";
import { initCommand } from "./commands/init.js";

const rootCommand = Command.make("savvy-commit").pipe(
  Command.withSubcommands([initCommand, checkCommand, hookCommand]),
);

const cli = Command.run(rootCommand, {
  name: "savvy-commit",
  version: process.env.__PACKAGE_VERSION__ ?? "0.0.0",
});

const WorkspaceLive = WorkspaceDiscoveryLive.pipe(
  Layer.provideMerge(WorkspaceRootLive),
);

// Route logs to stderr at Warning+ so hook subcommands can keep stdout pristine.
const StderrLogger = Logger.replace(
  Logger.defaultLogger,
  Logger.make(({ message }) => {
    const line = typeof message === "string" ? message : JSON.stringify(message);
    process.stderr.write(`${line}\n`);
  }),
);
const MinLogLevel = Logger.minimumLogLevel(LogLevel.Warning);

const CliLive = Layer.mergeAll(
  ManagedSectionLive,
  VersioningStrategyLive.pipe(Layer.provide(ChangesetConfigReaderLive)),
  WorkspaceLive,
).pipe(Layer.provide(MinLogLevel), Layer.provide(StderrLogger), Layer.provideMerge(NodeContext.layer));

export function runCli(): void {
  const main = Effect.suspend(() => cli(process.argv)).pipe(
    Effect.provide(CliLive),
  );
  NodeRuntime.runMain(main);
}

export { checkCommand, hookCommand, initCommand, rootCommand };
```

**Layer composition:**

| Layer | Service Provided | Source |
| :---- | :--------------- | :----- |
| `ManagedSectionLive` | `ManagedSection` (BEGIN/END marker file management) | `@savvy-web/silk-effects` |
| `VersioningStrategyLive` | `VersioningStrategy` (changeset-based detection) | `@savvy-web/silk-effects` |
| `ChangesetConfigReaderLive` | `ChangesetConfigReader` (dependency of versioning) | `@savvy-web/silk-effects` |
| `WorkspaceDiscoveryLive` | `WorkspaceDiscovery` (package listing) | `workspaces-effect` |
| `WorkspaceRootLive` | `WorkspaceRoot` (root directory detection) | `workspaces-effect` |
| `NodeContext.layer` | `FileSystem`, `Path`, `Terminal` | `@effect/platform-node` |

### Init Command - Managed Section Pattern

The init command (`package/src/cli/commands/init.ts`) uses the `ManagedSection` service
from `@savvy-web/silk-effects` to manage BEGIN/END markers in the husky
hook. This replaces the previous manual marker parsing with a service-based
approach. The service handles reading, writing, and updating managed sections
in files, allowing users to add custom hooks above or below the managed block
without them being overwritten on updates.

**Options:**

- `--force` / `-f`: Overwrite the entire hook file, not just the managed section
- `--config` / `-c`: Relative path for the commitlint config file (default:
  `lib/configs/commitlint.config.ts`)

**Key Functions:**

| Function | Purpose |
| :------- | :------ |
| `generateManagedContent(configPath)` | Returns the inner content between markers. Includes package manager detection, CI skip guard, and commitlint invocation. |
| `writeFullHook(path, configPath)` | Writes a fresh hook file with shebang header, then delegates to `ManagedSection.write()` for the managed block. |

**ManagedSection service usage:**

- `SectionDefinition.make({ toolName })` - Create a section definition
- `sectionDef.block(content)` - Create a block with content for the section
- `ms.sync(path, block)` - Sync managed section (creates, updates, or reports unchanged)
- `ms.write(path, block)` - Write/overwrite managed section in a file

The `extractManagedSection` and `updateManagedSection` functions from the
previous implementation have been removed; their logic is now encapsulated
in the `ManagedSection` service.

**CI Skip Guard:**

The managed section uses an `if ! { ... }; then ... fi` pattern instead of
`exit 0` so that user code outside the managed block still runs even in CI:

```bash
if ! { [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; }; then
  # ... commitlint invocation ...
fi
```

**Three-Branch Hook Handling:**

1. **Exists + no force**: Sync managed section via `ms.sync()` which returns
   a tagged result (`Updated`, `Created`, or `Unchanged`). Preserves user
   code above/below the markers.
2. **Exists + force**: Overwrite the entire file with
   `generateFullHookContent()`. Logs "Replaced (--force)".
3. **New file**: Create `.husky/` directory and write fresh hook with
   `generateFullHookContent()`. Logs "Created".

The command also handles the commitlint config file creation, respecting the
`--config` path option and creating parent directories as needed.

### Check Command - Managed Section Status

The check command (`package/src/cli/commands/check.ts`) validates the current commitlint
setup and reports detected settings, including managed section status. It uses
`CheckResult`, `ManagedSection`, and `VersioningStrategy` from
`@savvy-web/silk-effects`.

**Service dependencies:**

```typescript
import { CheckResult, ManagedSection, VersioningStrategy } from "@savvy-web/silk-effects";
import { WorkspaceDiscovery } from "workspaces-effect";
```

**Key Functions:**

| Function | Purpose |
| :------- | :------ |
| `findConfigFile(fs)` | Searches for commitlint config across 16 possible file names in priority order. |
| `extractConfigPathFromManaged(managedContent)` | Extracts the config path from the `commitlint --config "$ROOT/{path}"` pattern in the managed section. |
| `checkManagedSectionStatus(existingManaged)` | Compares the current managed section against what would be generated to determine if it is up-to-date. |
| `detectReleaseFormat` | Effect that uses `VersioningStrategy` and `WorkspaceDiscovery` services to detect the release format. |

**Managed Section Status Reporting:**

The check command reports one of three states for the managed section:

- **Up-to-date**: Managed section matches what `generateManagedContent()` would
  produce (with whitespace normalization for comparison).
- **Outdated**: Managed section exists but content has drifted. Suggests running
  `savvy-commit init` to update.
- **Not found**: No managed section markers detected. Suggests running
  `savvy-commit init` to add one.

**Additional Checks:**

- Config file presence (searches 16 possible filenames)
- Husky hook presence
- DCO file presence
- Detected settings (DCO, release format, scopes)

### Hook Subcommand Tree (Internal)

The `savvy-commit hook` subcommand tree is consumed exclusively by the
companion `commitlint` Claude Code plugin's bash hooks (see "Plugin Hook
Architecture" below). The CLI surface and JSON envelope shape are not stable
for third-party consumers; expect breaking changes between minor versions
until 1.0.

| Subcommand | Hook event | Reads stdin? | Emits on stdout |
| :--------- | :--------- | :----------- | :-------------- |
| `session-start` | `SessionStart` | No (drains then ignores) | `SessionStart` `additionalContext` envelope wrapped in `<EXTREMELY_IMPORTANT>` blocks |
| `pre-commit-message` | `PreToolUse(Bash)` | Yes (PreToolUse envelope) | `permissionDecision: deny` / `additionalContext` advise / silent |
| `post-commit-verify` | `PostToolUse(Bash)` | Yes (PostToolUse envelope, mostly ignored) | `additionalContext` advise (or silent) |
| `user-prompt-submit` | `UserPromptSubmit` | Yes (UserPromptSubmit envelope) | `additionalContext` reminder (or silent) |

Each subcommand provides the `HookSilencer` Layer (`package/src/hook/silence-logger.ts`)
on top of the root `StderrLogger` so its handler can never print to stdout
through Effect's default logger.

The `pre-commit-message` and `post-commit-verify` handlers compose a small
rule pipeline. Each rule is a typed `Rule<Input, Ctx>` that returns
`Effect.Effect<RuleHit | null>`. Rules are partitioned by severity (`deny` /
`advise`); `deny` hits collapse into a single PreToolUse `deny` envelope,
`advise` hits collapse into a single `additionalContext` envelope.

| Rule (`package/src/hook/rules/`) | Severity | Purpose |
| :-------------------------------- | :------- | :------ |
| `forbidden-content` | deny | Markdown headers (`#`) or code fences (` ``` `) in the body. |
| `signing-flag-conflict` | deny | `--no-gpg-sign` while `commit.gpgsign=true` is configured. |
| `plan-leakage` | advise | `.claude/plans/` / `.claude/design/` paths or planning narrative in the body. |
| `soft-wrap` | advise | A short bullet (`- ...`, < 80 chars) followed by an indented continuation line. |
| `verbosity` | advise | Body exceeds 25 non-empty lines or 400 words. |
| `closes-trailer` | advise | Branch encodes a ticket id but the body has no `Closes/Fixes/Resolves #N`. |

The bash command parser (`package/src/hook/parse-bash-command.ts`) uses
`shell-quote` to tokenize commands and recognises `git commit`,
`git commit --amend`, `gh pr create`, and `gh pr edit`. It extracts the
combined message (multiple `-m` / `--message[=...]` flags joined with double
newlines, or `--body` for `gh pr`) plus signing/no-verify/amend flags.
Compound shapes like `cmd && git commit -m "x"` are intentionally classified
as `unknown` — silently dropping them is safer than misattributing extracted
state.

Diagnostics shared across subcommands (`package/src/hook/diagnostics/`):

- `branch.ts` — current branch via `git rev-parse --abbrev-ref HEAD` plus an
  inferred ticket id parsed from `^[a-z]+/(\d+)[-/_]` style branch names.
- `signing.ts` — reads `gpg.format`, `commit.gpgsign`, `user.signingkey`, and
  `gpg.ssh.allowedSignersFile` from git config; verifies key resolution
  (`stat` for SSH keys, `gpg --list-secret-keys` for GPG); pings
  `gpg-connect-agent` for agent responsiveness; aggregates warnings.
- `cache.ts` — generic JSON file cache with TTL, atomic-ish writes
  (`mkdir -p`, write to `.tmp`, rename).
- `open-issues.ts` — fetches up to 20 open issues via
  `gh issue list ... --json number,title`, caches at
  `.claude/cache/issues.json` for 600 s. SessionStart fetches; PreToolUse
  reads the cache only (never network).

---

## Plugin Hook Architecture

The companion `commitlint` Claude Code plugin (`plugin/`) is registered as a
sidecar that informs the agent about commit conventions and validates
commit-related Bash invocations. Phase 8 of this work added `PreToolUse`,
`PostToolUse`, and `UserPromptSubmit` hooks on top of the original
`SessionStart` hook, and refactored every hook into a thin bash shim that
delegates to the `savvy-commit hook` CLI subcommand tree.

### Hook Registration

`plugin/hooks/hooks.json` registers the following matchers:

| Event | Matcher | Shim | Purpose |
| :---- | :------ | :--- | :------ |
| `SessionStart` | `startup` | `session-start.sh` | Inject commit conventions, quality charter, branch context, signing diagnostic |
| `PreToolUse` | `Bash` | `pre-tool-use-bash.sh` | Auto-allow safe Bash; validate commit messages |
| `PreToolUse` | `mcp__gk__.*\|mcp__github(-[^_]+)?__.*` | `pre-tool-use-mcp.sh` | Auto-allow curated GitHub / GitKraken MCP ops |
| `PreToolUse` | `Read\|Write\|Edit` | `pre-tool-use-fs.sh` | Auto-allow Read/Write/Edit under `.claude/cache/` |
| `PostToolUse` | `Bash` | `post-tool-use-bash.sh` | Replay commitlint, verify signature, check Closes trailer |
| `UserPromptSubmit` | (any) | `user-prompt-submit.sh` | Inject commit-quality reminder when prompt mentions commits |

### Two-Tier Bash Hook (Hot Path / Cold Path)

`pre-tool-use-bash.sh` uses a two-tier strategy to keep latency low while
still gating commit-related commands:

1. **Hot path (auto-allow)** — `lib/match-safe-bash.sh` runs the command
   against `lib/safe-bash-patterns.txt` (POSIX-ERE regex allow-list, Tier A
   read-only + Tier B workflow-essential). Hard exclusions (`rm`, `curl`,
   `git push --force`, package installers, `npx` / `bunx` / `yarn dlx`,
   `gh repo delete`, `gh secret`) are evaluated first. If matched, the hook
   emits `permissionDecision: allow` and exits without invoking the CLI.
   `git commit`, `gh pr create`, and `gh pr edit` are intentionally excluded
   from the allow-list so they fall through to the cold path.

2. **Cold path (validate)** — `lib/is-commit-related.sh` checks whether the
   command begins with `git commit` or `gh pr create|edit`. If yes, the
   envelope is piped to `savvy-commit hook pre-commit-message`; otherwise
   the hook silently exits with code 0 and Claude's normal permission flow
   applies.

`lib/run-cli.sh` detects the package manager from `package.json#packageManager`
or lockfile presence (`pnpm-lock.yaml` / `yarn.lock` / `bun.lock`) and emits
the correct runner prefix (`pnpm exec` / `yarn exec` / `bunx` / `npx --no --`).
All shims that need the CLI consume this script's stdout to construct their
invocation.

### MCP and Filesystem Auto-Allow

`pre-tool-use-mcp.sh` handles three MCP server name shapes:
`mcp__gk__<op>` (GitKraken), `mcp__github__<op>` (default GitHub MCP), and
`mcp__github-<scope>__<op>` (scoped GitHub MCP, e.g.,
`mcp__github-savvy-web__`). It strips the prefix to recover the operation
name and matches it against the appropriate `safe-mcp-{github,gk}-ops.txt`
file. Comments and blank lines are skipped; matching is exact-line.

`pre-tool-use-fs.sh` resolves `tool_input.file_path` against
`CLAUDE_PROJECT_DIR` (when relative) and auto-allows any path under
`<project>/.claude/cache/`. The cache directory is also where the open-issues
cache and any future plugin caches live.

### PostToolUse and UserPromptSubmit

`post-tool-use-bash.sh` short-circuits unless the just-executed command is
commit-related and the response was not interrupted. It then forwards the
envelope to `savvy-commit hook post-commit-verify`, which:

1. Replays `pnpm exec commitlint --last` (errors → "commitlint failed").
2. Reads `git log -1 --format=%G?` (signature status) and combines with the
   signing diagnostic to advise on unsigned commits when
   `commit.gpgsign=true`, or on bad/expired/revoked/missing-key statuses.
3. If the branch implies a ticket id and the commit body has no
   `Closes/Fixes/Resolves #N` trailer, advises an `--amend --trailer` fix.

`user-prompt-submit.sh` runs a regex pre-filter
(`commit | committing | ship it | wrap up | create/open a pr | finalize | squash | amend`)
to skip the CLI for prompts that don't mention commits at all. When the
trigger matches, it forwards to `savvy-commit hook user-prompt-submit`,
which re-applies the same regex (canonical owner of the trigger pattern)
and emits a compact reminder block.

### Test Harness

The bash hooks are exercised via a `bats` harness in
`plugin/hooks/__test__/`. `lib/` helpers have dedicated specs
(`is-commit-related.bats`, `match-safe-bash.bats`, `run-cli.bats`) and the
`pre-tool-use-{bash,mcp,fs}` shims have integration specs that fixture
envelope JSON and assert the emitted `permissionDecision` envelope.
Hooks are run without an executable bit so they remain `bash <script>` from
`hooks.json`; the harness invokes them the same way.

---

## Configuration Options

### Commit Types

| Type | Emoji | Description | Example |
| :--- | :---- | :---------- | :------ |
| `ai` | 🤖 | AI/LLM agent updates | `ai: update CLAUDE.md context` |
| `feat` | ✨ | New feature | `feat: add user authentication` |
| `fix` | 🐛 | Bug fix | `fix: resolve memory leak in cache` |
| `docs` | 📝 | Documentation | `docs: update API reference` |
| `style` | 💄 | Formatting | `style: fix indentation in utils` |
| `refactor` | ♻️ | Code restructure | `refactor: extract validation logic` |
| `perf` | ⚡ | Performance | `perf: optimize database queries` |
| `test` | ✅ | Tests | `test: add unit tests for parser` |
| `build` | 📦 | Build system | `build: update webpack configuration` |
| `ci` | 👷 | CI/CD | `ci: add GitHub Actions workflow` |
| `chore` | 🔧 | Maintenance | `chore: update dependencies` |
| `revert` | ⏪ | Revert | `revert: undo last commit` |
| `release` | 🔖 | Release | `release: v1.2.0` |

### Emoji Definitions

The prompt module provides both GitHub shortcodes (for markdown rendering) and
Unicode emojis (for terminal display):

```typescript
// package/src/prompt/emojis.ts

// GitHub/GitLab shortcodes (render in markdown)
export const TYPE_EMOJIS = {
  ai: ":robot:",
  feat: ":sparkles:",
  fix: ":bug:",
  docs: ":memo:",
  style: ":lipstick:",
  refactor: ":recycle:",
  perf: ":zap:",
  test: ":white_check_mark:",
  build: ":package:",
  ci: ":construction_worker:",
  chore: ":wrench:",
  revert: ":rewind:",
  release: ":bookmark:",
} as const;

// Unicode emojis (render in terminals)
export const TYPE_EMOJIS_UNICODE = {
  ai: "🤖",
  feat: "✨",
  fix: "🐛",
  docs: "📝",
  style: "💄",
  refactor: "♻️",
  perf: "⚡",
  test: "✅",
  build: "📦",
  ci: "👷",
  chore: "🔧",
  revert: "⏪",
  release: "🔖",
} as const;
```

The interactive prompt uses Unicode emojis for proper terminal rendering.

### Rule Configuration

| Rule | Level | Applicability | Value |
| :--- | :---- | :------------ | :---- |
| `body-max-line-length` | error | always | 300 (configurable) |
| `type-enum` | error | always | [see types above] |
| `scope-enum` | error | always | [auto-detected or provided] |
| `signed-off-by` | error | always | "Signed-off-by:" (if DCO enabled) |

### Extending the Configuration

Projects can extend and override via options:

```typescript
// commitlint.config.ts
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk({
  // Override auto-detection
  dco: true,

  // Add custom scopes (merged with auto-detected)
  additionalScopes: ["deps", "config"],

  // Override body length
  bodyMaxLineLength: 500,

  // Enable emojis
  emojis: true,

  // Force specific release format
  releaseFormat: "semver",
});
```

Or use static config with manual overrides:

```typescript
// commitlint.config.ts
import staticConfig from "@savvy-web/commitlint/static";

export default {
  ...staticConfig,
  rules: {
    ...staticConfig.rules,
    "scope-enum": [2, "always", ["api", "cli", "core", "docs"]],
  },
};
```

---

## Peer Dependencies

### Required Peers

```json
{
  "peerDependencies": {
    "@commitlint/cli": "^20.5.0",
    "@commitlint/config-conventional": "^20.5.0",
    "commitizen": "^4.3.1",
    "husky": "^9.1.0"
  }
}
```

- `@commitlint/cli` and `@commitlint/config-conventional` are required
- `commitizen` is required (for interactive commits using built-in adapter)
- `husky` is required for git hooks

Users who prefer `@commitlint/cz-commitlint` can install it separately.

### Direct Dependencies

```json
{
  "dependencies": {
    "@savvy-web/silk-effects": "^0.2.2",
    "workspaces-effect": "^0.3.0",
    "shell-quote": "^1.8.3",
    "zod": "^4.3.6"
  }
}
```

Note: `workspace-tools` has been fully removed. Its functionality is replaced
by `workspaces-effect` (for workspace/scope discovery) and
`@savvy-web/silk-effects` (for managed sections and versioning strategy).
`shell-quote` was added in 0.7.0 to tokenize Bash command strings inside the
`hook` subcommand tree's commit-message parser.

### CLI Dependencies (bundled via Effect catalog)

```json
{
  "dependencies": {
    "@effect/cli": "catalog:silk",
    "@effect/platform": "catalog:silk",
    "@effect/platform-node": "catalog:silk",
    "effect": "catalog:silk"
  }
}
```

### Version Compatibility

- **Minimum Version**: commitlint v18.0.0 (Node.js 18+ requirement)
- **Tested With**: commitlint v19.x, v20.x
- **ESM Support**: Full ESM and CJS dual-package support

---

## Integration

### Installation in Consuming Projects

```bash
# Install the config and required peers
pnpm add -D @savvy-web/commitlint @commitlint/cli @commitlint/config-conventional husky

# Optional: for interactive commits
pnpm add -D commitizen
```

### Quick Setup with CLI

```bash
# Bootstrap everything automatically
npx savvy-commit init

# Check current configuration
npx savvy-commit check
```

### Manual Configuration File

Create `commitlint.config.ts`:

```typescript
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
```

Or for static config without detection:

```typescript
export { default } from "@savvy-web/commitlint/static";
```

### Husky Integration

Run `savvy-commit init` to generate `.husky/commit-msg` with a managed section.
The generated hook auto-detects the package manager and uses the correct
`dlx`/`npx` equivalent. Users can add custom hooks above or below the managed
section markers without them being overwritten on subsequent `init` runs.

```bash
#!/usr/bin/env sh
# Custom hooks can go here (above managed section)

# --- BEGIN SAVVY-COMMIT MANAGED SECTION ---
# DO NOT EDIT between these markers - managed by savvy-commit
if ! { [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; }; then
  # ... package manager detection and commitlint invocation ...
fi
# --- END SAVVY-COMMIT MANAGED SECTION ---

# Custom hooks can go here (below managed section)
```

### Formatter Configuration

Use the custom formatter for better error messages:

```typescript
// commitlint.config.ts
import { CommitlintConfig } from "@savvy-web/commitlint";

export default {
  ...CommitlintConfig.silk(),
  formatter: "@savvy-web/commitlint/formatter",
};
```

### Prompt Setup (Interactive Commits)

The package includes a built-in commitizen adapter for interactive commits.
Add to `package.json`:

```json
{
  "config": {
    "commitizen": {
      "path": "@savvy-web/commitlint/prompt"
    }
  },
  "scripts": {
    "commit": "cz"
  }
}
```

Then stage changes and run:

```bash
git add .
pnpm commit
```

The interactive prompt displays:

- Type selection with Unicode emojis (🤖, ✨, 🐛, etc.)
- Scope selection (from detected workspace packages)
- Subject input with validation
- Optional body and breaking change prompts
- Issue reference prompts

**Alternative: Use `@commitlint/cz-commitlint`**

If you prefer the standard commitlint adapter that reads configuration from your
commitlint config file, install it separately:

```bash
pnpm add -D @commitlint/cz-commitlint
```

Then configure:

```json
{
  "config": {
    "commitizen": {
      "path": "@commitlint/cz-commitlint"
    }
  }
}
```

The `CommitlintConfig.silk()` factory includes full prompt configuration in the
`prompt` section, which `@commitlint/cz-commitlint` will read automatically.

### Monorepo Template Integration

Update the consuming project's `lib/configs/commitlint.config.ts`:

```typescript
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
```

---

## Testing Strategy

### Unit Tests

**Location:** Co-located test files (`package/src/**/*.test.ts`)

**Config Factory Tests:**

```typescript
import { describe, it, expect } from "vitest";
import { CommitlintConfig } from "../index.js";

describe("CommitlintConfig.silk()", () => {
  it("creates valid commitlint config", () => {
    const config = CommitlintConfig.silk();

    expect(config).toHaveProperty("extends");
    expect(config).toHaveProperty("rules");
    expect(config.extends).toContain("@commitlint/config-conventional");
  });

  it("respects dco option", () => {
    const withDco = CommitlintConfig.silk({ dco: true });
    const withoutDco = CommitlintConfig.silk({ dco: false });

    expect(withDco.rules?.["signed-off-by"]).toBeDefined();
    expect(withoutDco.rules?.["signed-off-by"]).toBeUndefined();
  });

  it("includes custom scopes", () => {
    const config = CommitlintConfig.silk({
      scopes: ["api", "cli"],
    });

    expect(config.rules?.["scope-enum"]).toEqual([
      2, "always", ["api", "cli"],
    ]);
  });
});
```

**Detection Tests:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { detectDCO } from "../detection/dco.js";

describe("detectDCO", () => {
  const testDir = "/tmp/commitlint-test";

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns true when DCO file exists", () => {
    writeFileSync(join(testDir, "DCO"), "Developer Certificate of Origin");
    expect(detectDCO(testDir)).toBe(true);
  });

  it("returns false when DCO file does not exist", () => {
    expect(detectDCO(testDir)).toBe(false);
  });
});
```

### Integration Tests

**Location:** Co-located test files or dedicated integration test directory

```typescript
import { describe, it, expect } from "vitest";
import lint from "@commitlint/lint";
import { CommitlintConfig } from "../../index.js";

describe("commitlint integration", () => {
  const config = CommitlintConfig.silk({ dco: true });

  it("accepts valid conventional commit with signoff", async () => {
    const result = await lint(
      "feat: add new feature\n\nSigned-off-by: Test <test@example.com>",
      config.rules!,
    );
    expect(result.valid).toBe(true);
  });

  it("rejects commit without signoff when DCO enabled", async () => {
    const result = await lint("feat: add new feature", config.rules!);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ name: "signed-off-by" }),
    );
  });

  it("accepts all defined commit types", async () => {
    const types = [
      "build", "chore", "ci", "docs", "feat", "fix",
      "perf", "refactor", "release", "revert", "style", "test",
    ];

    for (const type of types) {
      const result = await lint(
        `${type}: test commit\n\nSigned-off-by: Test <test@example.com>`,
        config.rules!,
      );
      expect(result.valid).toBe(true);
    }
  });

  it("rejects unknown commit type", async () => {
    const result = await lint(
      "unknown: test commit\n\nSigned-off-by: Test <test@example.com>",
      config.rules!,
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ name: "type-enum" }),
    );
  });
});
```

---

## Future Enhancements

### Phase 1: Core Release

- [x] Dynamic configuration factory
- [x] DCO auto-detection
- [x] Scope auto-detection from workspaces
- [x] Versioning strategy detection
- [x] Zod schema validation
- [x] Static config export
- [x] Custom formatter with explanations
- [x] Prompt configuration with emojis
- [x] Custom commitizen adapter (`prompter` function)
- [x] Unicode emojis for terminal display
- [x] Markdown rejection rules (with list allowance)
- [x] Custom plugin system (`silk/` namespaced rules)
- [x] TypeScript types
- [x] CLI init command (managed section pattern)
- [x] CLI check command (managed section status reporting)
- [ ] Documentation

### Phase 2: Enhanced CLI

- [ ] `migrate` command for converting from other configs
- [ ] `lint` command wrapper with better output
- [ ] `scope` command to list detected scopes
- [ ] Shell completions

### Phase 3: AI Integration

- [ ] AI mode for generating commit messages from staged changes
- [ ] AI validation suggestions for failed commits
- [x] Integration with Claude Code hooks (SessionStart, PreToolUse Bash/MCP/FS, PostToolUse Bash, UserPromptSubmit)
- [x] LLM-friendly error messages (deny/advise rule pipeline with actionable remediation)
- [x] `savvy-commit hook` internal subcommand tree consumed by the companion plugin's bash shims
- [x] Branch + ticket-id inference and Closes-trailer advisory
- [x] GPG / SSH signing diagnostic emitted in SessionStart context
- [x] Cached open-issues lookup at `.claude/cache/issues.json`

### Phase 4: Advanced Features

- [ ] GitHub Action for PR commit validation
- [ ] VS Code extension integration
- [ ] Scope suggestions based on changed files
- [ ] Commit message templates

---

## Related Documentation

**Internal Design Docs:**

- None yet (this is the first design doc for commitlint)

**Implementation Plans:**

- `.claude/plans/wondrous-purring-bee.md` - Add managed section to
  savvy-commit init hook (completed)
- `.claude/plans/2026-04-28-commit-hooks-upgrade.md` - Add `savvy-commit hook`
  subcommand tree, six commit-quality rules, the bash shim hook architecture,
  and richer SessionStart context (completed; see
  `docs/superpowers/specs/2026-04-28-commit-hooks-upgrade-design.md` for the
  full spec)

**Package Documentation:**

- `package/README.md` - Package overview (Level 1)
- `README.md` - Repository root README
- `CONTRIBUTING.md`, `SECURITY.md`, and `docs/` remain at the repo root

**External Resources:**

- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Developer Certificate of Origin](https://developercertificate.org/)
- [@savvy-web/silk-effects](https://github.com/savvy-web/silk-effects) -
  Managed sections and versioning strategy services
- [workspaces-effect](https://github.com/savvy-web/workspaces-effect) -
  Effect-based workspace discovery
- [Effect CLI](https://effect.website/docs/platform/cli)
- [Zod](https://zod.dev/)

---

**Document Status:** Current - Core implementation complete, CLI implemented,
migrated to silk-effects, plugin hook architecture extended (Phase 8).

**Completed:**

1. ~~Create the package directory structure~~
2. ~~Move `detect-versioning-strategy.ts` to detection module~~
3. ~~Implement configuration factory with Zod schemas~~
4. ~~Implement detection modules (DCO, scopes, versioning)~~
5. ~~Implement prompt configuration with emojis~~
6. ~~Implement custom formatter~~
7. ~~Implement custom commitizen adapter~~
8. ~~Implement custom plugin system (`silk/` rules)~~
9. ~~Implement CLI init command (managed section pattern)~~
10. ~~Implement CLI check command (managed section status)~~
11. ~~Migrate from workspace-tools to silk-effects/workspaces-effect~~
12. ~~Delete versioning detection module (replaced by VersioningStrategy service)~~
13. ~~Make scope detection effectful (WorkspaceDiscovery)~~
14. ~~Inline findProjectRoot for DCO detection~~
15. ~~Compose CLI layer stack with all silk-effects services~~
16. ~~Add `savvy-commit hook` internal subcommand tree (session-start,
    pre-commit-message, post-commit-verify, user-prompt-submit)~~
17. ~~Add `package/src/hook/` helpers (envelope schemas, output builders,
    bash command parser, rule pipeline, diagnostics, file cache)~~
18. ~~Implement six commit-quality rules (forbidden-content, plan-leakage,
    soft-wrap, verbosity, closes-trailer, signing-flag-conflict)~~
19. ~~Refactor `plugin/hooks/session-start.sh` as CLI shim; add four new bash
    hooks (pre-tool-use-{bash,mcp,fs}, post-tool-use-bash, user-prompt-submit)
    with a bats harness~~
20. ~~Add `lib/run-cli.sh` package-manager detection helper and shared
    safe-bash / safe-mcp allow-lists~~
21. ~~Route Effect logger output to stderr at Warning+ so hook subcommands
    keep stdout pristine~~

**Next Steps:**

1. Add comprehensive integration tests
2. Publish to npm registries
3. Update monorepo template to use the package
4. Add shell completions for CLI
5. Implement `migrate` command for converting from other configs
6. Stabilise the `savvy-commit hook` JSON envelope contract before 1.0
