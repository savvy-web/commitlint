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
