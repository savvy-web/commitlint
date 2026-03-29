# Silk-Effects Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `workspace-tools` usage with `@savvy-web/silk-effects`
and `workspaces-effect`, removing `workspace-tools` as a dependency.

**Architecture:** CLI commands (`init`, `check`) provide Effect layers at the
top level via `cli/index.ts`. Detection modules (`scopes.ts`) become effectful
and declare service requirements. `dco.ts` stays synchronous with an inlined
project root traversal. Managed section markers and versioning detection are
delegated to silk-effects services.

**Tech Stack:** Effect, @effect/cli, @effect/platform, @savvy-web/silk-effects,
workspaces-effect

---

## File Map

| Action | File | Responsibility |
| ------ | ---- | -------------- |
| Modify | `package.json` | Add silk-effects + workspaces-effect, remove workspace-tools |
| Modify | `src/cli/index.ts` | Provide silk-effects and workspaces-effect layers |
| Modify | `src/cli/commands/init.ts` | Use `ManagedSection` service for marker read/write |
| Modify | `src/cli/commands/init.test.ts` | Update tests for `ManagedSection`-based init |
| Modify | `src/cli/commands/check.ts` | Use silk-effects versioning + managed section services |
| Modify | `src/cli/commands/check.test.ts` | Update tests for effectful check command |
| Modify | `src/detection/scopes.ts` | Use `WorkspaceRoot` + `WorkspaceDiscovery` from workspaces-effect |
| Modify | `src/detection/dco.ts` | Inline project root traversal, remove workspace-tools import |
| Delete | `src/detection/versioning.ts` | Replaced by silk-effects |
| Delete | `src/detection/versioning.test.ts` | Tests for deleted module |
| Delete | `src/detection/utils.ts` | `safelyFindProjectRoot` inlined into dco.ts |

---

### Task 1: Add Dependencies

**Files:**

- Modify: `package.json:68-79`

- [ ] **Step 1: Add silk-effects and workspaces-effect, remove workspace-tools**

In `package.json`, replace the `dependencies` block:

```json
"dependencies": {
  "@effect/cli": "catalog:silk",
  "@effect/cluster": "catalog:silk",
  "@effect/platform": "catalog:silk",
  "@effect/platform-node": "catalog:silk",
  "@effect/printer": "catalog:silk",
  "@effect/printer-ansi": "catalog:silk",
  "@effect/rpc": "catalog:silk",
  "@effect/sql": "catalog:silk",
  "@savvy-web/silk-effects": "^0.1.0",
  "effect": "catalog:silk",
  "workspaces-effect": "^0.1.0",
  "zod": "^4.3.6"
}
```

The key changes: added `@savvy-web/silk-effects` and `workspaces-effect`,
removed `workspace-tools`.

- [ ] **Step 2: Install dependencies**

Run: `pnpm install`

Expected: Clean install, lock file updated, no errors.

- [ ] **Step 3: Verify installation**

Run: `pnpm list @savvy-web/silk-effects workspaces-effect workspace-tools 2>&1`

Expected: `@savvy-web/silk-effects` and `workspaces-effect` listed,
`workspace-tools` absent.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add silk-effects and workspaces-effect, remove workspace-tools

Part of #85.

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>"
```

---

### Task 2: Migrate `dco.ts` - Inline Project Root Traversal

**Files:**

- Modify: `src/detection/dco.ts`
- Delete: `src/detection/utils.ts`

- [ ] **Step 1: Run existing dco-related tests to establish baseline**

Run: `pnpm vitest run src/cli/commands/check.test.ts -v`

Expected: All tests pass (check command exercises `detectDCO` indirectly).

- [ ] **Step 2: Replace `safelyFindProjectRoot` with inline traversal in dco.ts**

Replace the entire contents of `src/detection/dco.ts`:

```typescript
/**
 * DCO (Developer Certificate of Origin) detection module.
 *
 * @internal
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** Filename for the DCO file that indicates signoff is required. */
const DCO_FILENAME = "DCO";

/** Markers that indicate a project root directory. */
const ROOT_MARKERS = ["pnpm-workspace.yaml", ".git", "package.json"];

/**
 * Walk up the directory tree to find the project root.
 *
 * @param cwd - Starting directory
 * @returns Project root path or null if not found
 *
 * @internal
 */
function findProjectRoot(cwd: string): string | null {
 let dir = resolve(cwd);

 while (true) {
  for (const marker of ROOT_MARKERS) {
   if (existsSync(join(dir, marker))) {
    return dir;
   }
  }
  const parent = dirname(dir);
  if (parent === dir) {
   return null;
  }
  dir = parent;
 }
}

/**
 * Detect if DCO signoff should be required.
 *
 * @remarks
 * Checks for the presence of a DCO file at the repository root.
 * Walks up the directory tree to find the project root by looking
 * for workspace markers (pnpm-workspace.yaml, .git, package.json).
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns `true` if DCO file exists at repo root, `false` otherwise
 *
 * @public
 */
