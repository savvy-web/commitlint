/**
 * DCO (Developer Certificate of Origin) detection module.
 *
 * @internal
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { safelyFindProjectRoot } from "./utils.js";

/** Filename for the DCO file that indicates signoff is required. */
const DCO_FILENAME = "DCO";

/**
 * Detect if DCO signoff should be required.
 *
 * @remarks
 * Checks for the presence of a DCO file at the repository root.
 * Uses workspace-tools to find the actual repo root, since git commit
 * can be called from anywhere in the repository.
 *
 * The DCO file indicates that the project requires contributors
 * to sign off on their commits using the Developer Certificate of Origin.
 *
 * @param cwd - Working directory (defaults to process.cwd())
 * @returns `true` if DCO file exists at repo root, `false` otherwise
 *
 * @see https://developercertificate.org/ - Developer Certificate of Origin specification
 * @see {@link CommitlintConfig.silk} for using this in configuration
 *
 * @public
 *
 * @example
 * ```typescript
 * import { detectDCO } from "@savvy-web/commitlint";
 *
 * if (detectDCO()) {
 *   console.log("DCO signoff required");
 * }
 * ```
 */
export function detectDCO(cwd: string = process.cwd()): boolean {
	const repoRoot = safelyFindProjectRoot(cwd);
	const searchDir = repoRoot ?? cwd;
	return existsSync(join(searchDir, DCO_FILENAME));
}
