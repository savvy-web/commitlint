---
status: draft
module: commitlint
category: architecture
created: 2026-02-02
updated: 2026-02-02
last-synced: 2026-02-02
completeness: 70
related: []
dependencies:
  - workspace-tools
  - "@effect/cli"
  - "@effect/platform-node"
  - effect
  - zod
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

```text
pkgs/commitlint/
  src/
    index.ts                    # Main entry: CommitlintConfig factory
    static.ts                   # Static config export (no detection)

    config/
      factory.ts                # CommitlintConfig.silk() implementation
      schema.ts                 # Zod schemas for config options
      types.ts                  # TypeScript type definitions
      rules.ts                  # Rule definitions and defaults

    detection/
      index.ts                  # Detection barrel export
      dco.ts                    # DCO file detection
      scopes.ts                 # Workspace package scope detection
      versioning.ts             # Release format detection

    prompt/
      index.ts                  # Prompt configuration factory
      config.ts                 # Base prompt configuration
      emojis.ts                 # Emoji definitions for types
      types.ts                  # Prompt type definitions

    formatter/
      index.ts                  # Custom formatter entry
      format.ts                 # Formatting implementation
      messages.ts               # Error message templates

    cli/
      index.ts                  # Effect CLI entry point
      commands/
        index.ts                # Commands barrel
        init.ts                 # Bootstrap husky hooks
        check.ts                # Validate current setup
        migrate.ts              # Migrate from other configs

    __tests__/
      config.test.ts            # Config factory tests
      detection.test.ts         # Detection tests
      formatter.test.ts         # Formatter tests
      integration/
        lint.test.ts            # Integration with commitlint

  bin/
    cli.ts                      # CLI bin entry point

  package.json
  tsconfig.json
  rslib.config.ts
  README.md
  CLAUDE.md
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

```typescript
// src/index.ts
import { z } from "zod";
import { createConfig } from "./config/factory.js";
import { ConfigOptionsSchema } from "./config/schema.js";
import type { ConfigOptions, CommitlintUserConfig } from "./config/types.js";

export type { ConfigOptions, CommitlintUserConfig };

/**
 * Dynamic commitlint configuration factory.
 *
 * @example
 * ```typescript
 * import { CommitlintConfig } from "@savvy-web/commitlint";
 *
 * // Auto-detect everything
 * export default CommitlintConfig.silk();
 *
 * // With overrides
 * export default CommitlintConfig.silk({
 *   dco: true,
 *   emojis: true,
 *   scopes: ["api", "cli"],
 * });
 * ```
 */
export const CommitlintConfig = {
  /**
   * Create a commitlint configuration with auto-detection.
   *
   * @param options - Optional configuration overrides
   * @returns Commitlint UserConfig object
   */
  silk(options: ConfigOptions = {}): CommitlintUserConfig {
    const validated = ConfigOptionsSchema.parse(options);
    return createConfig(validated);
  },
} as const;

export default CommitlintConfig;
```

### Configuration Schema

```typescript
// src/config/schema.ts
import { z } from "zod";

/**
 * Release format for the release commit type.
 * - "semver": release: v1.2.3
 * - "packages": release: version packages
 * - "scoped": release(pkg): v1.2.3
 */
export const ReleaseFormatSchema = z.enum(["semver", "packages", "scoped"]);

/**
 * Configuration options for CommitlintConfig.silk()
 */
export const ConfigOptionsSchema = z.object({
  /**
   * Enable DCO signoff requirement.
   * - true: Always require signoff
   * - false: Never require signoff
   * - undefined: Auto-detect from DCO file presence
   */
  dco: z.boolean().optional(),

  /**
   * Allowed scopes for commits.
   * - string[]: Merge with auto-detected scopes
   * - undefined: Auto-detect from workspace packages
   */
  scopes: z.array(z.string()).optional(),

  /**
   * Additional scopes to add (does not replace auto-detected).
   */
  additionalScopes: z.array(z.string()).optional(),

  /**
   * Release commit format.
   * - "semver": release: v1.2.3
   * - "packages": release: version packages
   * - "scoped": release(pkg): v1.2.3
   * - undefined: Auto-detect from versioning strategy
   */
  releaseFormat: ReleaseFormatSchema.optional(),

  /**
   * Enable emojis in prompt configuration.
   * @default false
   */
  emojis: z.boolean().default(false),

  /**
   * Maximum body line length.
   * @default 300
   */
  bodyMaxLineLength: z.number().positive().default(300),

  /**
   * Working directory for detection.
   * @default process.cwd()
   */
  cwd: z.string().optional(),
});

