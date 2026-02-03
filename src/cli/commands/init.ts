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

/**
 * Generate the husky commit-msg hook content.
 *
 * @param configPath - Path to the commitlint config file
 * @returns Shell script content for the hook
 */
function generateHuskyContent(configPath: string): string {
	return `#!/usr/bin/env sh
# Skip in CI environment
[ -n "$GITHUB_ACTIONS" ] && exit 0

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

# Get the dlx/npx equivalent command for the detected package manager
PM=$(detect_pm)
case "$PM" in
  pnpm) CMD="pnpm dlx" ;;
  yarn) CMD="yarn dlx" ;;
  bun)  CMD="bun x" ;;
  *)    CMD="npx --no --" ;;
esac

$CMD commitlint --config "$ROOT/${configPath}" --edit "$1"
`;
}

/** Content for the commitlint config file. */
const CONFIG_CONTENT = `import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
`;

const forceOption = Options.boolean("force").pipe(
	Options.withAlias("f"),
	Options.withDescription("Overwrite existing files"),
	Options.withDefault(false),
);

const configOption = Options.text("config").pipe(
	Options.withAlias("c"),
	Options.withDescription("Path for the commitlint config file"),
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
 * - `.husky/commit-msg` hook for automatic validation
 * - Commitlint config at the specified path (default: `lib/configs/commitlint.config.ts`)
 */
export const initCommand = Command.make("init", { force: forceOption, config: configOption }, ({ force, config }) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;

		yield* Effect.log("Initializing commitlint configuration...\n");

		const huskyExists = yield* fs.exists(HUSKY_HOOK_PATH);

		if (huskyExists && !force) {
			yield* Effect.log(`${WARNING} ${HUSKY_HOOK_PATH} already exists (use --force to overwrite)`);
		} else {
			yield* fs.makeDirectory(".husky", { recursive: true });
			yield* fs.writeFileString(HUSKY_HOOK_PATH, generateHuskyContent(config));
			yield* makeExecutable(HUSKY_HOOK_PATH);
			yield* Effect.log(`${CHECK_MARK} Created ${HUSKY_HOOK_PATH}`);
		}

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
