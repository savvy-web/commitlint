/**
 * `savvy-commit hook pre-commit-message` — reads a PreToolUse envelope on
 * stdin and emits deny/advise/silent output for the bash hook.
 *
 * @internal
 */
import { resolve } from "node:path";
import { Command } from "@effect/cli";
import { Effect, Schema } from "effect";
import type { BranchInfo } from "../../../hook/diagnostics/branch.js";
import { readBranchInfo } from "../../../hook/diagnostics/branch.js";
import type { OpenIssue } from "../../../hook/diagnostics/open-issues.js";
import { readOpenIssuesFromCache } from "../../../hook/diagnostics/open-issues.js";
import { readSigningDiagnostic } from "../../../hook/diagnostics/signing.js";
import { PreToolUseEnvelope } from "../../../hook/envelope.js";
import type { HookOutput } from "../../../hook/output.js";
import { preToolUseAdvise, preToolUseDeny, preToolUseSilent } from "../../../hook/output.js";
import { parseBashCommand } from "../../../hook/parse-bash-command.js";
import { closesTrailerRule } from "../../../hook/rules/closes-trailer.js";
import { forbiddenContentRule } from "../../../hook/rules/forbidden-content.js";
import { planLeakageRule } from "../../../hook/rules/plan-leakage.js";
import { signingFlagConflictRule } from "../../../hook/rules/signing-flag-conflict.js";
import { softWrapRule } from "../../../hook/rules/soft-wrap.js";
import type { RuleHit } from "../../../hook/rules/types.js";
import { partitionHits } from "../../../hook/rules/types.js";
import { verbosityRule } from "../../../hook/rules/verbosity.js";
import { HookSilencer } from "../../../hook/silence-logger.js";

export interface EvaluateCtx {
	branchInfo: BranchInfo;
	openIssues: ReadonlyArray<OpenIssue>;
	autoSignEnabled: boolean;
}

export async function evaluateMessage(command: string, ctx: EvaluateCtx): Promise<HookOutput> {
	const parsed = parseBashCommand(command);
	if (parsed.kind === "unknown") return preToolUseSilent();
	if (parsed.message === null) return preToolUseSilent();

	const hits: RuleHit[] = [];
	const collect = async (eff: Effect.Effect<RuleHit | null>) => {
		const h = await Effect.runPromise(eff);
		if (h) hits.push(h);
	};

	await collect(forbiddenContentRule.check({ message: parsed.message }, undefined as never));
	await collect(planLeakageRule.check({ message: parsed.message }, undefined as never));
	await collect(softWrapRule.check({ message: parsed.message }, undefined as never));
	await collect(verbosityRule.check({ message: parsed.message }, undefined as never));
	await collect(
		closesTrailerRule.check({ message: parsed.message }, { branchInfo: ctx.branchInfo, openIssues: ctx.openIssues }),
	);
	await collect(signingFlagConflictRule.check({ flags: parsed.flags }, { autoSignEnabled: ctx.autoSignEnabled }));

	const { deny, advise } = partitionHits(hits);
	if (deny.length > 0) {
		return preToolUseDeny(
			["The following rules denied this commit message:", ...deny.map((h) => `- ${h.message}`)].join("\n"),
		);
	}
	if (advise.length > 0) {
		return preToolUseAdvise(
			[
				"The commit message you are about to write has issues that should be addressed:",
				...advise.map((h) => `- ${h.message}`),
			].join("\n"),
		);
	}
	return preToolUseSilent();
}

export const preCommitMessageCommand = Command.make("pre-commit-message", {}, () =>
	Effect.gen(function* () {
		const stdin = yield* Effect.promise(readStdin);
		let envelope: Schema.Schema.Type<typeof PreToolUseEnvelope>;
		try {
			envelope = Schema.decodeUnknownSync(PreToolUseEnvelope)(JSON.parse(stdin));
		} catch {
			return;
		}

		const command = String((envelope.tool_input as { command?: unknown }).command ?? "");
		if (!command) return;

		const branchInfo = yield* readBranchInfo();
		const signing = yield* readSigningDiagnostic();
		const issuesPath = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), ".claude/cache/issues.json");
		const issues = (yield* readOpenIssuesFromCache(issuesPath)) ?? [];

		const out = yield* Effect.promise(() =>
			evaluateMessage(command, { branchInfo, openIssues: issues, autoSignEnabled: signing.autoSignEnabled }),
		);
		if (out !== null) {
			yield* Effect.sync(() => process.stdout.write(`${JSON.stringify(out)}\n`));
		}
	}).pipe(Effect.provide(HookSilencer)),
).pipe(Command.withDescription("Validate a candidate git commit / gh pr command's message"));

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
	return Buffer.concat(chunks).toString("utf8");
}
