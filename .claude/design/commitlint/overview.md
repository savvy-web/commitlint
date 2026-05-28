---
status: current
module: commitlint
category: architecture
created: 2026-02-02
updated: 2026-05-27
last-synced: 2026-05-27
completeness: 92
related: []
dependencies:
  - "@savvy-web/silk-effects"
  - workspaces-effect
  - "@effect/cli"
  - "@effect/platform-node"
  - effect
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
the Dynamic Configuration API section. The Shared Managed-Section Model, Init
Command, Check Command and Hook Subcommand Tree are subsections of CLI Tool.

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
- **Effect Schema Validation**: Type-safe configuration with rich error messages

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
- **Managed sections**: `init.ts` and `check.ts` use the `ManagedSection` service
  from `@savvy-web/silk-effects` instead of manual BEGIN/END marker parsing. As of
  silk-effects `^0.5.0`, `init` writes ordered shared sections (`savvy-base` preamble
  plus the one-line `savvy-commit` tool section) via `ManagedSection.syncMany`, and a
  co-owned `savvy-hooks` hygiene section into `.husky/post-checkout` / `.husky/post-merge`
  via `ManagedSection.sync` (see "Init Command" and "Shared Managed-Section Model").
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

### Effect Schema for Configuration Validation

**Context:** How to validate and type configuration?

**Decision:** Use Effect `Schema` for all configuration objects. The package
migrated off `zod` to `Schema` so it depends on a single validation library
(Effect is already a direct dependency for the CLI and detection services), and
`zod` was dropped from dependencies entirely.

**Reasoning:**

1. **Single ecosystem**: One validation library across the package, no zod alongside Effect
2. **Type Safety**: Full TypeScript inference via `Schema.Schema.Type`
3. **Validation**: `Schema.decodeUnknownSync` throws a `ParseError` with a structured message, mirroring the previous zod `.parse()` contract
4. **Defaults**: `Schema.optionalWith(..., { default })` applies defaults during decode

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

The static config includes `silk/tdd-scope: [2, "always"]` so that the `tdd`
scope format is enforced even without a factory call.

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
      schema.ts                   # Effect Schema + ConfigOptions interface + decodeConfigOptions
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
        constants.ts              # Shared constants (CHECK_MARK, WARNING, commit-msg + post-checkout + post-merge paths)
        init.ts                   # Bootstrap husky hooks (savvy-base + savvy-commit + savvy-hooks sections)
        init.test.ts              # Init command tests
        check.ts                  # Validate current setup + per-section health
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
        package-manager.ts        # Detect pm from package.json#packageManager or lockfile (pnpm > yarn > bun > npm)
        commitlint-config.ts      # Extract --config path from .husky/commit-msg managed section
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
    session-start/
      main.sh                     # CLI shim → savvy-commit hook session-start
    pre-tool-use/
      bash.sh                     # Hot path: safe-bash auto-allow; cold path: pre-commit-message
      mcp.sh                      # Auto-allow curated GitHub / GitKraken MCP ops
      fs.sh                       # Auto-allow Read/Write/Edit under .claude/cache/
    post-tool-use/
      bash.sh                     # Cold path: post-commit-verify
    user-prompt-submit/
      main.sh                     # Trigger-regex shim → savvy-commit hook user-prompt-submit
    lib/
      hook-output.sh              # emit_noop / emit_allow / emit_deny / emit_context
      hook-debug.sh               # hook_error / hook_debug (configurable log path)
      run-cli.sh                  # Detect package manager, emit `pnpm exec` / `npx --no --` / etc.
      is-commit-related.sh        # Heuristic: is this `git commit` or `gh pr create|edit`?
      match-safe-bash.sh          # Match command against safe-bash-patterns.txt (with hard exclusions)
      safe-bash-patterns.txt      # POSIX-ERE regex allow-list (Tier A read + Tier B workflow-essential)
      safe-mcp-github-ops.txt     # Allow-list of MCP github(-*) operation suffixes
      safe-mcp-gk-ops.txt         # Allow-list of MCP gk operation suffixes
    fixtures/                     # Shared bats envelope fixtures
    __test__/                     # bats test harness (mirrors event subdirs)
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
import { decodeConfigOptions } from "./config/schema.js";
import type { CommitlintUserConfig } from "./config/types.js";

