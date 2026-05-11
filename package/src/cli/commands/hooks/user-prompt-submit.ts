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
		"Before composing this commit message, invoke the commitlint:commit-create skill.",
		"It defines the complete type enum, scope rules, DCO signoff format, and body",
		"constraints enforced by @savvy-web/commitlint.",
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