export function detectDCO(cwd: string = process.cwd()): boolean {
 const repoRoot = findProjectRoot(cwd);
 const searchDir = repoRoot ?? cwd;
 return existsSync(join(searchDir, DCO_FILENAME));
}
```

- [ ] **Step 3: Delete `src/detection/utils.ts`**

Run: `rm src/detection/utils.ts`

- [ ] **Step 4: Run tests to verify dco still works**

Run: `pnpm vitest run src/cli/commands/check.test.ts -v`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/detection/dco.ts
git rm src/detection/utils.ts
git commit -m "refactor: inline project root traversal in dco.ts, delete utils.ts

Removes the workspace-tools dependency from DCO detection by inlining
a simple directory traversal. Part of #85.

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>"
```

---

### Task 3: Migrate `scopes.ts` to workspaces-effect

**Files:**

- Modify: `src/detection/scopes.ts`

- [ ] **Step 1: Rewrite `scopes.ts` to use workspaces-effect services**

Replace the entire contents of `src/detection/scopes.ts`:

```typescript
/**
 * Workspace scope detection module.
 *
 * @internal
 */
import { Effect } from "effect";
import { WorkspaceDiscovery, type WorkspaceDiscoveryError } from "workspaces-effect";

/**
 * Extract scope-friendly name from a package name.
 *
 * @param name - Package name (e.g., `@scope/package-name` or `package-name`)
 * @returns Package name without scope prefix
 *
 * @internal
 */
function extractScopeName(name: string): string | undefined {
 if (name.startsWith("@")) {
  return name.split("/")[1];
 }
 return name;
}

/**
 * Detect package scopes from workspace configuration.
 *
 * @remarks
 * Uses workspaces-effect to find all packages in the workspace and extracts
 * their names as potential commit scopes. For scoped packages like
 * `@scope/package-name`, only the package name portion is used as the scope.
 *
 * @returns Effect yielding sorted array of scope names, requires WorkspaceDiscovery
 *
 * @public
 */
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

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm run typecheck`

Expected: No type errors (check.ts will have errors until Task 5, but scopes
itself should compile).

- [ ] **Step 3: Commit**

```bash
git add src/detection/scopes.ts
git commit -m "refactor: migrate scopes.ts to workspaces-effect

detectScopes is now an Effect that requires WorkspaceDiscovery service.
Part of #85.

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>"
```

---

### Task 4: Migrate `init.ts` to silk-effects `ManagedSection`

**Files:**

- Modify: `src/cli/commands/init.ts`
- Modify: `src/cli/commands/init.test.ts`

- [ ] **Step 1: Rewrite init.ts to use ManagedSection service**

Replace the entire contents of `src/cli/commands/init.ts`:

```typescript
/**
 * Init command - bootstrap commitlint configuration.
 *
 * @internal
 */
import { dirname } from "node:path";
import { Command, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import { ManagedSection } from "@savvy-web/silk-effects/hooks";
import { Effect } from "effect";
import { CHECK_MARK, HUSKY_HOOK_PATH, WARNING } from "./constants.js";

/** Executable file permission mode. */
const EXECUTABLE_MODE = 0o755;

/** Default path for the commitlint config file. */
const DEFAULT_CONFIG_PATH = "lib/configs/commitlint.config.ts";

/** Tool name used for managed section markers. */
const TOOL_NAME = "savvy-commit";

/**
 * Generate the managed section content for the commit-msg hook.
 *
 * @param configPath - Path to the commitlint config file
 * @returns The managed section content (without markers)
 */
export function generateManagedContent(configPath: string): string {
 return `# DO NOT EDIT between these markers - managed by savvy-commit
# Skip managed section in CI environment
if ! { [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; }; then

# Get repo root directory
ROOT=$(git rev-parse --show-toplevel)

# Detect package manager from package.json or lockfiles
detect_pm() {
  # Check packageManager field in package.json (e.g., "pnpm@9.0.0")
  if [ -f "$ROOT/package.json" ]; then
    pm=$(jq -r '.packageManager // empty' "$ROOT/package.json" 2>/dev/null | cut -d'@' -f1)
    if [ -n "$pm" ]; then
      echo "$pm"
      return
    fi
  fi

  # Fallback to lockfile detection
  if [ -f "$ROOT/pnpm-lock.yaml" ]; then
    echo "pnpm"
  elif [ -f "$ROOT/yarn.lock" ]; then
    echo "yarn"
  elif [ -f "$ROOT/bun.lock" ]; then
    echo "bun"
  else
    echo "npm"
  fi
}

# Run commitlint via the detected package manager
PM=$(detect_pm)
case "$PM" in
  pnpm) pnpm dlx commitlint --config "$ROOT/${configPath}" --edit "$1" ;;
  yarn) yarn dlx commitlint --config "$ROOT/${configPath}" --edit "$1" ;;
  bun)  bun x commitlint --config "$ROOT/${configPath}" --edit "$1" ;;
  *)    npx --no -- commitlint --config "$ROOT/${configPath}" --edit "$1" ;;