export type ConfigOptions = z.input<typeof ConfigOptionsSchema>;
export type ResolvedConfigOptions = z.output<typeof ConfigOptionsSchema>;
```

### Factory Implementation

```typescript
// src/config/factory.ts
import type { UserConfig } from "@commitlint/types";
import { detectDCO } from "../detection/dco.js";
import { detectScopes } from "../detection/scopes.js";
import { detectReleaseFormat } from "../detection/versioning.js";
import type { ResolvedConfigOptions } from "./schema.js";
import { COMMIT_TYPES } from "./rules.js";

export function createConfig(options: ResolvedConfigOptions): UserConfig {
  const cwd = options.cwd ?? process.cwd();

  // Auto-detect settings
  const dco = options.dco ?? detectDCO(cwd);
  const detectedScopes = detectScopes(cwd);
  const scopes = options.scopes ?? detectedScopes;
  const allScopes = [...new Set([...scopes, ...(options.additionalScopes ?? [])])];
  const releaseFormat = options.releaseFormat ?? detectReleaseFormat(cwd);

  const rules: UserConfig["rules"] = {
    // Increase body line length for detailed commit messages
    "body-max-line-length": [2, "always", options.bodyMaxLineLength],

    // Extended type enum with release type
    "type-enum": [2, "always", COMMIT_TYPES],
  };

  // Add scope enum if scopes were detected or provided
  if (allScopes.length > 0) {
    rules["scope-enum"] = [2, "always", allScopes];
  }

  // Add DCO signoff rule if enabled
  if (dco) {
    rules["signed-off-by"] = [2, "always", "Signed-off-by:"];
  }

  return {
    extends: ["@commitlint/config-conventional"],
    rules,
    prompt: {
      settings: {
        enableMultipleScopes: true,
        scopeEnumSeparator: ",",
      },
    },
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

```typescript
// src/cli/index.ts
import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";

import { initCommand, checkCommand, migrateCommand } from "./commands/index.js";

const rootCommand = Command.make("savvy-commit").pipe(
  Command.withSubcommands([initCommand, checkCommand, migrateCommand]),
);

const cli = Command.run(rootCommand, {
  name: "savvy-commit",
  version: process.env.__PACKAGE_VERSION__,
});

const main = Effect.suspend(() => cli(process.argv)).pipe(
  Effect.provide(NodeContext.layer),
);

NodeRuntime.runMain(main);
```

### Init Command

```typescript
// src/cli/commands/init.ts
import { Command, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import { Effect } from "effect";

const forceOption = Options.boolean("force").pipe(
  Options.withAlias("f"),
  Options.withDescription("Overwrite existing files"),
  Options.withDefault(false),
);

export const initCommand = Command.make(
  "init",
  { force: forceOption },
  ({ force }) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      // Create .husky/commit-msg if it doesn't exist
      const commitMsgPath = ".husky/commit-msg";
      const commitMsgContent = `#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
`;

      const exists = yield* fs.exists(commitMsgPath);
      if (exists && !force) {
        yield* Effect.logWarning(`${commitMsgPath} already exists. Use --force to overwrite.`);
        return;
      }

      yield* fs.makeDirectory(".husky", { recursive: true });
      yield* fs.writeFileString(commitMsgPath, commitMsgContent);
      yield* Effect.log(`Created ${commitMsgPath}`);

      // Create commitlint.config.ts
      const configPath = "commitlint.config.ts";
      const configContent = `import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
`;

      const configExists = yield* fs.exists(configPath);
      if (configExists && !force) {
        yield* Effect.logWarning(`${configPath} already exists. Use --force to overwrite.`);
        return;
      }

      yield* fs.writeFileString(configPath, configContent);
      yield* Effect.log(`Created ${configPath}`);

      yield* Effect.log("Commitlint configuration initialized successfully!");
    }),
).pipe(Command.withDescription("Initialize commitlint configuration and husky hooks"));
```

### Check Command

```typescript
// src/cli/commands/check.ts
import { Command } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import { Effect } from "effect";

import { detectDCO } from "../../detection/dco.js";
import { detectScopes } from "../../detection/scopes.js";
import { detectReleaseFormat } from "../../detection/versioning.js";

export const checkCommand = Command.make("check", {}, () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const cwd = process.cwd();

    yield* Effect.log("Checking commitlint configuration...\n");

    // Check for config file
    const configFiles = [
      "commitlint.config.ts",
      "commitlint.config.js",
      "commitlint.config.mjs",
      ".commitlintrc.js",
      ".commitlintrc.json",
    ];

    let foundConfig = false;
    for (const file of configFiles) {
      if (yield* fs.exists(file)) {
        yield* Effect.log(`Config file: ${file}`);
        foundConfig = true;
        break;
      }
    }

    if (!foundConfig) {
      yield* Effect.logWarning("No commitlint config file found");
    }

    // Check husky hook
    const huskyHook = ".husky/commit-msg";
    if (yield* fs.exists(huskyHook)) {
      yield* Effect.log(`Husky hook: ${huskyHook}`);
    } else {
      yield* Effect.logWarning("No husky commit-msg hook found");
    }

    // Show detected settings
    yield* Effect.log("\nDetected settings:");
    yield* Effect.log(`  DCO required: ${detectDCO(cwd)}`);
    yield* Effect.log(`  Release format: ${detectReleaseFormat(cwd)}`);

    const scopes = detectScopes(cwd);
    if (scopes.length > 0) {
      yield* Effect.log(`  Detected scopes: ${scopes.join(", ")}`);
    } else {
      yield* Effect.log("  Detected scopes: (none)");
    }
  }),
).pipe(Command.withDescription("Check current commitlint configuration"));
```

---

## Configuration Options

### Commit Types

| Type | Emoji | Description | Example |
| :--- | :---- | :---------- | :------ |
| `feat` | :sparkles: | New feature | `feat: add user authentication` |
| `fix` | :bug: | Bug fix | `fix: resolve memory leak in cache` |
| `docs` | :memo: | Documentation | `docs: update API reference` |
| `style` | :lipstick: | Formatting | `style: fix indentation in utils` |
| `refactor` | :recycle: | Code restructure | `refactor: extract validation logic` |
| `perf` | :zap: | Performance | `perf: optimize database queries` |
| `test` | :white_check_mark: | Tests | `test: add unit tests for parser` |
| `build` | :package: | Build system | `build: update webpack configuration` |
| `ci` | :construction_worker: | CI/CD | `ci: add GitHub Actions workflow` |
| `chore` | :wrench: | Maintenance | `chore: update dependencies` |
| `revert` | :rewind: | Revert | `revert: undo last commit` |
| `release` | :bookmark: | Release | `release: v1.2.0` |

### Emoji Definitions

```typescript
// src/prompt/emojis.ts
export const TYPE_EMOJIS = {
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
```

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
    "@commitlint/cli": ">=18.0.0",
    "@commitlint/config-conventional": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "@commitlint/cz-commitlint": {
      "optional": true
    }
  }
}
```

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
pnpm add -D @savvy-web/commitlint @commitlint/cli

# Optional: for interactive commits
pnpm add -D @commitlint/cz-commitlint commitizen
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

In `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
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