export type { CommitlintUserConfig, ConfigOptions };

export class CommitlintConfig {
  static silk(options: ConfigOptions = {}): CommitlintUserConfig {
    const validated = decodeConfigOptions(options);
    return createConfig(validated);
  }

  private constructor() {
    // Prevent instantiation - use static methods only
  }
}

export default CommitlintConfig;
```

The module also re-exports all public types, constants, detection utilities,
and schema definitions for consumers who need fine-grained access, including
`TDD_SCOPE_PATTERN` and `TDD_STATES` from `package/src/config/rules.ts` (also
re-exported from `static.ts`).

### Configuration Schema

The configuration uses a dual-definition pattern: an Effect `Schema` for runtime
validation and a manually-written `ConfigOptions` interface for better JSDoc
documentation. The interface is the public-facing type; the schema is decoded
internally by `CommitlintConfig.silk()` (via `decodeConfigOptions`) to validate
and apply defaults. See `package/src/config/schema.ts` for the full schema and
interface.

```typescript
// package/src/config/schema.ts
import { Schema } from "effect";

export type ReleaseFormat = "semver" | "packages" | "scoped";
export const ReleaseFormatSchema = Schema.Literal("semver", "packages", "scoped");

// Internal: Effect Schema for validation and defaults
export const ConfigOptionsSchema = Schema.Struct({
  dco: Schema.optional(Schema.Boolean),
  scopes: Schema.optional(Schema.Array(Schema.String)),
  additionalScopes: Schema.optional(Schema.Array(Schema.String)),
  releaseFormat: Schema.optional(ReleaseFormatSchema),
  emojis: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  bodyMaxLineLength: Schema.optionalWith(Schema.Number.pipe(Schema.positive()), { default: () => 300 }),
  noMarkdown: Schema.optionalWith(Schema.Boolean, { default: () => true }),
  cwd: Schema.optional(Schema.String),
});

// Synchronous decoder used by CommitlintConfig.silk(); throws ParseError on bad input
export const decodeConfigOptions = Schema.decodeUnknownSync(ConfigOptionsSchema);

// Resolved type after decoding applies defaults (internal)
export type ResolvedConfigOptions = Schema.Schema.Type<typeof ConfigOptionsSchema>;
```

The `ConfigOptions` interface (not shown) is manually written rather than
inferred from the schema so it can carry richer JSDoc — `@remarks`,
`@defaultValue` and `@example` tags the schema cannot express. The schema and
interface are kept in sync manually. `decodeConfigOptions` is
`Schema.decodeUnknownSync(ConfigOptionsSchema)`, throwing a `ParseError` on
invalid input to preserve the previous zod `.parse()` throw-on-failure contract.

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
    "silk/tdd-scope": tddScope,
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
| `silk/tdd-scope` | Passes for all non-`tdd` commits. For `tdd` commits, enforces scope format `{goalId}:{state}` matching `TDD_SCOPE_PATTERN` (`/^\d+:(spike\|red\|green\|refactor)$/`). | Always active when scopes are not configured; merged into `silk/scope-enum` when scopes are configured (see factory logic below). |

The `silk/signed-off-by` rule replaces the built-in commitlint `signed-off-by`
rule because the built-in version is case-sensitive, which causes false failures
when tools produce different casing of the trailer.

**`createScopeEnumRule` factory and the single-merged-plugin pattern:**

Commitlint processes the `plugins` array as a list of plugin objects, each with
a `rules` map. When two plugin objects define keys in the same namespace, the
second object's `rules` map entirely overwrites the first — the two maps are not
merged. This means that registering both `silkPlugin` (for `silk/tdd-scope`) and
a second inline plugin object (for `silk/scope-enum`) would cause the second to
clobber the first, silently dropping `silk/tdd-scope`.

To work around this, `plugins.ts` exports `createScopeEnumRule(scopes: string[])`,
a factory that returns a single commitlint rule function handling both tdd-scope
validation and project-scope enum enforcement in one pass. When the factory is
configured with scopes, it produces a single merged plugin object:

```typescript
{
  plugins: [{
    rules: {
      ...silkPlugin.rules,
      "silk/scope-enum": createScopeEnumRule(allScopes),
    },
  }],
}
```

This keeps both `silk/tdd-scope` logic (from `silkPlugin.rules`) and the new
`silk/scope-enum` rule live in a single plugin registration, avoiding the
overwrite bug.

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
6. **Scope branching**: when scopes are configured, the factory disables the
   built-in `scope-enum` and the standalone `silk/tdd-scope`, and instead
   enables `silk/scope-enum` via a single merged plugin that combines
   `silkPlugin.rules` with `createScopeEnumRule(allScopes)`. When no scopes
   are configured, it enables `silk/tdd-scope` directly via `silkPlugin`.
   This avoids the `plugins.local` overwrite bug (see "Custom Plugin System"
   above).

```typescript
// package/src/config/factory.ts (scope-branching excerpt)