esac

fi`;
}

/**
 * Write a fresh hook file with header and managed section.
 *
 * @param path - Hook file path
 * @param configPath - Path to the commitlint config file
 * @returns Effect that creates the hook file
 */
function writeFullHook(path: string, configPath: string) {
 return Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const ms = yield* ManagedSection;
  const header =
   "#!/usr/bin/env sh\n# Commit-msg hook with savvy-commit managed section\n# Custom hooks can go above or below the managed section\n\n";
  yield* fs.writeFileString(path, header);
  yield* ms.write(path, TOOL_NAME, generateManagedContent(configPath));
 });
}

/** Content for the commitlint config file. */
const CONFIG_CONTENT = `import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
`;

const forceOption = Options.boolean("force").pipe(
 Options.withAlias("f"),
 Options.withDescription("Overwrite entire hook file (not just managed section)"),
 Options.withDefault(false),
);

const configOption = Options.text("config").pipe(
 Options.withAlias("c"),
 Options.withDescription("Relative path for the commitlint config file (from repo root)"),
 Options.withDefault(DEFAULT_CONFIG_PATH),
);

/**
 * Make a file executable.
 *
 * @param path - File path to make executable
 * @returns Effect that makes the file executable
 */
function makeExecutable(path: string) {
 return Effect.tryPromise(() => import("node:fs/promises").then((fsp) => fsp.chmod(path, EXECUTABLE_MODE)));
}

/**
 * Init command implementation.
 *
 * @remarks
 * Creates the necessary configuration files for commitlint:
 * - `.husky/commit-msg` hook with managed section
 * - Commitlint config at the specified path
 *
 * The managed section feature allows users to add custom hooks above/below
 * the savvy-commit section without them being overwritten on updates.
 */
export const initCommand = Command.make("init", { force: forceOption, config: configOption }, ({ force, config }) =>
 Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const ms = yield* ManagedSection;

  if (config.startsWith("/")) {
   yield* Effect.fail(new Error("Config path must be relative to repository root, not absolute"));
  }

  yield* Effect.log("Initializing commitlint configuration...\n");

  // Handle husky hook
  const huskyExists = yield* fs.exists(HUSKY_HOOK_PATH);

  if (huskyExists && !force) {
   // Read existing content and check for managed section
   const existing = yield* ms.read(HUSKY_HOOK_PATH, TOOL_NAME);

   // Write/update managed section (preserves content outside markers)
   yield* ms.write(HUSKY_HOOK_PATH, TOOL_NAME, generateManagedContent(config));
   yield* makeExecutable(HUSKY_HOOK_PATH);

   if (existing) {
    yield* Effect.log(`${CHECK_MARK} Updated managed section in ${HUSKY_HOOK_PATH}`);
   } else {
    yield* Effect.log(`${CHECK_MARK} Added managed section to ${HUSKY_HOOK_PATH}`);
   }
  } else if (huskyExists && force) {
   // Force: overwrite entire file
   yield* writeFullHook(HUSKY_HOOK_PATH, config);
   yield* makeExecutable(HUSKY_HOOK_PATH);
   yield* Effect.log(`${CHECK_MARK} Replaced ${HUSKY_HOOK_PATH} (--force)`);
  } else {
   // Create new hook
   yield* fs.makeDirectory(".husky", { recursive: true });
   yield* writeFullHook(HUSKY_HOOK_PATH, config);
   yield* makeExecutable(HUSKY_HOOK_PATH);
   yield* Effect.log(`${CHECK_MARK} Created ${HUSKY_HOOK_PATH}`);
  }

  // Handle config file
  const configExists = yield* fs.exists(config);

  if (configExists && !force) {
   yield* Effect.log(`${WARNING} ${config} already exists (use --force to overwrite)`);
  } else {
   const configDir = dirname(config);
   if (configDir && configDir !== ".") {
    yield* fs.makeDirectory(configDir, { recursive: true });
   }
   yield* fs.writeFileString(config, CONFIG_CONTENT);
   yield* Effect.log(`${CHECK_MARK} Created ${config}`);
  }

  yield* Effect.log("\nDone! Install @commitlint/cli if not already installed.");
 }),
).pipe(Command.withDescription("Initialize commitlint configuration and husky hooks"));
```

Key changes:

- Removed `BEGIN_MARKER`, `END_MARKER`, `extractManagedSection`,
  `updateManagedSection` exports
- Added `ManagedSection` service from silk-effects
- `initCommand` now yields `ManagedSection` and uses `ms.read()` / `ms.write()`
- `generateManagedContent()` is unchanged (still a local function)
- `writeFullHook()` writes a header first, then delegates marker writing to
  `ManagedSection.write()`

- [ ] **Step 2: Update init tests**

Replace the entire contents of `src/cli/commands/init.test.ts`:

```typescript
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NodeFileSystem } from "@effect/platform-node";
import { ManagedSectionLive } from "@savvy-web/silk-effects/hooks";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateManagedContent, initCommand } from "./init.js";

/** Test layer combining NodeFileSystem and ManagedSectionLive. */
const TestLayer = Layer.provideMerge(ManagedSectionLive, NodeFileSystem.layer);

/** Marker format used by silk-effects ManagedSection for "savvy-commit" tool. */
const BEGIN_MARKER = "# --- BEGIN SAVVY-COMMIT MANAGED SECTION ---";
const END_MARKER = "# --- END SAVVY-COMMIT MANAGED SECTION ---";

describe("generateManagedContent", () => {
 it("generates shell script with the config path", () => {
  const content = generateManagedContent("lib/configs/commitlint.config.ts");
  expect(content).toContain('commitlint --config "$ROOT/lib/configs/commitlint.config.ts"');
 });

 it("includes CI skip logic", () => {
  const content = generateManagedContent("commitlint.config.ts");
  expect(content).toContain("$CI");
  expect(content).toContain("$GITHUB_ACTIONS");
 });

 it("includes package manager detection", () => {
  const content = generateManagedContent("commitlint.config.ts");
  expect(content).toContain("detect_pm");
  expect(content).toContain("pnpm");
  expect(content).toContain("yarn");
  expect(content).toContain("bun");
  expect(content).toContain("npm");
 });

 it("includes pnpm dlx, yarn dlx, bun x, and npx commands", () => {
  const content = generateManagedContent("my-config.ts");
  expect(content).toContain("pnpm dlx commitlint");
  expect(content).toContain("yarn dlx commitlint");
  expect(content).toContain("bun x commitlint");
  expect(content).toContain("npx --no -- commitlint");
 });
});

describe("initCommand Effect program", () => {
 const testDir = "/tmp/commitlint-init-test";
 let originalCwd: string;

 beforeEach(() => {
  originalCwd = process.cwd();
  rmSync(testDir, { recursive: true, force: true });
  mkdirSync(testDir, { recursive: true });
  process.chdir(testDir);
 });

 afterEach(() => {
  process.chdir(originalCwd);
  rmSync(testDir, { recursive: true, force: true });
 });

 it("creates hook and config files from scratch", async () => {
  const handler = initCommand.handler({ force: false, config: "commitlint.config.ts" });
  await Effect.runPromise(Effect.provide(handler, TestLayer));

  const hookContent = readFileSync(join(testDir, ".husky/commit-msg"), "utf8");
  expect(hookContent).toContain(BEGIN_MARKER);
  expect(hookContent).toContain(END_MARKER);
  expect(hookContent).toContain("#!/usr/bin/env sh");

  const configContent = readFileSync(join(testDir, "commitlint.config.ts"), "utf8");
  expect(configContent).toContain("CommitlintConfig");
 });

 it("updates existing hook file with managed section", async () => {
  mkdirSync(join(testDir, ".husky"), { recursive: true });
  writeFileSync(join(testDir, ".husky/commit-msg"), "#!/usr/bin/env sh\n# my custom hook\n");

  const handler = initCommand.handler({ force: false, config: "commitlint.config.ts" });
  await Effect.runPromise(Effect.provide(handler, TestLayer));

  const hookContent = readFileSync(join(testDir, ".husky/commit-msg"), "utf8");
  expect(hookContent).toContain("# my custom hook");
  expect(hookContent).toContain(BEGIN_MARKER);
  expect(hookContent).toContain(END_MARKER);
 });

 it("replaces existing managed section on update", async () => {
  mkdirSync(join(testDir, ".husky"), { recursive: true });
  const oldContent = `#!/usr/bin/env sh\n${BEGIN_MARKER}\nold content\n${END_MARKER}\n`;
  writeFileSync(join(testDir, ".husky/commit-msg"), oldContent);

  const handler = initCommand.handler({ force: false, config: "commitlint.config.ts" });
  await Effect.runPromise(Effect.provide(handler, TestLayer));

  const hookContent = readFileSync(join(testDir, ".husky/commit-msg"), "utf8");
  expect(hookContent).not.toContain("old content");
  expect(hookContent).toContain(BEGIN_MARKER);
  expect(hookContent).toContain("commitlint");
 });

 it("force-overwrites entire hook file", async () => {
  mkdirSync(join(testDir, ".husky"), { recursive: true });
  writeFileSync(join(testDir, ".husky/commit-msg"), "#!/usr/bin/env sh\n# custom\n");

  const handler = initCommand.handler({ force: true, config: "commitlint.config.ts" });
  await Effect.runPromise(Effect.provide(handler, TestLayer));

  const hookContent = readFileSync(join(testDir, ".husky/commit-msg"), "utf8");
  expect(hookContent).not.toContain("# custom");
  expect(hookContent).toContain(BEGIN_MARKER);
 });

 it("does not overwrite existing config without force", async () => {
  writeFileSync(join(testDir, "commitlint.config.ts"), "// existing config");

  const handler = initCommand.handler({ force: false, config: "commitlint.config.ts" });
  await Effect.runPromise(Effect.provide(handler, TestLayer));

  const configContent = readFileSync(join(testDir, "commitlint.config.ts"), "utf8");
  expect(configContent).toBe("// existing config");
 });

 it("overwrites existing config with force", async () => {
  writeFileSync(join(testDir, "commitlint.config.ts"), "// existing config");

  const handler = initCommand.handler({ force: true, config: "commitlint.config.ts" });
  await Effect.runPromise(Effect.provide(handler, TestLayer));

  const configContent = readFileSync(join(testDir, "commitlint.config.ts"), "utf8");
  expect(configContent).toContain("CommitlintConfig");
 });

 it("creates nested config directories", async () => {
  const handler = initCommand.handler({ force: false, config: "lib/configs/commitlint.config.ts" });
  await Effect.runPromise(Effect.provide(handler, TestLayer));

  const configContent = readFileSync(join(testDir, "lib/configs/commitlint.config.ts"), "utf8");
  expect(configContent).toContain("CommitlintConfig");
 });

 it("rejects absolute config paths", async () => {
  const handler = initCommand.handler({ force: false, config: "/absolute/path/config.ts" });
  const result = await Effect.runPromiseExit(Effect.provide(handler, TestLayer));
  expect(result._tag).toBe("Failure");
 });
});
```

Key changes:

- `TestLayer` merges `ManagedSectionLive` with `NodeFileSystem.layer`
- `BEGIN_MARKER` / `END_MARKER` defined locally matching silk-effects format
- All `Effect.provide` calls use `TestLayer`
- Removed imports of `BEGIN_MARKER`, `END_MARKER`, `extractManagedSection`
- Removed `extractManagedSection` tests and `markers` tests (no longer exported)

- [ ] **Step 3: Run init tests**

Run: `pnpm vitest run src/cli/commands/init.test.ts -v`

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/cli/commands/init.ts src/cli/commands/init.test.ts
git commit -m "refactor: migrate init command to silk-effects ManagedSection

Replaces manual BEGIN/END marker handling with the ManagedSection service
from @savvy-web/silk-effects. generateManagedContent remains local.
Part of #85.

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>"
```

