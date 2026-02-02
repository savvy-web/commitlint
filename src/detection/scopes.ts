/**
 * Workspace scope detection module.
 *
 * @internal
 */
import { getWorkspaces } from "workspace-tools";
import { safelyFindProjectRoot } from "./utils.js";

/**
 * Extract scope-friendly name from a package name.
 *
 * @param name - Package name (e.g., `\@scope/package-name` or `package-name`)
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
 * Uses workspace-tools to find all packages in the workspace and extracts
 * their names as potential commit scopes. For scoped packages like
 * `@scope/package-name`, only the package name portion is used as the scope.
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns Array of scope names (package names without scope prefix), sorted alphabetically
 *
 * @see {@link CommitlintConfig.silk} for using this in configuration
 *
 * @public
 *
 * @example
 * ```typescript
 * import { detectScopes } from "@savvy-web/commitlint";
 *
 * const scopes = detectScopes();
 * // For a monorepo with @savvy-web/foo and @savvy-web/bar:
 * // Returns: ["bar", "foo"]
 * ```
 */
export function detectScopes(cwd: string = process.cwd()): string[] {
	const root = safelyFindProjectRoot(cwd);
	if (!root) {
		return [];
	}

	const workspaces = getWorkspaces(root);
	const scopes: string[] = [];

	for (const workspace of workspaces) {
		const name = workspace.packageJson.name;
		if (!name) {
			continue;
		}

		const scopeName = extractScopeName(name);
		if (scopeName) {
			scopes.push(scopeName);
		}
	}

	return scopes.sort();
}
