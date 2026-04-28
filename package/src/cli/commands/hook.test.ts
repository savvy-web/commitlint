import { describe, expect, it } from "vitest";
import { hookCommand } from "./hook.js";

describe("hookCommand", () => {
	it("is a defined Effect CLI command", () => {
		expect(hookCommand).toBeDefined();
	});
});
