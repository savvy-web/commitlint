/**
 * Shared utilities for detection modules.
 *
 * @internal
 */
import { findProjectRoot } from "workspace-tools";

/**
 * Safely find the project root, returning null if not in a git repo.
 *
 * @remarks
 * Wraps workspace-tools' findProjectRoot to handle cases where the
 * function throws (e.g., not in a git repository).
 *
 * @param cwd - Working directory to start searching from
 * @returns Project root path or null if not found
 *
 * @internal
 */
export function safelyFindProjectRoot(cwd: string): string | null {
	try {
		return findProjectRoot(cwd);
	} catch {
		// Not in a git repository or other error
		return null;
	}
}
