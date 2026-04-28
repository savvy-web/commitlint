/**
 * `savvy-commit hook post-commit-verify` — replays commitlint, checks the
 * signature, and verifies the closes trailer if the branch implies one.
 *
 * @internal
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Command } from "@effect/cli";
import { Effect } from "effect";
import { readBranchInfo } from "../../../hook/diagnostics/branch.js";
import { readSigningDiagnostic } from "../../../hook/diagnostics/signing.js";
import { postToolUseAdvise } from "../../../hook/output.js";
import { hasClosingTrailer } from "../../../hook/rules/closes-trailer.js";
import { HookSilencer } from "../../../hook/silence-logger.js";

const execFileP = promisify(execFile);

export interface PostCommitInputs {
	commitlintFailed: boolean;
	sigStatus: string;
	autoSignEnabled: boolean;
	branchTicketId: number | null;
	bodyHasClosing: boolean;
}

export function buildPostCommitAdvice(i: PostCommitInputs): string | null {
	const lines: string[] = [];

	if (i.commitlintFailed) {
		lines.push(
			"The commit you just created fails commitlint validation. Run pnpm exec commitlint --last to see the violations, then fix with git commit --amend.",
		);
	}

	if (i.autoSignEnabled) {
		if (i.sigStatus === "N") {
			lines.push(
				"The commit was unsigned but commit.gpgsign=true is configured. Re-sign with: git commit --amend --no-edit -S",
			);
		} else if (["B", "X", "Y", "R", "E"].includes(i.sigStatus)) {
			lines.push(
				`The commit signature status is '${i.sigStatus}' (B=bad, X=expired sig, Y=expired key, R=revoked, E=missing key). Investigate your signing setup and amend.`,
			);
		}
	}

	if (i.branchTicketId !== null && !i.bodyHasClosing) {
		lines.push(
			`Branch implies ticket #${i.branchTicketId} but the commit body has no Closes/Fixes/Resolves trailer for it. If this commit closes #${i.branchTicketId}, amend with: git commit --amend --no-edit --trailer "Closes: #${i.branchTicketId}"`,
		);
	}

	return lines.length === 0 ? null : lines.join("\n\n");
}

async function runCommitlintLast(): Promise<boolean> {
	try {
		await execFileP("pnpm", ["exec", "commitlint", "--last"]);
		return false;
	} catch {
		return true;
	}
}

async function readSignatureStatus(): Promise<string> {
	try {
		const { stdout } = await execFileP("git", ["log", "-1", "--format=%G?"]);
		return stdout.trim();
	} catch {
		return "N";
	}
}

async function readLastCommitBody(): Promise<string> {
	try {
		const { stdout } = await execFileP("git", ["log", "-1", "--format=%B"]);
		return stdout;
	} catch {
		return "";
	}
}

export const postCommitVerifyCommand = Command.make("post-commit-verify", {}, () =>
	Effect.gen(function* () {
		const branch = yield* readBranchInfo();
		const signing = yield* readSigningDiagnostic();

		const commitlintFailed = yield* Effect.promise(runCommitlintLast);
		const sigStatus = yield* Effect.promise(readSignatureStatus);
		const body = yield* Effect.promise(readLastCommitBody);
		const bodyHasClosing = branch.inferredTicketId !== null && hasClosingTrailer(body, branch.inferredTicketId);

		const advice = buildPostCommitAdvice({
			commitlintFailed,
			sigStatus,
			autoSignEnabled: signing.autoSignEnabled,
			branchTicketId: branch.inferredTicketId,
			bodyHasClosing,
		});

		if (advice !== null) {
			yield* Effect.sync(() => process.stdout.write(`${JSON.stringify(postToolUseAdvise(advice))}\n`));
		}
	}).pipe(Effect.provide(HookSilencer)),
).pipe(Command.withDescription("Verify the most recent commit (commitlint replay + signature + closes trailer)"));
