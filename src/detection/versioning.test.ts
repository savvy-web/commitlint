import { describe, expect, it } from "vitest";
import type { VersioningStrategy, WorkspacePackageInfo } from "./versioning.js";
import { detectReleaseFormat, detectVersioningStrategy, getPackageTag, isPackagePublishable } from "./versioning.js";

describe("getPackageTag", () => {
	const singleStrategy: VersioningStrategy = {
		type: "single",
		needsPerPackageTags: false,
		allPackages: [],
		publishablePackages: [],
		changesetConfig: null,
		fixedGroup: null,
		isMonorepo: false,
		isRootPrivate: false,
		explanation: "Single package",
	};

	const independentStrategy: VersioningStrategy = {
		type: "independent",
		needsPerPackageTags: true,
		allPackages: [],
		publishablePackages: [],
		changesetConfig: null,
		fixedGroup: null,
		isMonorepo: true,
		isRootPrivate: true,
		explanation: "Independent packages",
	};

	it("returns v-prefixed tag for single strategy", () => {
		expect(getPackageTag("@scope/pkg", "1.0.0", singleStrategy)).toBe("v1.0.0");
	});

	it("returns v-prefixed tag for fixed-group strategy", () => {
		const fixedStrategy: VersioningStrategy = { ...singleStrategy, type: "fixed-group" };
		expect(getPackageTag("@scope/pkg", "2.0.0", fixedStrategy)).toBe("v2.0.0");
	});

	it("returns scoped tag for scoped packages in independent strategy", () => {
		expect(getPackageTag("@scope/pkg", "1.0.0", independentStrategy)).toBe("@scope/pkg@1.0.0");
	});

	it("returns v-prefixed tag for non-scoped packages in independent strategy", () => {
		expect(getPackageTag("my-pkg", "1.0.0", independentStrategy)).toBe("my-pkg@v1.0.0");
	});
});

describe("isPackagePublishable", () => {
	const basePackage: WorkspacePackageInfo = {
		name: "test",
		version: "1.0.0",
		path: "/test",
		private: true,
		hasPublishConfig: false,
		access: undefined,
		targetCount: 0,
	};

	it("returns true when hasPublishConfig is true", () => {
		expect(isPackagePublishable({ ...basePackage, hasPublishConfig: true })).toBe(true);
	});

	it("returns true when targetCount > 0", () => {
		expect(isPackagePublishable({ ...basePackage, targetCount: 2 })).toBe(true);
	});

	it("returns true when not private", () => {
		expect(isPackagePublishable({ ...basePackage, private: false })).toBe(true);
	});

	it("returns false when private with no publish config or targets", () => {
		expect(isPackagePublishable(basePackage)).toBe(false);
	});
});

describe("detectVersioningStrategy", () => {
	it("runs against the current repository", () => {
		const strategy = detectVersioningStrategy();
		expect(strategy).toHaveProperty("type");
		expect(strategy).toHaveProperty("needsPerPackageTags");
		expect(strategy).toHaveProperty("allPackages");
		expect(strategy).toHaveProperty("publishablePackages");
		expect(strategy).toHaveProperty("isMonorepo");
		expect(strategy).toHaveProperty("isRootPrivate");
		expect(strategy).toHaveProperty("explanation");
		expect(["single", "fixed-group", "independent"]).toContain(strategy.type);
	});

	it("throws for non-git directory", () => {
		expect(() => detectVersioningStrategy("/tmp/nonexistent-dir-12345")).toThrow();
	});
});

describe("detectReleaseFormat", () => {
	it("returns a valid release format for current repo", () => {
		const format = detectReleaseFormat();
		expect(["semver", "packages", "scoped"]).toContain(format);
	});

	it("throws for non-git directory", () => {
		expect(() => detectReleaseFormat("/tmp/nonexistent-dir-12345")).toThrow();
	});
});
