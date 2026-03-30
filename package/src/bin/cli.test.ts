import { describe, expect, it, vi } from "vitest";

describe("bin/cli", () => {
	it("imports and calls runCli", async () => {
		// Mock the cli module to prevent actually running the CLI
		vi.mock("../cli/index.js", () => ({
			runCli: vi.fn(),
		}));

		const { runCli } = await import("../cli/index.js");
		// Import the bin entry point to trigger the side effect
		await import("./cli.js");

		expect(runCli).toHaveBeenCalled();
	});
});
