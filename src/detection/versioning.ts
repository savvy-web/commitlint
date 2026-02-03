/**
 * Versioning strategy and release format detection module.
 *
 * @remarks
 * Analyzes repository structure and changeset configuration to determine
 * how packages should be versioned and tagged.
 *
 * @internal
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findProjectRoot, getWorkspaces } from "workspace-tools";
import type { ReleaseFormat } from "../config/schema.js";

/**
 * Changeset configuration from .changeset/config.json.
 *
 * @remarks
 * Partial type representing only the fields used for versioning detection.
 *
 * @public
 */
export interface ChangesetConfig {
	/** Fixed version groups - all packages in a group share the same version */
	fixed?: string[][];
	/** Linked version groups - packages bump together but can have different versions */
	linked?: string[][];
}

/**
 * Package access level for npm registries.
 *
 * @public
 */
export type PackageAccess = "public" | "restricted";

/**
 * Information about a workspace package relevant to publishing.
 *
 * @public
 */
export interface WorkspacePackageInfo {
	/** Package name from package.json */
	name: string;

	/** Package version from package.json */
	version: string;

	/** Absolute path to the package directory */
	path: string;

	/** Whether package.json has `"private": true` */
	private: boolean;

	/** Whether package has publishConfig.access defined */
	hasPublishConfig: boolean;

	/** Access level if configured (undefined if not set) */
	access: PackageAccess | undefined;

	/** Number of publish targets (from publishConfig.targets array) */
	targetCount: number;
}

/**
 * Versioning strategy type.
 *
 * @remarks
 * - `single`: Single-package repo or all publishable packages share a version
 * - `fixed-group`: All publishable packages are in the same changeset fixed group
 * - `independent`: Multiple publishable packages with independent/linked versioning
 *
 * @public
 */
export type VersioningStrategyType = "single" | "fixed-group" | "independent";

/**
 * Comprehensive versioning strategy detection result.
 *
 * @public
 */
export interface VersioningStrategy {
	/**
	 * Strategy type determining tag format:
	 * - `single`: Use single version tag (`v1.0.0`)
	 * - `fixed-group`: Use single version tag, all packages share version
	 * - `independent`: Use per-package tags (`@scope/pkg@1.0.0`)
	 */
	type: VersioningStrategyType;

	/**
	 * Whether per-package tags are needed.
	 * - `true`: Use per-package tags (`@scope/pkg@1.0.0` or `pkg@v1.0.0`)
	 * - `false`: Use single version tag (`v1.0.0`)
	 */
	needsPerPackageTags: boolean;

	/** All packages found in the workspace */
	allPackages: WorkspacePackageInfo[];

	/**
	 * Packages eligible for publishing.
	 *
	 * @remarks
	 * A package is publishable if it has `publishConfig.access` defined,
	 * has `publishConfig.targets` defined, or is not marked as private.
	 */
	publishablePackages: WorkspacePackageInfo[];

	/** Changeset configuration (if found) */
	changesetConfig: ChangesetConfig | null;

	/** Fixed group containing all publishable packages (if applicable) */
	fixedGroup: string[] | null;

	/** Whether the repository has multiple workspace packages (is a monorepo) */
	isMonorepo: boolean;

	/** Whether the root package.json is private */
	isRootPrivate: boolean;

	/** Human-readable explanation of the detected strategy */
	explanation: string;
}

/**
 * Read the changeset configuration file.
 *
 * @param root - Project root directory
 * @returns Changeset config or null if not found
 *
 * @internal
 */
function readChangesetConfig(root: string): ChangesetConfig | null {
	const configPath = join(root, ".changeset", "config.json");

	if (!existsSync(configPath)) {
		return null;
	}

	const content = readFileSync(configPath, "utf8");
	return JSON.parse(content) as ChangesetConfig;
}

/**
 * Get all workspace packages with their publish configuration.
 *
 * @param root - Project root directory
 * @returns Array of workspace package info
 *
 * @internal
 */