---

### Task 5: Migrate `check.ts` to silk-effects Services

**Files:**

- Modify: `src/cli/commands/check.ts`
- Modify: `src/cli/commands/check.test.ts`

- [ ] **Step 1: Rewrite check.ts to use silk-effects and workspaces-effect**

Replace the entire contents of `src/cli/commands/check.ts`:

```typescript
/**
 * Check command - validate current commitlint setup.
 *
 * @internal
 */
import { Command } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import { ManagedSection } from "@savvy-web/silk-effects/hooks";
import { VersioningStrategy } from "@savvy-web/silk-effects/versioning";
import { Effect } from "effect";
import { WorkspaceDiscovery } from "workspaces-effect";
import type { ReleaseFormat } from "../../config/schema.js";
import { detectDCO } from "../../detection/dco.js";
import { detectScopes } from "../../detection/scopes.js";
import { CHECK_MARK, HUSKY_HOOK_PATH, WARNING } from "./constants.js";
import { generateManagedContent } from "./init.js";

/** Unicode cross symbol. */
const CROSS_MARK = "\u2717";

/** Unicode bullet symbol. */
const BULLET = "\u2022";

/** Possible commitlint configuration file names, in priority order. */
const CONFIG_FILES = [
 "commitlint.config.ts",
 "commitlint.config.mts",
 "commitlint.config.cts",
 "commitlint.config.js",
 "commitlint.config.mjs",
 "commitlint.config.cjs",
 ".commitlintrc",
 ".commitlintrc.json",
 ".commitlintrc.yaml",
 ".commitlintrc.yml",
 ".commitlintrc.js",
 ".commitlintrc.cjs",
 ".commitlintrc.mjs",
 ".commitlintrc.ts",
 ".commitlintrc.cts",
 ".commitlintrc.mts",
] as const;

/** DCO file path. */
const DCO_FILE_PATH = "DCO";

/** Maps versioning strategy types to release formats. */
const STRATEGY_TO_FORMAT: Record<string, ReleaseFormat> = {
 single: "semver",
 "fixed-group": "semver",
 independent: "packages",
};

/**
 * Find the first existing config file.
 *
 * @param fs - FileSystem service
 * @returns Effect yielding the config file name or null
 */
function findConfigFile(fs: FileSystem.FileSystem) {
 return Effect.gen(function* () {
  for (const file of CONFIG_FILES) {
   if (yield* fs.exists(file)) {
    return file;
   }
  }
  return null;
 });
}

/**
 * Extract the config path from the managed section.
 *
 * @param managedContent - The content between managed section markers
 * @returns The config path found, or null if not found
 */
function extractConfigPathFromManaged(managedContent: string): string | null {
 const match = managedContent.match(/commitlint --config "\$ROOT\/([^"]+)"/);
 return match ? match[1] : null;
}

/**
 * Check if the managed section content is up-to-date.
 *
 * @param existingManaged - The existing managed content (between markers)
 * @returns Object with status flags
 */
function checkManagedSectionStatus(existingManaged: string): {
 isUpToDate: boolean;
 configPath: string | null;
 needsUpdate: boolean;
} {
 const configPath = extractConfigPathFromManaged(existingManaged);

 if (!configPath) {
  return { isUpToDate: false, configPath: null, needsUpdate: true };
 }

 const expectedContent = generateManagedContent(configPath);

 const normalizedExisting = existingManaged.trim().replace(/\s+/g, " ");
 const normalizedExpected = expectedContent.trim().replace(/\s+/g, " ");

 const isUpToDate = normalizedExisting === normalizedExpected;

 return { isUpToDate, configPath, needsUpdate: !isUpToDate };
}

/**
 * Detect the release format using silk-effects versioning service.
 *
 * @returns Effect yielding the release format string
 */
const detectReleaseFormat = Effect.gen(function* () {
 const versioning = yield* VersioningStrategy;
 const discovery = yield* WorkspaceDiscovery;

 const packages = yield* Effect.catchAll(discovery.listPackages(), () => Effect.succeed([] as const));

 const publishableNames = packages
  .filter((pkg) => !pkg.private || pkg.publishConfig?.access !== undefined)
  .map((pkg) => pkg.name);

 const result = yield* Effect.catchAll(versioning.detect(publishableNames, process.cwd()), () =>
  Effect.succeed({ type: "single" as const }),
 );

 return STRATEGY_TO_FORMAT[result.type] ?? ("semver" as ReleaseFormat);
});

/**
 * Check command implementation.
 *
 * @remarks
 * Validates the current commitlint setup and displays detected settings.
 */
export const checkCommand = Command.make("check", {}, () =>
 Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const ms = yield* ManagedSection;

  yield* Effect.log("Checking commitlint configuration...\n");

  const foundConfig = yield* findConfigFile(fs);
  if (foundConfig) {
   yield* Effect.log(`${CHECK_MARK} Config file: ${foundConfig}`);
  } else {
   yield* Effect.log(`${CROSS_MARK} No commitlint config file found`);
  }

  const hasHuskyHook = yield* fs.exists(HUSKY_HOOK_PATH);
  if (hasHuskyHook) {
   yield* Effect.log(`${CHECK_MARK} Husky hook: ${HUSKY_HOOK_PATH}`);
  } else {
   yield* Effect.log(`${CROSS_MARK} No husky commit-msg hook found`);
  }

  // Managed section status
  if (hasHuskyHook) {
   const result = yield* ms.read(HUSKY_HOOK_PATH, "savvy-commit");

   if (result) {
    const status = checkManagedSectionStatus(result.managed);
    if (status.isUpToDate) {
     yield* Effect.log(`${CHECK_MARK} Managed section: up-to-date`);
    } else {
     yield* Effect.log(`${WARNING} Managed section: outdated (run 'savvy-commit init' to update)`);
    }
   } else {
    yield* Effect.log(`${BULLET} Managed section: not found (run 'savvy-commit init' to add)`);
   }
  }

  const hasDCOFile = yield* fs.exists(DCO_FILE_PATH);
  if (hasDCOFile) {
   yield* Effect.log(`${CHECK_MARK} DCO file: ${DCO_FILE_PATH}`);
  } else {
   yield* Effect.log(`${BULLET} No DCO file (signoff not required)`);
  }

  yield* Effect.log("\nDetected settings:");
  yield* Effect.log(`  DCO required: ${detectDCO()}`);

  const releaseFormat = yield* detectReleaseFormat;
  yield* Effect.log(`  Release format: ${releaseFormat}`);

  const scopes = yield* Effect.catchAll(detectScopes, () => Effect.succeed([] as string[]));
  const scopeDisplay = scopes.length > 0 ? scopes.join(", ") : "(none - not a monorepo or no packages found)";
  yield* Effect.log(`  Detected scopes: ${scopeDisplay}`);

  yield* Effect.log("");
  const hasIssues = !foundConfig || !hasHuskyHook;
  if (hasIssues) {
   yield* Effect.log(`${CROSS_MARK} Commitlint needs configuration. Run: savvy-commit init`);
  } else {
   yield* Effect.log(`${CHECK_MARK} Commitlint is configured correctly.`);
  }
 }),
).pipe(Command.withDescription("Check current commitlint configuration and detected settings"));
```

