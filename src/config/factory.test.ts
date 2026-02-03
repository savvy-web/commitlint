import { describe, expect, it } from "vitest";
import { CommitlintConfig } from "../index.js";
import { COMMIT_TYPES } from "./rules.js";

describe("CommitlintConfig.silk()", () => {
	it("creates valid commitlint config with extends", () => {
		const config = CommitlintConfig.silk({ dco: false });

		expect(config).toHaveProperty("extends");
		expect(config).toHaveProperty("rules");
		expect(config.extends).toContain("@commitlint/config-conventional");
	});

	it("includes all commit types in type-enum rule", () => {
		const config = CommitlintConfig.silk({ dco: false });

		expect(config.rules).toHaveProperty("type-enum");
		const typeEnumRule = config.rules?.["type-enum"] as [number, string, string[]] | undefined;
		expect(typeEnumRule).toBeDefined();
		expect(typeEnumRule?.[0]).toBe(2); // error level
		expect(typeEnumRule?.[1]).toBe("always");
		expect(typeEnumRule?.[2]).toEqual(expect.arrayContaining([...COMMIT_TYPES]));
	});

	it("sets body-max-line-length to default of 300", () => {
		const config = CommitlintConfig.silk({ dco: false });

		expect(config.rules?.["body-max-line-length"]).toEqual([2, "always", 300]);
	});

	it("respects custom bodyMaxLineLength option", () => {
		const config = CommitlintConfig.silk({ dco: false, bodyMaxLineLength: 500 });

		expect(config.rules?.["body-max-line-length"]).toEqual([2, "always", 500]);
	});

	it("enables case-insensitive signed-off-by rule when dco is true", () => {
		const config = CommitlintConfig.silk({ dco: true });

		expect(config.rules?.["silk/signed-off-by"]).toBeDefined();
		expect(config.rules?.["silk/signed-off-by"]).toEqual([2, "always"]);
	});

	it("disables signed-off-by rule when dco is false", () => {
		const config = CommitlintConfig.silk({ dco: false });

		expect(config.rules?.["silk/signed-off-by"]).toBeUndefined();
	});

	it("adds scope-enum rule when scopes are provided", () => {
		const config = CommitlintConfig.silk({
			dco: false,
			scopes: ["api", "cli", "core"],
		});

		expect(config.rules?.["scope-enum"]).toEqual([2, "always", ["api", "cli", "core"]]);
	});

	it("merges additionalScopes with provided scopes", () => {
		const config = CommitlintConfig.silk({
			dco: false,
			scopes: ["api", "cli"],
			additionalScopes: ["docs", "deps"],
		});

		// Should be sorted and deduplicated
		expect(config.rules?.["scope-enum"]).toEqual([2, "always", ["api", "cli", "deps", "docs"]]);
	});

	it("includes prompt configuration", () => {
		const config = CommitlintConfig.silk({ dco: false });

		expect(config.prompt).toBeDefined();
		expect(config.prompt?.settings?.enableMultipleScopes).toBe(true);
		expect(config.prompt?.settings?.scopeEnumSeparator).toBe(",");
	});
});
