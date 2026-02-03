/**
 * Configuration factory implementation.
 *
 * @internal
 */
import type { UserConfig } from "@commitlint/types";
import { detectDCO } from "../detection/dco.js";
import { detectScopes } from "../detection/scopes.js";
import { silkPlugin } from "./plugins.js";
import { COMMIT_TYPES } from "./rules.js";
import type { ResolvedConfigOptions } from "./schema.js";

/**
 * Create a commitlint configuration with auto-detection.
 *
 * @remarks
 * This function is the internal implementation for {@link CommitlintConfig.silk}.
 * It receives already-validated options and performs the actual configuration
 * assembly with auto-detection of repository settings.
 *
 * @param options - Resolved configuration options (after Zod parsing)
 * @returns Commitlint UserConfig object
 *
 * @internal
 */
export function createConfig(options: ResolvedConfigOptions): UserConfig {
	const cwd = options.cwd ?? process.cwd();

	const dco = options.dco ?? detectDCO(cwd);
	const detectedScopes = detectScopes(cwd);
	const scopes = options.scopes ?? detectedScopes;
	const allScopes = [...new Set([...scopes, ...(options.additionalScopes ?? [])])].sort();

	const rules: UserConfig["rules"] = {
		"body-max-line-length": [2, "always", options.bodyMaxLineLength],
		"type-enum": [2, "always", [...COMMIT_TYPES]],
		// Allow any case in subject (AI tools often capitalize, which is acceptable)
		"subject-case": [0],
	};

	if (allScopes.length > 0) {
		rules["scope-enum"] = [2, "always", allScopes];
	}

	if (dco) {
		// Use custom case-insensitive rule instead of built-in signed-off-by
		rules["silk/signed-off-by"] = [2, "always"];
	}

	if (options.noMarkdown) {
		rules["silk/body-no-markdown"] = [2, "always"];
		rules["silk/subject-no-markdown"] = [2, "always"];
	}

	return {
		extends: ["@commitlint/config-conventional"],
		plugins: [silkPlugin],
		rules,
		prompt: {
			settings: {
				enableMultipleScopes: true,
				scopeEnumSeparator: ",",
			},
		},
	};
}
