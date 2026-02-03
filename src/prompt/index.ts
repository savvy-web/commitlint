/**
 * Prompt configuration module for `\@commitlint/cz-commitlint`.
 *
 * @remarks
 * This module provides prompt configurations for use with the commitizen
 * adapter `\@commitlint/cz-commitlint`. It includes type definitions,
 * emoji support, and customizable prompt options.
 *
 * @example
 * ```typescript
 * // Use default prompt config
 * import promptConfig from "@savvy-web/commitlint/prompt";
 *
 * // Or create custom config
 * import { createPromptConfig } from "@savvy-web/commitlint/prompt";
 *
 * const config = createPromptConfig({
 *   emojis: true,
 *   scopes: ["api", "cli", "core"],
 * });
 * ```
 */

export type { CommitType } from "../config/rules.js";
export { COMMIT_TYPES } from "../config/rules.js";
export type { PromptConfigOptions, TypeEnumEntry } from "./config.js";
export {
	createPromptConfig,
	createTypeEnum,
	defaultPromptConfig,
	defaultPromptConfig as default,
	emojiPromptConfig,
} from "./config.js";
export { TYPE_EMOJIS, TYPE_EMOJIS_UNICODE, getTypeEmoji } from "./emojis.js";