### Prompt Setup (Optional)

For interactive commits with commitizen, add to `package.json`:

```json
{
  "config": {
    "commitizen": {
      "path": "@commitlint/cz-commitlint"
    }
  }
}
```

### Monorepo Template Integration

Update the template's `lib/configs/commitlint.config.ts`:

```typescript
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
```

---

## Testing Strategy

### Unit Tests

**Location:** `pkgs/commitlint/src/__tests__/`

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

**Location:** `pkgs/commitlint/src/__tests__/integration/`

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
- [ ] Custom formatter
- [ ] CLI init/check commands
- [ ] Prompt configuration with emojis
- [ ] TypeScript types
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

**Package Documentation:**

- `pkgs/commitlint/README.md` - Package overview (to be created)
- `pkgs/commitlint/CLAUDE.md` - Development guide (to be created)

**External Resources:**

- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Developer Certificate of Origin](https://developercertificate.org/)
- [workspace-tools](https://github.com/nicolo-ribaudo/workspace-tools)
- [Effect CLI](https://effect.website/docs/platform/cli)
- [Zod](https://zod.dev/)

---

**Document Status:** Draft - Expanded architecture defined, implementation
pending

**Next Steps:**

1. Create the package directory structure
2. Move `detect-versioning-strategy.ts` to detection module
3. Implement configuration factory with Zod schemas
4. Implement detection modules (DCO, scopes, versioning)
5. Implement prompt configuration with emojis
6. Implement custom formatter
7. Implement CLI with Effect
8. Add comprehensive tests
9. Publish to npm registries
10. Update monorepo template to use the package