function getAllWorkspacePackages(root: string): WorkspacePackageInfo[] {
	const workspaces = getWorkspaces(root);
	const packages: WorkspacePackageInfo[] = [];

	for (const workspace of workspaces) {
		const pkgJson = workspace.packageJson as {
			name?: string;
			version?: string;
			private?: boolean;
			publishConfig?: {
				access?: PackageAccess;
				targets?: unknown[];
			};
		};

		if (!pkgJson.name) {
			continue;
		}

		const hasPublishConfig = pkgJson.publishConfig?.access !== undefined;
		const targets = pkgJson.publishConfig?.targets;
		const targetCount = Array.isArray(targets) ? targets.length : hasPublishConfig ? 1 : 0;

		packages.push({
			name: pkgJson.name,
			version: pkgJson.version ?? "0.0.0",
			path: workspace.path,
			private: pkgJson.private === true,
			hasPublishConfig,
			access: pkgJson.publishConfig?.access,
			targetCount,
		});
	}

	return packages;
}

/**
 * Check if the root package.json is private.
 *
 * @param root - Project root directory
 * @returns True if root package is private
 *
 * @internal
 */
function isRootPackagePrivate(root: string): boolean {
	const pkgPath = join(root, "package.json");

	if (!existsSync(pkgPath)) {
		return false;
	}

	const content = readFileSync(pkgPath, "utf8");
	const pkg = JSON.parse(content) as { private?: boolean };
	return pkg.private === true;
}

/**
 * Filter packages to only those that are publishable.
 *
 * @remarks
 * A package is publishable if:
 * - It has `publishConfig.access` defined, OR
 * - It has `publishConfig.targets` defined, OR
 * - It is NOT marked as private
 *
 * @param packages - All workspace packages
 * @returns Filtered array of publishable packages
 *
 * @internal
 */
function filterPublishablePackages(packages: WorkspacePackageInfo[]): WorkspacePackageInfo[] {
	return packages.filter((pkg) => pkg.hasPublishConfig || pkg.targetCount > 0 || !pkg.private);
}

/**
 * Check if all publishable packages are in the same fixed group.
 *
 * @param publishableNames - Set of publishable package names
 * @param config - Changeset configuration
 * @returns The fixed group if all packages are in it, null otherwise
 *
 * @internal
 */
function findContainingFixedGroup(publishableNames: Set<string>, config: ChangesetConfig | null): string[] | null {
	if (!config?.fixed) {
		return null;
	}

	for (const fixedGroup of config.fixed) {
		const allInGroup = [...publishableNames].every((name) => fixedGroup.includes(name));
		if (allInGroup) {
			return fixedGroup;
		}
	}

	return null;
}

/**
 * Detect the versioning strategy for a repository.
 *
 * @remarks
 * Strategy detection logic:
 *
 * 1. **Single**: Only 0-1 publishable packages exist
 *    - Tag format: `v1.0.0`
 *
 * 2. **Fixed Group**: All publishable packages are in the same changeset `fixed` group
 *    - Tag format: `v1.0.0` (shared version)
 *    - All packages bump to the same version when any changes
 *
 * 3. **Independent**: Multiple publishable packages with independent or linked versioning
 *    - Tag format: `@scope/pkg@1.0.0` or `pkg@v1.0.0`
 *    - Each package has its own version
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Comprehensive versioning strategy result
 *
 * @public
 *
 * @example
 * ```typescript
 * import { detectVersioningStrategy } from "@savvy-web/commitlint";
 *
 * const strategy = detectVersioningStrategy();
 *
 * if (strategy.needsPerPackageTags) {
 *   // Create tags like @scope/pkg@1.0.0
 *   for (const pkg of strategy.publishablePackages) {
 *     const tag = getPackageTag(pkg.name, pkg.version, strategy);
 *     console.log(tag);
 *   }
 * } else {
 *   // Create single tag like v1.0.0
 *   const version = strategy.publishablePackages[0]?.version ?? "0.0.0";
 *   console.log(`v${version}`);
 * }
 * ```
 */
