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
} {
	const configPath = extractConfigPathFromManaged(existingManaged);

	if (!configPath) {
		return { isUpToDate: false, configPath: null };
	}

	const expectedContent = generateManagedContent(configPath);

	const normalizedExisting = existingManaged.trim().replace(/\s+/g, " ");
	const normalizedExpected = expectedContent.trim().replace(/\s+/g, " ");

	const isUpToDate = normalizedExisting === normalizedExpected;

	return { isUpToDate, configPath };
}

/**
 * Detect the release format using silk-effects versioning service.
 *
 * @returns Effect yielding the release format string
 */
const detectReleaseFormat = Effect.gen(function* () {
	const versioning = yield* VersioningStrategy;
	const discovery = yield* WorkspaceDiscovery;

	const packages = yield* Effect.catchAll(discovery.listPackages(), () => Effect.succeed([]));

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