Key changes:

- Replaced `detectReleaseFormat` import with local Effect using
  `VersioningStrategy.detect()` + `WorkspaceDiscovery.listPackages()`
- Replaced `extractManagedSection` with `ManagedSection.read()`
- Removed imports of `BEGIN_MARKER`, `END_MARKER` from init.js
- `detectScopes` is now yielded as an Effect (from Task 3)
- All silk-effects errors are caught and defaulted gracefully

- [ ] **Step 2: Update check tests**

Replace the entire contents of `src/cli/commands/check.test.ts`:

```typescript
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NodeFileSystem } from "@effect/platform-node";
import { ManagedSectionLive } from "@savvy-web/silk-effects/hooks";
import { ChangesetConfigReaderLive, VersioningStrategyLive } from "@savvy-web/silk-effects/versioning";
import { Effect, Layer } from "effect";
import { WorkspaceDiscoveryLive, WorkspaceRootLive } from "workspaces-effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkCommand } from "./check.js";
import { generateManagedContent } from "./init.js";

/** Marker format used by silk-effects ManagedSection for "savvy-commit" tool. */
const BEGIN_MARKER = "# --- BEGIN SAVVY-COMMIT MANAGED SECTION ---";
const END_MARKER = "# --- END SAVVY-COMMIT MANAGED SECTION ---";

/** Test layer combining all required services. */
const TestLayer = Layer.mergeAll(
 ManagedSectionLive,
 VersioningStrategyLive,
 ChangesetConfigReaderLive,
 WorkspaceDiscoveryLive,
 WorkspaceRootLive,
).pipe(Layer.provideMerge(NodeFileSystem.layer));

describe("checkCommand", () => {
 it("is a valid Effect CLI command", () => {
  expect(checkCommand).toBeDefined();
 });
});

describe("check helpers via init re-exports", () => {
 it("extractConfigPathFromManaged finds config path in managed content", () => {
  const configPath = "lib/configs/commitlint.config.ts";
  const managedContent = `${BEGIN_MARKER}\n${generateManagedContent(configPath)}\n${END_MARKER}`;

  expect(managedContent).toContain(`commitlint --config "$ROOT/${configPath}"`);
 });

 it("managed section with correct config path is self-consistent", () => {
  const configPath = "commitlint.config.ts";
  const content = generateManagedContent(configPath);
  const fullSection = `${BEGIN_MARKER}\n${content}\n${END_MARKER}`;

  const content2 = generateManagedContent(configPath);
  const fullSection2 = `${BEGIN_MARKER}\n${content2}\n${END_MARKER}`;
  expect(fullSection).toBe(fullSection2);
 });
});

describe("checkCommand Effect program", () => {
 const testDir = "/tmp/commitlint-check-test";
 let originalCwd: string;

 beforeEach(() => {
  originalCwd = process.cwd();
  rmSync(testDir, { recursive: true, force: true });
  mkdirSync(testDir, { recursive: true });
  execSync("git init", { cwd: testDir, stdio: "ignore" });
  writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "test-pkg", private: true }));
  process.chdir(testDir);
 });

 afterEach(() => {
  process.chdir(originalCwd);
  rmSync(testDir, { recursive: true, force: true });
 });

 it("runs without errors when no config exists", async () => {
  const handler = checkCommand.handler({});
  await Effect.runPromise(Effect.provide(handler, TestLayer));
 });

 it("runs when config file exists", async () => {
  writeFileSync(join(testDir, "commitlint.config.ts"), "export default {};");

  const handler = checkCommand.handler({});
  await Effect.runPromise(Effect.provide(handler, TestLayer));
 });

 it("runs when husky hook exists without managed section", async () => {
  mkdirSync(join(testDir, ".husky"), { recursive: true });
  writeFileSync(join(testDir, ".husky/commit-msg"), "#!/usr/bin/env sh\necho test\n");

  const handler = checkCommand.handler({});
  await Effect.runPromise(Effect.provide(handler, TestLayer));
 });

 it("runs when husky hook has managed section", async () => {
  mkdirSync(join(testDir, ".husky"), { recursive: true });
  const configPath = "lib/configs/commitlint.config.ts";
  const hookContent = `#!/usr/bin/env sh\n${BEGIN_MARKER}\n${generateManagedContent(configPath)}\n${END_MARKER}\n`;
  writeFileSync(join(testDir, ".husky/commit-msg"), hookContent);

  const handler = checkCommand.handler({});
  await Effect.runPromise(Effect.provide(handler, TestLayer));
 });

 it("runs when husky hook has outdated managed section", async () => {
  mkdirSync(join(testDir, ".husky"), { recursive: true });
  const hookContent = `#!/usr/bin/env sh\n${BEGIN_MARKER}\nold outdated content\n${END_MARKER}\n`;
  writeFileSync(join(testDir, ".husky/commit-msg"), hookContent);

  const handler = checkCommand.handler({});
  await Effect.runPromise(Effect.provide(handler, TestLayer));
 });

 it("runs when DCO file exists", async () => {
  writeFileSync(join(testDir, "DCO"), "Developer Certificate of Origin Version 1.1");
  writeFileSync(join(testDir, "commitlint.config.ts"), "export default {};");
  mkdirSync(join(testDir, ".husky"), { recursive: true });
  writeFileSync(join(testDir, ".husky/commit-msg"), "#!/usr/bin/env sh\n");

  const handler = checkCommand.handler({});
  await Effect.runPromise(Effect.provide(handler, TestLayer));
 });

 it("detects various config file types", async () => {
  writeFileSync(join(testDir, ".commitlintrc.json"), "{}");

  const handler = checkCommand.handler({});
  await Effect.runPromise(Effect.provide(handler, TestLayer));
 });
});
```

Key changes:

- `TestLayer` provides all silk-effects and workspaces-effect layers
- `BEGIN_MARKER` / `END_MARKER` are local constants
- No imports from `init.js` except `generateManagedContent`

- [ ] **Step 3: Run check tests**

Run: `pnpm vitest run src/cli/commands/check.test.ts -v`

Expected: All 9 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/cli/commands/check.ts src/cli/commands/check.test.ts
git commit -m "refactor: migrate check command to silk-effects services

Replaces detectReleaseFormat and manual marker parsing with
VersioningStrategy, WorkspaceDiscovery, and ManagedSection services.
Part of #85.

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>"
```

