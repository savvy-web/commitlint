---
status: current
module: commitlint
category: architecture
created: 2026-02-02
updated: 2026-02-06
last-synced: 2026-02-06
completeness: 90
related: []
dependencies:
  - workspace-tools
  - "@effect/cli"
  - "@effect/platform-node"
  - effect
  - zod
implementation-plans:
  - ../plans/wondrous-purring-bee.md
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
8. [Configuration Options](#configuration-options)
9. [Peer Dependencies](#peer-dependencies)
10. [Integration](#integration)
11. [Testing Strategy](#testing-strategy)
12. [Future Enhancements](#future-enhancements)
13. [Related Documentation](#related-documentation)

Note: The Custom Plugin System and Factory Implementation are subsections of
the Dynamic Configuration API section.

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

### Existing Detection Module

The repository includes `src/detect-versioning-strategy.ts` which provides:

- Workspace detection using `workspace-tools`
- Changeset configuration parsing
- Versioning strategy detection (single, fixed-group, independent)
- Package publishability analysis

This module will be integrated into the commitlint config for intelligent
release scope handling.

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

1. **DCO Detection**: Check for `DCO` file at repo root
2. **Scope Detection**: Use `workspace-tools` to find package names
3. **Versioning Detection**: Analyze changeset config for release format
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

This is a single-package repository. Source code is at the repo root under
`src/`, not in a `pkgs/` subdirectory.

```text
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
    dco.ts                      # DCO file detection
    dco.test.ts                 # DCO detection tests
    scopes.ts                   # Workspace package scope detection
    versioning.ts               # Release format + strategy detection
    utils.ts                    # Detection utility helpers

  prompt/
    index.ts                    # Prompt module exports
    config.ts                   # Prompt configuration for cz-commitlint
    config.test.ts              # Prompt config tests
    emojis.ts                   # Emoji definitions (shortcodes + Unicode)
    prompter.ts                 # Commitizen adapter implementation

  formatter/
    index.ts                    # Custom formatter entry
    format.ts                   # Formatting implementation
    format.test.ts              # Formatter tests
    messages.ts                 # Error message templates

  cli/
    index.ts                    # Effect CLI entry (runCli, exports)
    commands/
      index.ts                  # Commands barrel (init, check)
      init.ts                   # Bootstrap husky hooks (managed section)
      check.ts                  # Validate current setup + managed status

  bin/
    cli.ts                      # CLI bin entry point

package.json
tsconfig.json
rslib.config.ts
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
// src/index.ts
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
// src/config/schema.ts
import { z } from "zod";

export const ReleaseFormatSchema = z.enum(["semver", "packages", "scoped"]);
export type ReleaseFormat = z.infer<typeof ReleaseFormatSchema>;

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
`src/config/plugins.ts` that provides four rules namespaced under `silk/`.
These rules are loaded into the commitlint configuration via the `plugins`
array in the factory output.

```typescript
// src/config/plugins.ts
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

The factory (`src/config/factory.ts`) assembles the full commitlint
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
// src/config/factory.ts
import { detectDCO } from "../detection/dco.js";
import { detectScopes } from "../detection/scopes.js";
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
  const detectedScopes = detectScopes(cwd);
  const scopes = options.scopes ?? detectedScopes;
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

```typescript
// src/detection/dco.ts
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Detect if DCO signoff should be required.
 *
 * Checks for the presence of a DCO file at the repository root.
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns true if DCO file exists
 */
export function detectDCO(cwd: string = process.cwd()): boolean {
  const dcoPath = join(cwd, "DCO");
  return existsSync(dcoPath);
}
```

### Scope Detection

```typescript
// src/detection/scopes.ts
import { findProjectRoot, getWorkspaces } from "workspace-tools";

/**
 * Detect package scopes from workspace configuration.
 *
 * Uses workspace-tools to find all packages and extracts their names
 * as potential commit scopes.
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Array of scope names (package names without scope prefix)
 */
export function detectScopes(cwd: string = process.cwd()): string[] {
  try {
    const root = findProjectRoot(cwd);
    if (!root) return [];

    const workspaces = getWorkspaces(root);
    const scopes: string[] = [];

    for (const workspace of workspaces) {
      const name = workspace.packageJson.name;
      if (!name) continue;

      // Extract scope-friendly name
      // @scope/package-name -> package-name
      // package-name -> package-name
      const scopeName = name.startsWith("@")
        ? name.split("/")[1]
        : name;

      if (scopeName) {
        scopes.push(scopeName);
      }
    }

    return scopes.sort();
  } catch {
    return [];
  }
}
```

### Versioning Strategy Detection

```typescript
// src/detection/versioning.ts
import { detectVersioningStrategy } from "./versioning-strategy.js";
import type { ReleaseFormat } from "../config/schema.js";

/**
 * Detect the appropriate release commit format.
 *
 * - single/fixed-group: "semver" (release: v1.2.3)
 * - independent: "packages" (release: version packages)
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Release format to use
 */
export function detectReleaseFormat(cwd: string = process.cwd()): ReleaseFormat {
  const strategy = detectVersioningStrategy(cwd);

  switch (strategy.type) {
    case "single":
    case "fixed-group":
      return "semver";
    case "independent":
      return "packages";
    default:
      return "semver";
  }
}
```

---

## CLI Tool

### CLI Entry Point

The CLI uses `@effect/cli` with Effect for functional error handling. The
`runCli()` function is exported for the bin entry point. Only `init` and
`check` subcommands are currently implemented (no `migrate` command yet).

```typescript
// src/cli/index.ts
import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { checkCommand, initCommand } from "./commands/index.js";

const rootCommand = Command.make("savvy-commit").pipe(
  Command.withSubcommands([initCommand, checkCommand]),
);

const cli = Command.run(rootCommand, {
  name: "savvy-commit",
  version: process.env.__PACKAGE_VERSION__ ?? "0.0.0",
});

export function runCli(): void {
  const main = Effect.suspend(() => cli(process.argv)).pipe(
    Effect.provide(NodeContext.layer),
  );
  NodeRuntime.runMain(main);
}

export { checkCommand, initCommand, rootCommand };
```

### Init Command - Managed Section Pattern

The init command (`src/cli/commands/init.ts`) uses a **managed section pattern**
with BEGIN/END markers in the husky hook. This allows users to add custom hooks
above or below the managed block without them being overwritten on updates.

**Options:**

- `--force` / `-f`: Overwrite the entire hook file, not just the managed section
- `--config` / `-c`: Relative path for the commitlint config file (default:
  `lib/configs/commitlint.config.ts`)

**Managed Section Markers:**

```bash
# --- BEGIN SAVVY-COMMIT MANAGED SECTION ---
# DO NOT EDIT between these markers - managed by savvy-commit
# ... managed content ...
# --- END SAVVY-COMMIT MANAGED SECTION ---
```

**Key Functions:**

| Function | Purpose |
| :------- | :------ |
| `generateManagedContent(configPath)` | Returns the inner content between markers. Includes package manager detection, CI skip guard, and commitlint invocation. |
| `generateFullHookContent(configPath)` | Wraps managed content with shebang and markers for fresh files. |
| `extractManagedSection(content)` | Parses existing hook file to find `beforeSection`, `managedSection`, `afterSection`, and a `found` flag. |
| `updateManagedSection(existingContent, configPath)` | Replaces existing managed block or appends one if not found. |

The markers and helpers are exported for use by the check command:

```typescript
export { BEGIN_MARKER, END_MARKER, extractManagedSection, generateManagedContent };
```

**CI Skip Guard:**

The managed section uses an `if ! { ... }; then ... fi` pattern instead of
`exit 0` so that user code outside the managed block still runs even in CI:

```bash
if ! { [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; }; then
  # ... commitlint invocation ...
fi
```

**Three-Branch Hook Handling:**

1. **Exists + no force**: Read existing content, update only the managed
   section (preserving user code above/below). Logs "Updated managed section"
   or "Added managed section" as appropriate.
2. **Exists + force**: Overwrite the entire file with
   `generateFullHookContent()`. Logs "Replaced (--force)".
3. **New file**: Create `.husky/` directory and write fresh hook with
   `generateFullHookContent()`. Logs "Created".

The command also handles the commitlint config file creation, respecting the
`--config` path option and creating parent directories as needed.

### Check Command - Managed Section Status

The check command (`src/cli/commands/check.ts`) validates the current commitlint
setup and reports detected settings, including managed section status.

**Imports from init.ts:**

```typescript
import {
  BEGIN_MARKER, END_MARKER,
  extractManagedSection, generateManagedContent,
} from "./init.js";
```

**Key Functions:**

| Function | Purpose |
| :------- | :------ |
| `findConfigFile(fs)` | Searches for commitlint config across 16 possible file names in priority order. |
| `extractConfigPathFromManaged(managedContent)` | Extracts the config path from the `commitlint --config "$ROOT/{path}"` pattern in the managed section. |
| `checkManagedSectionStatus(existingManaged)` | Compares the current managed section against what would be generated to determine if it is up-to-date. |

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
// src/prompt/emojis.ts

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
    "@commitlint/cli": "^20.4.1",
    "@commitlint/config-conventional": "^20.4.1",
    "commitizen": "^4.3.1",
    "husky": "^9.1.7"
  },
  "peerDependenciesMeta": {
    "commitizen": {
      "optional": true
    }
  }
}
```

- `@commitlint/cli` and `@commitlint/config-conventional` are required
- `commitizen` is optional (for interactive commits using built-in adapter)
- `husky` is required for git hooks

Users who prefer `@commitlint/cz-commitlint` can install it separately.

### Direct Dependencies

```json
{
  "dependencies": {
    "workspace-tools": "^0.36.0",
    "zod": "^3.24.0"
  }
}
```

### CLI Dependencies (bundled)

```json
{
  "dependencies": {
    "@effect/cli": "^0.52.0",
    "@effect/platform": "^0.76.0",
    "@effect/platform-node": "^0.72.0",
    "effect": "^3.12.0"
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

**Location:** Co-located test files (`src/**/*.test.ts`)

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
- [ ] Integration with Claude Code hooks
- [ ] LLM-friendly error messages

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

**Package Documentation:**

- `README.md` - Package overview (to be created)

**External Resources:**

- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Developer Certificate of Origin](https://developercertificate.org/)
- [workspace-tools](https://github.com/nicolo-ribaudo/workspace-tools)
- [Effect CLI](https://effect.website/docs/platform/cli)
- [Zod](https://zod.dev/)

---

**Document Status:** Current - Core implementation complete, CLI implemented

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

**Next Steps:**

1. Add comprehensive integration tests
2. Publish to npm registries
3. Update monorepo template to use the package
4. Add shell completions for CLI
5. Implement `migrate` command for converting from other configs
