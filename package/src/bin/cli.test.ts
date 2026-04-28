import { describe, expect, it, vi } from "vitest";

// vi.mock is hoisted to the top of the module by vitest. Keep it at module top level
// (not nested inside `it`) per vitest's stated future-proofing requirements.
vi.mock("../cli/index.js", () => ({
	runCli: vi.fn(),
}));

describe("bin/cli", () => {
	it("imports and calls runCli", async () => {
		const { runCli } = await import("../cli/index.js");
		// Import the bin entry point to trigger the side effect
		await import("./cli.js");

		expect(runCli).toHaveBeenCalled();
	});
});
