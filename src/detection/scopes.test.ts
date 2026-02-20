import { describe, expect, it } from "vitest";
import { detectScopes } from "./scopes.js";

describe("detectScopes", () => {
	it("returns an array of scopes for the current repository", () => {
		const scopes = detectScopes();
		expect(Array.isArray(scopes)).toBe(true);
	});

	it("returns scopes sorted alphabetically", () => {
		const scopes = detectScopes();
		const sorted = [...scopes].sort();
		expect(scopes).toEqual(sorted);
	});

	it("returns empty array for non-existent directory", () => {
		const scopes = detectScopes("/tmp/nonexistent-dir-12345");
		expect(scopes).toEqual([]);
	});

	it("strips scope prefix from scoped package names", () => {
		// The current repo is @savvy-web/commitlint, so if in a monorepo
		// context, scopes should not contain the @ prefix
		const scopes = detectScopes();
		for (const scope of scopes) {
			expect(scope).not.toMatch(/^@/);
		}
	});
});
