/**
 * Init command - bootstrap commitlint configuration.
 *
 * @internal
 */
import { dirname } from "node:path";
import { Command, Options } from "@effect/cli";
import { FileSystem } from "@effect/platform";
import { Effect } from "effect";

/** Unicode checkmark symbol. */
const CHECK_MARK = "\u2713";

/** Unicode warning symbol. */
const WARNING = "\u26A0";

/** Executable file permission mode. */
const EXECUTABLE_MODE = 0o755;

/** Path for the husky commit-msg hook. */
const HUSKY_HOOK_PATH = ".husky/commit-msg";

/** Default path for the commitlint config file. */
const DEFAULT_CONFIG_PATH = "lib/configs/commitlint.config.ts";

/** Begin marker for managed section. */
const BEGIN_MARKER = "# --- BEGIN SAVVY-COMMIT MANAGED SECTION ---";

/** End marker for managed section. */
const END_MARKER = "# --- END SAVVY-COMMIT MANAGED SECTION ---";

/**
 * Generate the managed section content for the commit-msg hook.
 *
 * @param configPath - Path to the commitlint config file
 * @returns The managed section content (without markers)
 */
function generateManagedContent(configPath: string): string {
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
 * Generate the full husky commit-msg hook content for a fresh file.
 *
 * @param configPath - Path to the commitlint config file
 * @returns Complete shell script content for the hook
 */
function generateFullHookContent(configPath: string): string {
	return `#!/usr/bin/env sh
# Commit-msg hook with savvy-commit managed section
# Custom hooks can go above or below the managed section

${BEGIN_MARKER}
${generateManagedContent(configPath)}
${END_MARKER}
`;
}

/**
 * Extract the managed section from existing hook content.
 *
 * @param content - The existing hook file content
 * @returns Object with beforeSection, managedSection, afterSection, and found flag
 */
function extractManagedSection(content: string): {
	beforeSection: string;
	managedSection: string;
	afterSection: string;
	found: boolean;
} {
	const beginIndex = content.indexOf(BEGIN_MARKER);
	const endIndex = content.indexOf(END_MARKER);

	if (beginIndex === -1 || endIndex === -1 || endIndex <= beginIndex) {
		return {
			beforeSection: content,
			managedSection: "",
			afterSection: "",
			found: false,
		};
	}

	return {
		beforeSection: content.slice(0, beginIndex),
		managedSection: content.slice(beginIndex, endIndex + END_MARKER.length),
		afterSection: content.slice(endIndex + END_MARKER.length),
		found: true,
	};
}

/**
 * Update existing hook content with new managed section.
 *
 * @param existingContent - The existing hook file content
 * @param configPath - Path to the commitlint config file
 * @returns Updated hook content
 */
function updateManagedSection(existingContent: string, configPath: string): string {
	const { beforeSection, afterSection, found } = extractManagedSection(existingContent);

	const newManagedSection = `${BEGIN_MARKER}\n${generateManagedContent(configPath)}\n${END_MARKER}`;

	if (found) {
		// Replace existing managed section
		return `${beforeSection}${newManagedSection}${afterSection}`;
	}

	// No existing managed section - append at end
	const trimmedContent = existingContent.trimEnd();
	return `${trimmedContent}\n\n${newManagedSection}\n`;
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
	return Effect.tryPromise(() => import("node:fs/promises").then((fs) => fs.chmod(path, EXECUTABLE_MODE)));
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

		if (config.startsWith("/")) {
			yield* Effect.fail(new Error("Config path must be relative to repository root, not absolute"));
		}

		yield* Effect.log("Initializing commitlint configuration...\n");

		// Handle husky hook
		const huskyExists = yield* fs.exists(HUSKY_HOOK_PATH);

		if (huskyExists && !force) {
			// Read existing content and update managed section
			const existingContent = yield* fs.readFileString(HUSKY_HOOK_PATH);
			const { found } = extractManagedSection(existingContent);

			const updatedContent = updateManagedSection(existingContent, config);
			yield* fs.writeFileString(HUSKY_HOOK_PATH, updatedContent);
			yield* makeExecutable(HUSKY_HOOK_PATH);

			if (found) {
				yield* Effect.log(`${CHECK_MARK} Updated managed section in ${HUSKY_HOOK_PATH}`);
			} else {
				yield* Effect.log(`${CHECK_MARK} Added managed section to ${HUSKY_HOOK_PATH}`);
			}
		} else if (huskyExists && force) {
			// Force: overwrite entire file
			yield* fs.writeFileString(HUSKY_HOOK_PATH, generateFullHookContent(config));
			yield* makeExecutable(HUSKY_HOOK_PATH);
			yield* Effect.log(`${CHECK_MARK} Replaced ${HUSKY_HOOK_PATH} (--force)`);
		} else {
			// Create new hook
			yield* fs.makeDirectory(".husky", { recursive: true });
			yield* fs.writeFileString(HUSKY_HOOK_PATH, generateFullHookContent(config));
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

export { BEGIN_MARKER, END_MARKER, extractManagedSection, generateManagedContent };
