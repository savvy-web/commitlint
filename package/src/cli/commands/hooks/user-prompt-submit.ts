/**
 * `savvy-commit hook user-prompt-submit` — emits a compact reminder when
 * the prompt mentions commit-related verbs.
 *
 * @internal
 */
import { Command } from "@effect/cli";
import { Effect, Schema } from "effect";
import { UserPromptSubmitEnvelope } from "../../../hook/envelope.js";
import { userPromptSubmitContext } from "../../../hook/output.js";
import { HookSilencer } from "../../../hook/silence-logger.js";

const TRIGGER =
	/(\bcommit\b|\bcommitting\b|\bship (it|this)\b|\bwrap (it )?up\b|\b(create|open) a (pr|pull request)\b|\bfinalize\b|\/finalize\b|\bsquash\b|\bamend\b)/i;

export function reminderForPrompt(prompt: string): string | null {
	if (!TRIGGER.test(prompt)) return null;
	return [
		"<commit_reminder>",
		"When you write the commit message:",
		"- Subject: type(scope): imperative summary, no period.",
		"- Body (only if needed): WHAT and WHY using ONLY facts from the diff. No vague qualifiers.",
		"- One bullet = one line (the 300-char limit makes soft-wraps unnecessary).",
		"- Do NOT reference .claude/plans, .claude/design, or any plan-file path.",
		"- Do NOT include planning narrative ('as decided in the plan', 'previously documented').",
		"- If a tracked issue is closed, add `Closes #N` above Signed-off-by.",
		"- DCO sign-off is required.",
		"</commit_reminder>",
	].join("\n");
}

export const userPromptSubmitCommand = Command.make("user-prompt-submit", {}, () =>
	Effect.gen(function* () {
		const stdin = yield* Effect.promise(readStdin);
		let envelope: Schema.Schema.Type<typeof UserPromptSubmitEnvelope>;
		try {
			envelope = Schema.decodeUnknownSync(UserPromptSubmitEnvelope)(JSON.parse(stdin));
		} catch {
			return;
		}
		const reminder = reminderForPrompt(envelope.prompt);
		if (reminder === null) return;
		yield* Effect.sync(() => process.stdout.write(`${JSON.stringify(userPromptSubmitContext(reminder))}\n`));
	}).pipe(Effect.provide(HookSilencer)),
).pipe(Command.withDescription("Inject a commit-quality reminder when the user prompt mentions commits"));

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
	return Buffer.concat(chunks).toString("utf8");
}