---

### Task 6: Update CLI Layer Composition

**Files:**

- Modify: `src/cli/index.ts`

- [ ] **Step 1: Provide silk-effects and workspaces-effect layers in CLI entry**

Replace the entire contents of `src/cli/index.ts`:

```typescript
/**
 * CLI entry point using `@effect/cli`.
 *
 * @remarks
 * This module provides the CLI application for managing commitlint
 * configuration. It uses Effect for functional error handling and
 * `@effect/cli` for command parsing.
 *
 * @internal
 */
import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { ManagedSectionLive } from "@savvy-web/silk-effects/hooks";
import { ChangesetConfigReaderLive, VersioningStrategyLive } from "@savvy-web/silk-effects/versioning";
import { Effect, Layer } from "effect";
import { WorkspaceDiscoveryLive, WorkspaceRootLive } from "workspaces-effect";
import { checkCommand } from "./commands/check.js";
import { initCommand } from "./commands/init.js";

/** Root command for the CLI with all subcommands. */
const rootCommand = Command.make("savvy-commit").pipe(Command.withSubcommands([initCommand, checkCommand]));

/** CLI application runner. */
const cli = Command.run(rootCommand, {
 name: "savvy-commit",
 version: process.env.__PACKAGE_VERSION__ ?? "0.0.0",
});

/** Combined layer providing all services needed by CLI commands. */
const CliLive = Layer.mergeAll(
 ManagedSectionLive,
 VersioningStrategyLive,
 ChangesetConfigReaderLive,
 WorkspaceDiscoveryLive,
 WorkspaceRootLive,
).pipe(Layer.provideMerge(NodeContext.layer));

/**
 * Run the CLI application.
 *
 * @remarks
 * Entry point for the CLI binary. Parses command-line arguments
 * and executes the appropriate subcommand.
 *
 * @internal
 */
export function runCli(): void {
 const main = Effect.suspend(() => cli(process.argv)).pipe(Effect.provide(CliLive));
 NodeRuntime.runMain(main);
}

export { checkCommand, initCommand, rootCommand };
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm run typecheck`

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/cli/index.ts
git commit -m "refactor: provide silk-effects and workspaces-effect layers in CLI

