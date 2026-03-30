import { describe, expect, it } from "vitest";
import { checkCommand, initCommand, rootCommand, runCli } from "./index.js";

describe("cli module exports", () => {
	it("exports rootCommand", () => {
		expect(rootCommand).toBeDefined();
	});

	it("exports initCommand", () => {
		expect(initCommand).toBeDefined();
	});

	it("exports checkCommand", () => {
		expect(checkCommand).toBeDefined();
	});

	it("exports runCli function", () => {
		expect(typeof runCli).toBe("function");
	});
});
