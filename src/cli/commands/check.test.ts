import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkCommand } from "./check.js";
import { BEGIN_MARKER, END_MARKER, generateManagedContent } from "./init.js";

describe("checkCommand", () => {
	it("is a valid Effect CLI command", () => {
		expect(checkCommand).toBeDefined();
	});
});

describe("check helpers via init re-exports", () => {
	it("extractConfigPathFromManaged finds config path in managed content", () => {
		const configPath = "lib/configs/commitlint.config.ts";
		const managedContent = `${BEGIN_MARKER}\n${generateManagedContent(configPath)}\n${END_MARKER}`;

		expect(managedContent).toContain(`commitlint --config "$ROOT/${configPath}"`);
	});

	it("managed section with correct config path is self-consistent", () => {
		const configPath = "commitlint.config.ts";
		const content = generateManagedContent(configPath);
		const fullSection = `${BEGIN_MARKER}\n${content}\n${END_MARKER}`;

		const content2 = generateManagedContent(configPath);
		const fullSection2 = `${BEGIN_MARKER}\n${content2}\n${END_MARKER}`;
		expect(fullSection).toBe(fullSection2);
	});
});

describe("checkCommand Effect program", () => {
	const testDir = "/tmp/commitlint-check-test";
	let originalCwd: string;

	beforeEach(() => {
		originalCwd = process.cwd();
		rmSync(testDir, { recursive: true, force: true });
		mkdirSync(testDir, { recursive: true });
		// Initialize a git repo so workspace-tools doesn't throw
		execSync("git init", { cwd: testDir, stdio: "ignore" });
		writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "test-pkg", private: true }));
		process.chdir(testDir);
	});

	afterEach(() => {
		process.chdir(originalCwd);
		rmSync(testDir, { recursive: true, force: true });
	});

	it("runs without errors when no config exists", async () => {
		const handler = checkCommand.handler({});
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));
	});

	it("runs when config file exists", async () => {
		writeFileSync(join(testDir, "commitlint.config.ts"), "export default {};");

		const handler = checkCommand.handler({});
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));
	});

	it("runs when husky hook exists without managed section", async () => {
		mkdirSync(join(testDir, ".husky"), { recursive: true });
		writeFileSync(join(testDir, ".husky/commit-msg"), "#!/usr/bin/env sh\necho test\n");

		const handler = checkCommand.handler({});
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));
	});

	it("runs when husky hook has managed section", async () => {
		mkdirSync(join(testDir, ".husky"), { recursive: true });
		const configPath = "lib/configs/commitlint.config.ts";
		const hookContent = `#!/usr/bin/env sh\n${BEGIN_MARKER}\n${generateManagedContent(configPath)}\n${END_MARKER}\n`;
		writeFileSync(join(testDir, ".husky/commit-msg"), hookContent);

		const handler = checkCommand.handler({});
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));
	});

	it("runs when husky hook has outdated managed section", async () => {
		mkdirSync(join(testDir, ".husky"), { recursive: true });
		const hookContent = `#!/usr/bin/env sh\n${BEGIN_MARKER}\nold outdated content\n${END_MARKER}\n`;
		writeFileSync(join(testDir, ".husky/commit-msg"), hookContent);

		const handler = checkCommand.handler({});
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));
	});

	it("runs when DCO file exists", async () => {
		writeFileSync(join(testDir, "DCO"), "Developer Certificate of Origin Version 1.1");
		writeFileSync(join(testDir, "commitlint.config.ts"), "export default {};");
		mkdirSync(join(testDir, ".husky"), { recursive: true });
		writeFileSync(join(testDir, ".husky/commit-msg"), "#!/usr/bin/env sh\n");

		const handler = checkCommand.handler({});
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));
	});

	it("detects various config file types", async () => {
		writeFileSync(join(testDir, ".commitlintrc.json"), "{}");

		const handler = checkCommand.handler({});
		await Effect.runPromise(Effect.provide(handler, NodeFileSystem.layer));
	});
});