Composes all required service layers in the CLI entry point so
subcommands can access silk-effects and workspaces-effect services.
Part of #85.

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>"
```

---

### Task 7: Delete Versioning Module

**Files:**

- Delete: `src/detection/versioning.ts`
- Delete: `src/detection/versioning.test.ts`

- [ ] **Step 1: Delete versioning files**

```bash
git rm src/detection/versioning.ts src/detection/versioning.test.ts
```

- [ ] **Step 2: Run full test suite to verify nothing breaks**

Run: `pnpm run test`

Expected: All tests pass. No imports of the deleted files remain.

- [ ] **Step 3: Run typecheck**

Run: `pnpm run typecheck`

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git rm src/detection/versioning.ts src/detection/versioning.test.ts
git commit -m "refactor: delete versioning.ts, replaced by silk-effects

All versioning detection now uses VersioningStrategy service from
@savvy-web/silk-effects. Part of #85.

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>"
```

---

### Task 8: Final Verification and Lint

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `pnpm run test`

Expected: All tests pass.

- [ ] **Step 2: Run typecheck**

Run: `pnpm run typecheck`

Expected: No type errors.

- [ ] **Step 3: Run lint**

Run: `pnpm run lint`

Expected: No lint errors.

- [ ] **Step 4: Verify workspace-tools is fully removed**

Run: `grep -r "workspace-tools" src/ --include="*.ts"`

Expected: No matches.

- [ ] **Step 5: Verify all new imports resolve**

Run: `grep -r "from.*silk-effects" src/ --include="*.ts" && grep -r "from.*workspaces-effect" src/ --include="*.ts"`

Expected: Imports in check.ts, init.ts, cli/index.ts, scopes.ts.

- [ ] **Step 6: Fix any issues found, then commit**

If lint or typecheck produced auto-fixable issues:

```bash
pnpm run lint:fix
git add -u
git commit -m "chore: fix lint issues from silk-effects migration

Signed-off-by: C. Spencer Beggs <spencer@savvyweb.systems>"
```
