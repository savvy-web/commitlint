/**
 * `\@savvy-web/commitlint`
 *
 * Dynamic, intelligent commitlint configuration with auto-detection
 * of DCO requirements, workspace scopes, and versioning strategies.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * // commitlint.config.ts
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
import { createConfig } from "./config/factory.js";
import type { ConfigOptions } from "./config/schema.js";
import { ConfigOptionsSchema } from "./config/schema.js";
import type { CommitlintUserConfig } from "./config/types.js";

// Primary API types
export type { CommitlintUserConfig, ConfigOptions };
export type { CommitType } from "./config/rules.js";
// Commit type constants
export { COMMIT_TYPES, COMMIT_TYPE_DEFINITIONS } from "./config/rules.js";
export type { ReleaseFormat } from "./config/schema.js";
export type {
	CommitTypeDefinition,
	CommitlintPlugin,
	PromptConfig,
	PromptSettings,
	RuleApplicability,
	RuleConfigTuple,
	RuleSeverity,
	RulesConfig,
} from "./config/types.js";
/**
 * Dynamic commitlint configuration factory.
 *
 * @remarks
 * Provides static methods for creating commitlint configurations with
 * automatic detection of repository characteristics. The class co-locates
 * configuration creation with schema validation.
 *
 * @public
 *
 * @example
 * ```typescript
 * import { CommitlintConfig } from "@savvy-web/commitlint";
 *
 * // Auto-detect everything
 * export default CommitlintConfig.silk();
 *
 * // With explicit overrides
 * export default CommitlintConfig.silk({
 *   dco: true,                    // Override DCO detection
 *   scopes: ["api", "cli"],       // Replace auto-detected scopes
 *   additionalScopes: ["deps"],   // Add to auto-detected scopes
 *   releaseFormat: "semver",      // Override versioning detection
 *   emojis: true,                 // Enable emojis in prompts
 *   bodyMaxLineLength: 500,       // Custom body length
 * });
 * ```
 */
export class CommitlintConfig {
	/**
	 * Create a commitlint configuration with auto-detection.
	 *
	 * @remarks
	 * This is the primary entry point for generating commitlint configurations.
	 * When called without options, it auto-detects:
	 * - DCO requirement (from presence of DCO file)
	 * - Scopes (from workspace package names)
	 * - Release format (from versioning strategy)
	 *
	 * @param options - Optional configuration overrides
	 * @returns Commitlint UserConfig object ready for use
	 *
	 * @public
	 *
	 * @example
	 * ```typescript
	 * // Minimal usage - auto-detect everything
	 * export default CommitlintConfig.silk();
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Force DCO signoff regardless of DCO file presence
	 * export default CommitlintConfig.silk({ dco: true });
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Custom scopes for non-monorepo projects
	 * export default CommitlintConfig.silk({
	 *   scopes: ["core", "api", "cli", "docs"],
	 * });
	 * ```
	 */
	static silk(options: ConfigOptions = {}): CommitlintUserConfig {
		const validated = ConfigOptionsSchema.parse(options);
		return createConfig(validated);
	}

	private constructor() {
		// Prevent instantiation - use static methods only
	}
}

export default CommitlintConfig;
