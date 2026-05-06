/**
 * `savvy-commit hook session-start` — emits the additionalContext block
 * the SessionStart hook injects into the agent's context.
 *
 * @internal
 */
import { resolve } from "node:path";
import { Command } from "@effect/cli";
import { Effect } from "effect";
import { readBranchInfo } from "../../../hook/diagnostics/branch.js";
import { ISSUES_CACHE_RELATIVE_PATH, readOrFetchOpenIssues } from "../../../hook/diagnostics/open-issues.js";
import { readSigningDiagnostic } from "../../../hook/diagnostics/signing.js";
import { sessionStartContext } from "../../../hook/output.js";
import { HookSilencer } from "../../../hook/silence-logger.js";

export const sessionStartCommand = Command.make("session-start", {}, () =>
	Effect.gen(function* () {
		const branch = yield* readBranchInfo();
		const signing = yield* readSigningDiagnostic();
		const issuesCachePath = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), ISSUES_CACHE_RELATIVE_PATH);
		const issues = yield* readOrFetchOpenIssues(issuesCachePath);

		const blocks: string[] = [];

		blocks.push(buildCommitConventionsBlock());
		blocks.push(buildQualityBlock());

		if (branch.branch) {
			blocks.push(buildBranchBlock(branch.branch, branch.inferredTicketId, issues));
		}

		blocks.push(buildSigningBlock(signing));

		const ctx = `<EXTREMELY_IMPORTANT>\n${blocks.join("\n\n")}\n</EXTREMELY_IMPORTANT>`;
		const out = sessionStartContext(ctx);
		yield* Effect.sync(() => process.stdout.write(`${JSON.stringify(out)}\n`));
	}).pipe(Effect.provide(HookSilencer)),
).pipe(Command.withDescription("Emit the SessionStart additionalContext for the commitlint plugin"));

function buildCommitConventionsBlock(): string {
	return [
		"<commit_conventions>",
		"All commits validated by @savvy-web/commitlint Silk preset.",
		"Format: type(scope): subject / body (optional) / trailers.",
		"Allowed types: ai, build, chore, ci, docs, feat, fix, perf, refactor, release, revert, style, tdd, test.",
		"tdd commits require a scope in the format goalId:state — e.g. tdd(7:green): implement sum().",
		"Body max line length: 300 chars. No markdown headers, code fences, links, or numbered lists.",
		"DCO sign-off required when DCO file is present.",
		"</commit_conventions>",
	].join("\n");
}

function buildQualityBlock(): string {
	return [
		"<commit_message_quality>",
		"<body_rules>",
		"- Bodies give orientation, not documentation. Write 2-5 lines max; omit entirely when the subject is self-explanatory.",
		"- Explain what changed conceptually and why — one level above the diff. The code is the documentation for implementation details.",
		"- Do NOT insert line breaks mid-bullet or mid-paragraph. Each bullet and each paragraph is one continuous line. If a line is too long, rewrite it shorter — do not soft-wrap it.",
		"- Name the concept or component that changed, not every file touched.",
		'- Avoid vague qualifiers ("for clarity", "to improve readability") unless the diff is purely formatting.',
		"- Dependency updates: list direct deps changed in the manifest only; never enumerate transitive lockfile changes.",
		"</body_rules>",
		"<skip_in_body>",
		"- Routine updates to CLAUDE.md, .claude/design/, .claude/skills/, or any AI context file — skip unless a major structural change must be called out.",
		"- Config file tweaks (biome.jsonc, tsconfig, markdownlint, lint-staged, etc.) — skip unless the config change itself is the substantive point of the commit.",
		"- File-by-file implementation walkthroughs — name the concept, not every file modified.",
		'- Phrases like "as decided in the plan", "previously documented", "see the design doc", or any plan-file path reference.',
		"</skip_in_body>",
		"<forbidden_in_body>",
		"- Markdown headers, numbered lists, code fences, links, bold/italic.",
		"</forbidden_in_body>",
		"<issue_closing>",
		"- When a commit closes a tracked issue, include a Closes #N trailer above Signed-off-by.",
		"</issue_closing>",
		"</commit_message_quality>",
	].join("\n");
}

function buildBranchBlock(
	branch: string,
	ticketId: number | null,
	issues: ReadonlyArray<{ number: number; title: string }> | null,
): string {
	const lines = [
		"<branch_context>",
		`<current_branch>${branch}</current_branch>`,
		`<inferred_ticket_id>${ticketId ?? "null"}</inferred_ticket_id>`,
	];
	if (issues && issues.length > 0) {
		lines.push("<open_issues_in_repo>");
		for (const i of issues) lines.push(`  - #${i.number}  ${i.title}`);
		lines.push("</open_issues_in_repo>");
	}
	lines.push("</branch_context>");
	return lines.join("\n");
}

function buildSigningBlock(d: {
	format: string;
	autoSignEnabled: boolean;
	signingKeyConfigured: boolean;
	keyResolves: boolean;
	agentResponsive: boolean;
	warnings: ReadonlyArray<string>;
}): string {
	const lines = [
		"<signing_diagnostic>",
		`<format>${d.format}</format>`,
		`<auto_sign_enabled>${d.autoSignEnabled}</auto_sign_enabled>`,
		`<signing_key_configured>${d.signingKeyConfigured}</signing_key_configured>`,
		`<key_resolves>${d.keyResolves}</key_resolves>`,
		`<agent_responsive>${d.agentResponsive}</agent_responsive>`,
		"<warnings>",
	];
	for (const w of d.warnings) lines.push(`  - ${w}`);
	lines.push("</warnings>", "</signing_diagnostic>");
	return lines.join("\n");
}