if (allScopes.length > 0) {
  // Disable built-in scope-enum; tdd-scope logic is folded into silk/scope-enum
  rules["scope-enum"] = [0];
  rules["silk/tdd-scope"] = [0];
  rules["silk/scope-enum"] = [2, "always"];
  // Single merged plugin — avoids the plugins.local overwrite bug
  plugins = [{ rules: { ...silkPlugin.rules, "silk/scope-enum": createScopeEnumRule(allScopes) } }];
} else {
  // No project scopes: enable silk/tdd-scope directly via silkPlugin
  plugins = [silkPlugin];
}
```

The full factory assembles:

```typescript
// package/src/config/factory.ts
import { detectDCO } from "../detection/dco.js";
import { createPromptConfig } from "../prompt/config.js";
import { createScopeEnumRule, silkPlugin } from "./plugins.js";
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

  let plugins;
  if (allScopes.length > 0) {
    rules["scope-enum"] = [0];
    rules["silk/tdd-scope"] = [0];
    rules["silk/scope-enum"] = [2, "always"];
    plugins = [{ rules: { ...silkPlugin.rules, "silk/scope-enum": createScopeEnumRule(allScopes) } }];
  } else {
    plugins = [silkPlugin];
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
    plugins,
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

### Shared Managed-Section Model

As of silk-effects `^0.5.0`, the husky hooks are composed from **shared**
managed sections that both `@savvy-web/commitlint` and its sibling
`@savvy-web/lint-staged` write idempotently, rather than one combined
commitlint-owned block. silk-effects owns the section generators; this package
only chooses which sections go in which hook and what config path the tool
section pins. There are three section identities:

| Section | Hook(s) | Generator (silk-effects) | Guard | Ownership |
| :------ | :------ | :----------------------- | :---- | :-------- |
| `savvy-base` | `.husky/commit-msg` | `SavvyBaseSection` / `savvyBasePreamble()` | unguarded (pure definitions) | shared base |
| `savvy-commit` | `.husky/commit-msg` | `savvyToolSection("savvy-commit", cmd)` | `in_ci \|\| …` (self-guarded) | this package |
| `savvy-hooks` | `.husky/post-checkout`, `.husky/post-merge` | `SavvyHooksSection` / `savvyHooksHygiene()` | self-guarded against CI | co-owned with `@savvy-web/lint-staged` |

`savvyBasePreamble()` emits the shared preamble — `ROOT=$(git rev-parse --show-toplevel)`,
an `in_ci()` helper, `detect_pm()`, `PM=$(detect_pm)` and a `pm_exec()` helper
standardized on local-exec semantics (`pnpm exec` / `yarn exec` / `bun x` / `npx --no`).
It runs unguarded so the definitions are always in scope; each side-effecting
section then guards itself with `in_ci || …`. This is the inversion of the
earlier single-block design where the whole commitlint block lived behind one
CI guard.

`savvyToolSection("savvy-commit", cmd)` builds a one-line tool section:
`in_ci || pm_exec commitlint --config "$ROOT/<path>" --edit "$1"`. The
`savvy-hooks` hygiene section (`git config core.fileMode false` plus chmod of
tracked `.sh` files, self-guarded against CI) was previously owned by
`@savvy-web/lint-staged`; it is now a shared base concern both packages may
write without conflict.

### Init Command

The init command (`package/src/cli/commands/init.ts`) writes the shared sections
above into the husky hooks via the `ManagedSection` service. See the file for the
exact orchestration; the load-bearing pieces:

**Options:**

- `--force` / `-f`: Overwrite the `.husky/commit-msg` file (header + a fresh
  re-sync of its sections). The hygiene sections in `post-checkout` / `post-merge`
  are never force-reset — they are always `sync`'d idempotently.
- `--config` / `-c`: Relative path for the commitlint config file (default:
  `lib/configs/commitlint.config.ts`). Must be relative to the repo root.

**Key exports (consumed by the check command and tests):**

| Export | Purpose |
| :----- | :------ |
| `SECTION_DEF` | `SectionDefinition.make({ toolName: "savvy-commit" })` — the identity used to read/check/remove the tool section. |
| `savvyCommitBlock(configPath)` | Returns the `savvy-commit` `SectionBlock` for a config path. Check rebuilds this to compare against the on-disk section. |
| `generateManagedContent(configPath)` | `savvyCommitBlock(configPath).content` — retained for the check command and tests. |

**ManagedSection service usage:**

- `ms.syncMany(path, blocks[])` — sync an **ordered** list of sections in one
  pass, preserving user content above, below and between them. Used for
  `.husky/commit-msg`: `[SavvyBaseSection.block(savvyBasePreamble()), savvyCommitBlock(config)]`.
- `ms.sync(path, block)` — sync a single section. Used for the `savvy-hooks`
  hygiene section in `post-checkout` / `post-merge`.
- `ms.check(path, block)` / `ms.read(path, def)` — used by the check command (below).
- `ms.remove(path, def)` — also available from the `^0.5.0` API for tearing a
  section back out.

`init` ensures each hook file exists (writing a shebang header if absent), runs
the relevant sync, then `chmod`s the file executable. The commit-msg sync logs
the per-section tagged results (`Created` / `Updated` / `Unchanged`). It also
creates the commitlint config file, respecting `--config` and creating parent
directories as needed.

Users may add custom commands above, below, or between the managed sections;
the markers are preserved across re-runs.

### Check Command - Per-Section Health

The check command (`package/src/cli/commands/check.ts`) validates the current
commitlint setup, reports detected settings, and checks each shared managed
section independently. It uses `CheckResult`, `ManagedSection`,
`VersioningStrategy` plus the shared section generators
(`SavvyBaseSection` / `savvyBasePreamble`, `SavvyHooksSection` /
`savvyHooksHygiene`) from `@savvy-web/silk-effects`, and `WorkspaceDiscovery`
from `workspaces-effect`.

**Key Functions:**

| Function | Purpose |
| :------- | :------ |
| `findConfigFile(fs)` | Searches for the commitlint config across the `CONFIG_FILES` list in priority order. |
| `extractConfigPathFromManaged(managedContent)` | Extracts the config path from the `commitlint --config "$ROOT/{path}"` pattern, so the rebuilt `savvy-commit` block compares against whatever path is actually pinned. |
| `detectReleaseFormat` | Effect that uses `VersioningStrategy` and `WorkspaceDiscovery` to detect the release format. |

**Section health, factored into the verdict:**

`check` evaluates each section via `ms.check(path, block)`, treating only
`CheckResult.Found` with `isUpToDate` as healthy. A single `sectionsHealthy`
flag accumulates across all sections:

- **`savvy-base`** (in `.husky/commit-msg`): checked against
  `SavvyBaseSection.block(savvyBasePreamble())`.
- **`savvy-commit`** (in `.husky/commit-msg`): the tool section is `read` first
  to recover its pinned config path, then `check`ed against
  `savvyCommitBlock(configPath)`. Missing path or missing section both count as
  unhealthy.
- **`savvy-hooks`** (in `.husky/post-checkout` and `.husky/post-merge`): each
  hygiene hook is checked for existence and against
  `SavvyHooksSection.block(savvyHooksHygiene())`.

Each section reports up-to-date / outdated / not-found. The final verdict is now
`!foundConfig || !hasHuskyHook || !sectionsHealthy` — i.e. a stale or missing
section in **any** of the three hooks makes `check` report "needs configuration",
whereas the earlier verdict only checked config-file and commit-msg-hook
existence.

**Additional Checks:**

- Config file presence (searches the `CONFIG_FILES` list)
- Husky commit-msg hook presence
- Hygiene hook (`post-checkout` / `post-merge`) presence and section freshness
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
| `session-start` | `SessionStart` | No (drains then ignores) | Lightweight `SessionStart` `additionalContext` envelope: a TIER-1 `<EXTREMELY_IMPORTANT>` directive pointing to the `commitlint:commit-create` skill, plus branch context and signing diagnostic. The full commit-message charter now lives in `plugin/skills/commit-create/SKILL.md` (see "Skill-Based Charter" below). |
| `pre-commit-message` | `PreToolUse(Bash)` | Yes (PreToolUse envelope) | `permissionDecision: deny` / `additionalContext` advise / silent |
| `post-commit-verify` | `PostToolUse(Bash)` | Yes (PostToolUse envelope, mostly ignored) | `additionalContext` advise (or silent) |
| `user-prompt-submit` | `UserPromptSubmit` | Yes (UserPromptSubmit envelope) | `additionalContext` reminder redirecting to the `commitlint:commit-create` skill (or silent) |

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
- `package-manager.ts` — detects the package manager for the current repo,
  preferring `package.json#packageManager` and falling back to lockfile
  presence in priority order (`pnpm-lock.yaml` > `yarn.lock` > `bun.lock` >
  `npm`). Used by `post-commit-verify` to build a portable commitlint
  invocation that matches what the husky hook would run.
- `commitlint-config.ts` — parses the `--config` argument out of
  `.husky/commit-msg` (handles `$ROOT/`, `${ROOT}/`, single/double-quoted,
  unquoted, and absolute forms). Returns `null` if the file is absent or
  does not pin a config path. `post-commit-verify` uses this so its replay
  uses the same config the commit-time hook used.

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
| `SessionStart` | `startup` | `session-start/main.sh` | Inject TIER-1 skill directive + branch context + signing diagnostic (full charter deferred to `commitlint:commit-create` skill) |
| `PreToolUse` | `Bash` | `pre-tool-use/bash.sh` | Auto-allow safe Bash; validate commit messages |
| `PreToolUse` | `mcp__gk__.*\|mcp__github(-[^_].*)?__.*` | `pre-tool-use/mcp.sh` | Auto-allow curated GitHub / GitKraken MCP ops |
| `PreToolUse` | `Read\|Write\|Edit` | `pre-tool-use/fs.sh` | Auto-allow Read/Write/Edit under `.claude/cache/` |
| `PostToolUse` | `Bash` | `post-tool-use/bash.sh` | Replay commitlint, verify signature, check Closes trailer |
| `UserPromptSubmit` | (any) | `user-prompt-submit/main.sh` | Inject commit-quality reminder when prompt mentions commits |

### Skill-Based Charter

The full commit-message charter (type enum, tdd scope grammar, subject rules,
body rules, DCO signoff, Closes trailers, signing posture, examples, and
pre-commit checklist) lives in `plugin/skills/commit-create/SKILL.md` under
the `commitlint:commit-create` skill name.

**Why deferred to a skill.** Injecting the full charter at `SessionStart`
consumed significant context budget early — most of which was forgotten by
the time the agent composed a commit hours later. Moving it to a skill
means Claude loads the charter at the moment of need (description-triggered
auto-load on commit intent), not once at session open.

**SessionStart now emits a slim TIER-1 directive.** The new `session-start`
output is approximately 12–15 lines: an `<EXTREMELY_IMPORTANT>` block
directing the agent to invoke `commitlint:commit-create` before any commit,
followed by the branch context block and signing diagnostic block unchanged.
The commit conventions and quality charter blocks are removed from the
`session-start.ts` subcommand.

**UserPromptSubmit reminder.** When the trigger regex fires, the
`user-prompt-submit` subcommand now emits a one-line redirect to the
`commitlint:commit-create` skill rather than the inline reminder block.

**Discoverability.** Claude Code auto-discovers `plugin/skills/<name>/SKILL.md`
files; no manifest update is required. The `description` and `when_to_use`
fields in the skill frontmatter carry enough trigger phrases to fire on commit
intent reliably. The skill is `user-invocable: false` (background-only; it is
not a command for users to invoke directly) so its description stays in
context for Claude's auto-load matching.

### Two-Tier Bash Hook (Hot Path / Cold Path)

`pre-tool-use/bash.sh` uses a two-tier strategy to keep latency low while
still gating commit-related commands:

1. **Hot path (auto-allow)** — `lib/match-safe-bash.sh` runs the command
   against `lib/safe-bash-patterns.txt` (POSIX-ERE regex allow-list, Tier A
   read-only + Tier B workflow-essential). Hard exclusions are evaluated first
   before the allowlist check. In addition to the original exclusions (`rm`,
   `curl`, `git push --force`, package installers, `npx` / `bunx` / `yarn dlx`,
   `gh repo delete`, `gh secret`), two further hard exclusions were added
   (closes #111): (1) `tee` with an absolute path, home-dir expansion (`~`),
   or path traversal (`../`) is denied; (2) shell redirects (`>` or `>>`) to
   absolute paths, home-dir, or traversal are denied. Relative-path usage of
   `tee` and redirects remains unaffected. If matched, the hook emits
   `permissionDecision: allow` and exits without invoking the CLI. `git commit`,
   `gh pr create`, and `gh pr edit` are intentionally excluded from the
   allow-list so they fall through to the cold path.

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

`pre-tool-use/mcp.sh` handles three MCP server name shapes:
`mcp__gk__<op>` (GitKraken), `mcp__github__<op>` (default GitHub MCP), and
`mcp__github-<scope>__<op>` (scoped GitHub MCP, e.g.,
`mcp__github-savvy-web__`). It strips the prefix to recover the operation
name and matches it against the appropriate `safe-mcp-{github,gk}-ops.txt`
file. Comments and blank lines are skipped; matching is exact-line.

`pre-tool-use/fs.sh` resolves `tool_input.file_path` against
`CLAUDE_PROJECT_DIR` (when relative) and auto-allows any path under
`<project>/.claude/cache/`. The cache directory is also where the open-issues
cache and any future plugin caches live.

### PostToolUse and UserPromptSubmit

`post-tool-use/bash.sh` short-circuits unless the just-executed command is
commit-related and the response was not interrupted. It then forwards the
envelope to `savvy-commit hook post-commit-verify`, which:

1. Resolves the repo root (`git rev-parse --show-toplevel`, falling back to
   `process.cwd()`), detects the package manager via
   `diagnostics/package-manager.ts`, and reads the husky-managed config path
   via `diagnostics/commitlint-config.ts`. The pure helper
   `buildCommitlintInvocation(pm, configPath)` then assembles the runner
   prefix (`pnpm exec` / `yarn exec` / `bunx` / `npx --no --`) followed by
   `commitlint --config <path> --last` (omitting `--config` when the husky
   hook has no pinned path). The command is spawned with `cwd: root`. Any
   non-zero exit becomes "commitlint failed".
2. Reads `git log -1 --format=%G?` (signature status) and combines with the
   signing diagnostic to advise on unsigned commits when
   `commit.gpgsign=true`, or on bad/expired/revoked/missing-key statuses.
3. If the branch implies a ticket id and the commit body has no
   `Closes/Fixes/Resolves #N` trailer, advises an `--amend --trailer` fix.

This keeps the verifier's replay consistent with whatever the husky
`commit-msg` hook would actually run, and portable across consumer projects
that use a non-pnpm package manager.

`user-prompt-submit/main.sh` runs a regex pre-filter
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
| `tdd` | 🧪 | TDD cycle step | `tdd(42:red): failing test for parser` |
| `test` | ✅ | Tests | `test: add unit tests for parser` |
| `build` | 📦 | Build system | `build: update webpack configuration` |
| `ci` | 👷 | CI/CD | `ci: add GitHub Actions workflow` |
| `chore` | 🔧 | Maintenance | `chore: update dependencies` |
| `revert` | ⏪ | Revert | `revert: undo last commit` |
| `release` | 🔖 | Release | `release: v1.2.0` |

The `tdd` type requires a scope matching the pattern `{goalId}:{state}` where
`goalId` is a numeric goal identifier and `state` is one of `spike`, `red`,
`green`, or `refactor` (exported as `TDD_STATES`). The full pattern is
`TDD_SCOPE_PATTERN = /^\d+:(spike|red|green|refactor)$/`. Examples:
`tdd(42:red): failing assertion`, `tdd(7:green): make the test pass`.

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
  tdd: ":test_tube:",
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
  tdd: "🧪",
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
    "@savvy-web/silk-effects": "^0.5.0",
    "workspaces-effect": "^1.1.0",
    "shell-quote": "^1.8.4"
  }
}
```

Note: `workspace-tools` has been fully removed. Its functionality is replaced
by `workspaces-effect` (for workspace/scope discovery) and
`@savvy-web/silk-effects` (for managed sections and versioning strategy).
`shell-quote` was added in 0.7.0 to tokenize Bash command strings inside the
`hook` subcommand tree's commit-message parser.

`zod` has been removed: config validation migrated to Effect `Schema` (see
"Effect Schema for Configuration Validation"), so the package no longer carries
a second validation library alongside Effect.

silk-effects `^0.5.0` adds the shared managed-section API consumed by `init`
and `check`: `ManagedSection.syncMany` / `ManagedSection.remove`, the section
generators `SavvyBaseSection` / `savvyBasePreamble`, `SavvyHooksSection` /
`savvyHooksHygiene`, and `savvyToolSection` (see "Shared Managed-Section Model").

workspaces-effect `^1.1.0` adds a `refresh()` method to the `WorkspaceDiscovery`
service; test stubs of the service therefore implement
`refresh: () => Effect.void` alongside the existing methods.

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

Run `savvy-commit init` to generate the husky hooks with shared managed sections.
`.husky/commit-msg` gets the `savvy-base` preamble (package-manager detection plus
`in_ci` / `pm_exec` helpers) followed by the one-line `savvy-commit` tool section
that invokes commitlint. `.husky/post-checkout` and `.husky/post-merge` get the
co-owned `savvy-hooks` hygiene section. Users can add custom hooks above, below,
or between the markers without them being overwritten on subsequent `init` runs.

```bash
#!/usr/bin/env sh
# Custom hooks can go here (above the managed sections)

