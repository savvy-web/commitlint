import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BEGIN_MARKER, END_MARKER, extractManagedSection, generateManagedContent, initCommand } from "./init.js";

describe("generateManagedContent", () => {
	it("generates shell script with the config path", () => {
		const content = generateManagedContent("lib/configs/commitlint.config.ts");
		expect(content).toContain('commitlint --config "$ROOT/lib/configs/commitlint.config.ts"');
	});

	it("includes CI skip logic", () => {
		const content = generateManagedContent("commitlint.config.ts");
		expect(content).toContain("$CI");
		expect(content).toContain("$GITHUB_ACTIONS");
	});

	it("includes package manager detection", () => {
		const content = generateManagedContent("commitlint.config.ts");
		expect(content).toContain("detect_pm");
		expect(content).toContain("pnpm");
		expect(content).toContain("yarn");
		expect(content).toContain("bun");
		expect(content).toContain("npm");
	});

	it("includes pnpm dlx, yarn dlx, bun x, and npx commands", () => {
		const content = generateManagedContent("my-config.ts");
		expect(content).toContain("pnpm dlx commitlint");
		expect(content).toContain("yarn dlx commitlint");
		expect(content).toContain("bun x commitlint");
		expect(content).toContain("npx --no -- commitlint");
	});
});

describe("extractManagedSection", () => {
	it("extracts managed section from hook content", () => {
		const content = `#!/usr/bin/env sh
# Custom pre-hook

${BEGIN_MARKER}
managed content here
${END_MARKER}

# Custom post-hook`;

		const result = extractManagedSection(content);
		expect(result.found).toBe(true);
		expect(result.managedSection).toContain("managed content here");
		expect(result.managedSection).toContain(BEGIN_MARKER);
		expect(result.managedSection).toContain(END_MARKER);
		expect(result.beforeSection).toContain("Custom pre-hook");
		expect(result.afterSection).toContain("Custom post-hook");
	});

	it("returns found=false when no markers present", () => {
		const content = "#!/usr/bin/env sh\nsome other hook content";
		const result = extractManagedSection(content);

		expect(result.found).toBe(false);
		expect(result.managedSection).toBe("");
		expect(result.beforeSection).toBe(content);
		expect(result.afterSection).toBe("");
	});

	it("returns found=false when only begin marker present", () => {
		const content = `${BEGIN_MARKER}\nsome content`;
		const result = extractManagedSection(content);
		expect(result.found).toBe(false);
	});

	it("returns found=false when only end marker present", () => {
		const content = `some content\n${END_MARKER}`;
		const result = extractManagedSection(content);
		expect(result.found).toBe(false);
	});

	it("returns found=false when end marker comes before begin marker", () => {
		const content = `${END_MARKER}\nsome content\n${BEGIN_MARKER}`;
		const result = extractManagedSection(content);
		expect(result.found).toBe(false);
	});
});

describe("markers", () => {
	it("BEGIN_MARKER is a comment line", () => {
		expect(BEGIN_MARKER).toMatch(/^#/);
	});

	it("END_MARKER is a comment line", () => {
		expect(END_MARKER).toMatch(/^#/);
	});

	it("markers contain SAVVY-COMMIT", () => {
		expect(BEGIN_MARKER).toContain("SAVVY-COMMIT");
		expect(END_MARKER).toContain("SAVVY-COMMIT");
	});
});

describe("initCommand Effect program", () => {
	const testDir = "/tmp/commitlint-init-test";
	let originalCwd: string;

	beforeEach(() => {
		originalCwd = process.cwd();
		rmSync(testDir, { recursive: true, force: true });
		mkdirSync(testDir, { recursive: true });
		process.chdir(testDir);
	});

	afterEach(() => {
		process.chdir(originalCwd);
		rmSync(testDir, { recursive: true, force: true });
	});

	it("creates hook and config files from scratch", async () => {
		const handler = initCommand.handler({ force: false, config: "commitlint.config.ts" });
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));

		const hookContent = readFileSync(join(testDir, ".husky/commit-msg"), "utf8");
		expect(hookContent).toContain(BEGIN_MARKER);
		expect(hookContent).toContain(END_MARKER);
		expect(hookContent).toContain("#!/usr/bin/env sh");

		const configContent = readFileSync(join(testDir, "commitlint.config.ts"), "utf8");
		expect(configContent).toContain("CommitlintConfig");
	});

	it("updates existing hook file with managed section", async () => {
		mkdirSync(join(testDir, ".husky"), { recursive: true });
		writeFileSync(join(testDir, ".husky/commit-msg"), "#!/usr/bin/env sh\n# my custom hook\n");

		const handler = initCommand.handler({ force: false, config: "commitlint.config.ts" });
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));

		const hookContent = readFileSync(join(testDir, ".husky/commit-msg"), "utf8");
		expect(hookContent).toContain("# my custom hook");
		expect(hookContent).toContain(BEGIN_MARKER);
		expect(hookContent).toContain(END_MARKER);
	});

	it("replaces existing managed section on update", async () => {
		mkdirSync(join(testDir, ".husky"), { recursive: true });
		const oldContent = `#!/usr/bin/env sh\n${BEGIN_MARKER}\nold content\n${END_MARKER}\n`;
		writeFileSync(join(testDir, ".husky/commit-msg"), oldContent);

		const handler = initCommand.handler({ force: false, config: "commitlint.config.ts" });
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));

		const hookContent = readFileSync(join(testDir, ".husky/commit-msg"), "utf8");
		expect(hookContent).not.toContain("old content");
		expect(hookContent).toContain(BEGIN_MARKER);
		expect(hookContent).toContain("commitlint");
	});

	it("force-overwrites entire hook file", async () => {
		mkdirSync(join(testDir, ".husky"), { recursive: true });
		writeFileSync(join(testDir, ".husky/commit-msg"), "#!/usr/bin/env sh\n# custom\n");

		const handler = initCommand.handler({ force: true, config: "commitlint.config.ts" });
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));

		const hookContent = readFileSync(join(testDir, ".husky/commit-msg"), "utf8");
		expect(hookContent).not.toContain("# custom");
		expect(hookContent).toContain(BEGIN_MARKER);
	});

	it("does not overwrite existing config without force", async () => {
		writeFileSync(join(testDir, "commitlint.config.ts"), "// existing config");

		const handler = initCommand.handler({ force: false, config: "commitlint.config.ts" });
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));

		const configContent = readFileSync(join(testDir, "commitlint.config.ts"), "utf8");
		expect(configContent).toBe("// existing config");
	});

	it("overwrites existing config with force", async () => {
		writeFileSync(join(testDir, "commitlint.config.ts"), "// existing config");

		const handler = initCommand.handler({ force: true, config: "commitlint.config.ts" });
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));

		const configContent = readFileSync(join(testDir, "commitlint.config.ts"), "utf8");
		expect(configContent).toContain("CommitlintConfig");
	});

	it("creates nested config directories", async () => {
		const handler = initCommand.handler({ force: false, config: "lib/configs/commitlint.config.ts" });
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));

		const configContent = readFileSync(join(testDir, "lib/configs/commitlint.config.ts"), "utf8");
		expect(configContent).toContain("CommitlintConfig");
	});

	it("rejects absolute config paths", async () => {
		const handler = initCommand.handler({ force: false, config: "/absolute/path/config.ts" });
		const result = await Effect.runPromiseExit(Effect.provide(handler, NodeFileSystem.layer));
		expect(result._tag).toBe("Failure");
	});
});
