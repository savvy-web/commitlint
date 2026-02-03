/**
 * TypeScript type definitions for commitlint configuration.
 *
 * @internal
 */
import type { UserConfig } from "@commitlint/types";

/**
 * Commitlint user configuration type.
 *
 * @remarks
 * Re-export of the official `@commitlint/types` UserConfig for convenience.
 * This allows consumers to type their configurations without adding
 * `@commitlint/types` as a direct dependency.
 *
 * @public
 */
export type CommitlintUserConfig = UserConfig;

/**
 * Commit type definition with metadata for prompts and documentation.
 *
 * @remarks
 * Each commit type has associated metadata used by interactive prompts
 * (via `@commitlint/cz-commitlint`) and changelog generation.
 *
 * @public
 */
export interface CommitTypeDefinition {
	/**
	 * Type identifier used in commit messages.
	 *
	 * @example "feat", "fix", "docs"
	 */
	readonly type: string;

	/**
	 * Human-readable description of when to use this type.
	 */
	readonly description: string;

	/**
	 * Title for display in prompts and changelogs.
	 */
	readonly title: string;

	/**
	 * Optional emoji shortcode for the type.
	 *
	 * @remarks
	 * When provided, uses GitHub/GitLab compatible shortcodes (e.g., `:sparkles:`).
	 */
	readonly emoji?: string;
}

/**
 * Rule severity level for commitlint rules.
 *
 * @remarks
 * - `0`: Disabled - rule is not checked
 * - `1`: Warning - rule violation produces a warning but allows commit
 * - `2`: Error - rule violation blocks the commit
 *
 * @public
 */
export type RuleSeverity = 0 | 1 | 2;

/**
 * Rule applicability determines when the rule condition applies.
 *
 * @remarks
 * - `"always"`: Rule must always be satisfied
 * - `"never"`: Rule condition must never be satisfied (inverts the check)
 *
 * @example
 * ```typescript
 * // Subject must NOT end with a period
 * "subject-full-stop": [2, "never", "."]
 *
 * // Subject must always be present
 * "subject-empty": [2, "never"]
 * ```
 *
 * @public
 */
export type RuleApplicability = "always" | "never";

/**
 * Rule configuration tuple format used by commitlint.
 *
 * @typeParam T - The type of the rule value (varies by rule)
 *
 * @public
 */
export type RuleConfig<T = unknown> = readonly [RuleSeverity, RuleApplicability, T];
