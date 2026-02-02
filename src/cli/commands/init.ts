/**
 * Init command - bootstrap commitlint configuration.
 *
 * @internal
 */
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

/** Path for the commitlint config file. */
const CONFIG_PATH = "commitlint.config.ts";

/** Content for the husky commit-msg hook. */
const HUSKY_CONTENT = `#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

# Detect package manager from package.json or lockfiles
detect_pm() {
  # Check packageManager field in package.json (e.g., "pnpm@9.0.0")
  if [ -f "package.json" ]; then
    pm=$(jq -r '.packageManager // empty' package.json 2>/dev/null | cut -d'@' -f1)
    if [ -n "$pm" ]; then
      echo "$pm"
      return
    fi
  fi

  # Fallback to lockfile detection
  if [ -f "pnpm-lock.yaml" ]; then
    echo "pnpm"
  elif [ -f "yarn.lock" ]; then
    echo "yarn"
  elif [ -f "bun.lockb" ]; then
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

$CMD commitlint --edit "$1"
`;

/** Content for the commitlint config file. */
const CONFIG_CONTENT = `import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk();
`;

const forceOption = Options.boolean("force").pipe(
	Options.withAlias("f"),
	Options.withDescription("Overwrite existing files"),
	Options.withDefault(false),
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
 * - `commitlint.config.ts` with default configuration
 */
export const initCommand = Command.make("init", { force: forceOption }, ({ force }) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;

		yield* Effect.log("Initializing commitlint configuration...\n");

		const huskyExists = yield* fs.exists(HUSKY_HOOK_PATH);

		if (huskyExists && !force) {
			yield* Effect.log(`${WARNING} ${HUSKY_HOOK_PATH} already exists (use --force to overwrite)`);
		} else {
			yield* fs.makeDirectory(".husky", { recursive: true });
			yield* fs.writeFileString(HUSKY_HOOK_PATH, HUSKY_CONTENT);
			yield* makeExecutable(HUSKY_HOOK_PATH);
			yield* Effect.log(`${CHECK_MARK} Created ${HUSKY_HOOK_PATH}`);
		}

		const configExists = yield* fs.exists(CONFIG_PATH);

		if (configExists && !force) {
			yield* Effect.log(`${WARNING} ${CONFIG_PATH} already exists (use --force to overwrite)`);
		} else {
			yield* fs.writeFileString(CONFIG_PATH, CONFIG_CONTENT);
			yield* Effect.log(`${CHECK_MARK} Created ${CONFIG_PATH}`);
		}

		yield* Effect.log("\nDone! Install @commitlint/cli if not already installed.");
	}),
).pipe(Command.withDescription("Initialize commitlint configuration and husky hooks"));