export function detectVersioningStrategy(cwd: string = process.cwd()): VersioningStrategy {
	const root = findProjectRoot(cwd);

	if (!root) {
		return {
			type: "single",
			needsPerPackageTags: false,
			allPackages: [],
			publishablePackages: [],
			changesetConfig: null,
			fixedGroup: null,
			isMonorepo: false,
			isRootPrivate: false,
			explanation: "No project root found",
		};
	}

	const allPackages = getAllWorkspacePackages(root);
	const changesetConfig = readChangesetConfig(root);
	const publishablePackages = filterPublishablePackages(allPackages);
	const isMonorepo = allPackages.length > 1;
	const rootPrivate = isRootPackagePrivate(root);

	// Single package (or no publishable packages)
	if (publishablePackages.length <= 1) {
		const explanation =
			publishablePackages.length === 0
				? "No publishable packages found"
				: `Single publishable package: ${publishablePackages[0].name}`;

		return {
			type: "single",
			needsPerPackageTags: false,
			allPackages,
			publishablePackages,
			changesetConfig,
			fixedGroup: null,
			isMonorepo,
			isRootPrivate: rootPrivate,
			explanation,
		};
	}

	// Check if all publishable packages are in the same fixed group
	const publishableNames = new Set(publishablePackages.map((p) => p.name));
	const fixedGroup = findContainingFixedGroup(publishableNames, changesetConfig);

	if (fixedGroup) {
		return {
			type: "fixed-group",
			needsPerPackageTags: false,
			allPackages,
			publishablePackages,
			changesetConfig,
			fixedGroup,
			isMonorepo,
			isRootPrivate: rootPrivate,
			explanation: `All ${publishablePackages.length} publishable packages are in a fixed version group`,
		};
	}

	// Multiple publishable packages not all in same fixed group
	return {
		type: "independent",
		needsPerPackageTags: true,
		allPackages,
		publishablePackages,
		changesetConfig,
		fixedGroup: null,
		isMonorepo,
		isRootPrivate: rootPrivate,
		explanation: `${publishablePackages.length} publishable packages with independent/linked versioning`,
	};
}

/**
 * Get the appropriate git tag for a package.
 *
 * @param packageName - Package name
 * @param version - Package version
 * @param strategy - Versioning strategy result
 * @returns Git tag string
 *
 * @public
 *
 * @example
 * ```typescript
 * import { detectVersioningStrategy, getPackageTag } from "@savvy-web/commitlint";
 *
 * const strategy = detectVersioningStrategy();
 * const tag = getPackageTag("@scope/pkg", "1.0.0", strategy);
 * // If independent: "@scope/pkg@1.0.0"
 * // If single/fixed: "v1.0.0"
 * ```
 */
export function getPackageTag(packageName: string, version: string, strategy: VersioningStrategy): string {
	if (!strategy.needsPerPackageTags) {
		return `v${version}`;
	}

	// Scoped packages: @scope/pkg@1.0.0
	// Non-scoped packages: pkg@v1.0.0
	return packageName.startsWith("@") ? `${packageName}@${version}` : `${packageName}@v${version}`;
}

/**
 * Check if a package is publishable.
 *
 * @remarks
 * A package is publishable if any of the following conditions are met:
 * - It has `publishConfig.access` defined
 * - It has `publishConfig.targets` defined (custom multi-target publishing)
 * - It is NOT marked as `"private": true` in package.json
 *
 * @param pkg - Package info from {@link WorkspacePackageInfo}
 * @returns True if the package can be published
 *
 * @see {@link detectVersioningStrategy} for obtaining package info
 *
 * @public
 *
 * @example
 * ```typescript
 * import { detectVersioningStrategy, isPackagePublishable } from "@savvy-web/commitlint";
 *
 * const strategy = detectVersioningStrategy();
 * const publishable = strategy.allPackages.filter(isPackagePublishable);
 * console.log(`Found ${publishable.length} publishable packages`);
 * ```
 */
export function isPackagePublishable(pkg: WorkspacePackageInfo): boolean {
	return pkg.hasPublishConfig || pkg.targetCount > 0 || !pkg.private;
}

/** Maps versioning strategy types to their corresponding release formats. */
const STRATEGY_TO_FORMAT: Record<VersioningStrategyType, ReleaseFormat> = {
	single: "semver",
	"fixed-group": "semver",
	independent: "packages",
};

/**
 * Detect the appropriate release commit format.
 *
 * @remarks
 * Maps the detected versioning strategy to a release format:
 * - `single` or `fixed-group`: Returns `"semver"` for commits like `release: v1.2.3`
 * - `independent`: Returns `"packages"` for commits like `release: version packages`
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Release format to use
 *
 * @public
 *
 * @example
 * ```typescript
 * import { detectReleaseFormat } from "@savvy-web/commitlint";
 *
 * const format = detectReleaseFormat();
 * // For single package: "semver"
 * // For independent packages: "packages"
 * ```
 */
export function detectReleaseFormat(cwd: string = process.cwd()): ReleaseFormat {
	const strategy = detectVersioningStrategy(cwd);
	return STRATEGY_TO_FORMAT[strategy.type];
}
