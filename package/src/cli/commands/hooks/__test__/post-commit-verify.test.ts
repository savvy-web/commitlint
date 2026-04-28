import { describe, expect, it } from "vitest";
import { buildPostCommitAdvice } from "../post-commit-verify.js";

describe("buildPostCommitAdvice", () => {
	it("emits commitlint-fail line when commitlint output indicates failure", () => {
		const out = buildPostCommitAdvice({
			commitlintFailed: true,
			sigStatus: "G",
			autoSignEnabled: true,
			branchTicketId: null,
			bodyHasClosing: false,
		});
		expect(out).toContain("commitlint --last");
	});

	it("emits unsigned advice when sigStatus N and autoSign on", () => {
		const out = buildPostCommitAdvice({
			commitlintFailed: false,
			sigStatus: "N",
			autoSignEnabled: true,
			branchTicketId: null,
			bodyHasClosing: false,
		});
		expect(out).toContain("--amend --no-edit -S");
	});

	it("does not emit signature advice when commit.gpgsign is off", () => {
		const out = buildPostCommitAdvice({
			commitlintFailed: false,
			sigStatus: "N",
			autoSignEnabled: false,
			branchTicketId: null,
			bodyHasClosing: false,
		});
		expect(out).toBeNull();
	});

	it("emits closes-missing advice when branch implies ticket but body has none", () => {
		const out = buildPostCommitAdvice({
			commitlintFailed: false,
			sigStatus: "G",
			autoSignEnabled: true,
			branchTicketId: 42,
			bodyHasClosing: false,
		});
		expect(out).toContain("Closes: #42");
	});

	it("returns null when all checks pass", () => {
		expect(
			buildPostCommitAdvice({
				commitlintFailed: false,
				sigStatus: "G",
				autoSignEnabled: true,
				branchTicketId: 42,
				bodyHasClosing: true,
			}),
		).toBeNull();
	});
});