# --- BEGIN SAVVY-BASE MANAGED SECTION ---
# ROOT, in_ci(), detect_pm(), PM, pm_exec() — shared preamble, runs unguarded
# --- END SAVVY-BASE MANAGED SECTION ---

# --- BEGIN SAVVY-COMMIT MANAGED SECTION ---
in_ci || pm_exec commitlint --config "$ROOT/lib/configs/commitlint.config.ts" --edit "$1"
# --- END SAVVY-COMMIT MANAGED SECTION ---

# Custom hooks can go here (below the managed sections)
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
migrated to silk-effects, plugin hook architecture extended (Phase 8), `tdd`
commit type and `silk/tdd-scope` rule added (feat/tdd branch), husky hooks
split into shared `savvy-base` + `savvy-commit` + co-owned `savvy-hooks` hygiene
sections via silk-effects `^0.5.0` `syncMany`, config validation migrated from
zod to Effect Schema, workspaces-effect bumped to `^1.1.0`.

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
22. ~~Add `tdd` commit type with `TDD_SCOPE_PATTERN` / `TDD_STATES` constants
    and `silk/tdd-scope` custom rule; add `createScopeEnumRule` factory and
    single-merged-plugin pattern to avoid `plugins.local` overwrite bug~~
23. ~~Tighten `match-safe-bash.sh` hard exclusions: deny `tee` and shell
    redirects to absolute / home-dir / traversal paths~~
24. ~~Update `session-start` quality block: no artificial line breaks,
    2-5 line body max, `<skip_in_body>` noise-exclusion list~~
25. ~~Split `.husky/commit-msg` into shared `savvy-base` preamble + one-line
    `savvy-commit` tool section via silk-effects `^0.5.0` `syncMany`; co-own
    `savvy-hooks` hygiene in `.husky/post-checkout` / `.husky/post-merge` with
    `@savvy-web/lint-staged`~~
26. ~~Factor per-section health (`savvy-base` / `savvy-commit` / `savvy-hooks`)
    into `savvy-commit check`'s "configured correctly" verdict~~
27. ~~Migrate `package/src/config/schema.ts` off zod to Effect `Schema`; expose
    synchronous `decodeConfigOptions` from `CommitlintConfig.silk()`; drop
    `zod` dependency~~
28. ~~Bump `workspaces-effect` to `^1.1.0` (new `WorkspaceDiscovery.refresh()`
    method, reflected in test stubs)~~

**Next Steps:**

1. Add comprehensive integration tests
2. Publish to npm registries
3. Update monorepo template to use the package
4. Add shell completions for CLI
5. Implement `migrate` command for converting from other configs
6. Stabilise the `savvy-commit hook` JSON envelope contract before 1.0
