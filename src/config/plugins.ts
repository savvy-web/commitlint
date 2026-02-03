/**
 * Custom commitlint plugin rules.
 *
 * @remarks
 * These rules help enforce plain-text commit messages by rejecting
 * common markdown formatting patterns that AI agents tend to add.
 *
 * @internal
 */
import type { Rule } from "@commitlint/types";

/**
 * Patterns that indicate markdown formatting in commit messages.
 *
 * @internal
 */
const MARKDOWN_PATTERNS = {
	/** Markdown headers (# Header, ## Header, etc.) */
	headers: /^#{1,6}\s/m,
	/** Markdown bullet lists (- item, * item) */
	bullets: /^[\t ]*[-*]\s/m,
	/** Markdown numbered lists (1. item, 2. item) */
	numberedLists: /^[\t ]*\d+\.\s/m,
	/** Markdown code fences (triple backticks) */
	codeFences: /```/,
	/** Markdown inline code (`code`) - only flag if excessive */
	inlineCode: /`[^`]+`/g,
	/** Markdown bold (**text** or __text__) */
	bold: /(\*\*|__)[^*_]+(\*\*|__)/,
	/** Markdown italic (*text* or _text_) - be careful not to match normal underscores */
	italic: /(?<!\w)\*[^*]+\*(?!\w)/,
	/** Markdown links [text](url) */
	links: /\[.+?\]\(.+?\)/,
	/** Markdown horizontal rules (---, ***, ___) */
	horizontalRules: /^[-*_]{3,}$/m,
};

/**
 * Check if text contains markdown formatting.
 *
 * @param text - Text to check
 * @returns Object with detected patterns
 */
function detectMarkdown(text: string): { hasMarkdown: boolean; patterns: string[] } {
	const detected: string[] = [];

	if (MARKDOWN_PATTERNS.headers.test(text)) detected.push("headers (#)");
	if (MARKDOWN_PATTERNS.bullets.test(text)) detected.push("bullet lists (- or *)");
	if (MARKDOWN_PATTERNS.numberedLists.test(text)) detected.push("numbered lists (1.)");
	if (MARKDOWN_PATTERNS.codeFences.test(text)) detected.push("code fences (```)");
	if (MARKDOWN_PATTERNS.bold.test(text)) detected.push("bold (**text**)");
	if (MARKDOWN_PATTERNS.links.test(text)) detected.push("links ([text](url))");
	if (MARKDOWN_PATTERNS.horizontalRules.test(text)) detected.push("horizontal rules (---)");

	// Only flag inline code if there are multiple instances (occasional backticks are OK)
	const inlineCodeMatches = text.match(MARKDOWN_PATTERNS.inlineCode);
	if (inlineCodeMatches && inlineCodeMatches.length > 2) {
		detected.push("excessive inline code (`code`)");
	}

	return { hasMarkdown: detected.length > 0, patterns: detected };
}

/**
 * Rule: body-no-markdown
 *
 * @remarks
 * Rejects commit message bodies that contain markdown formatting.
 * This helps ensure commit messages are plain text and readable
 * in terminals, git log, and other tools that don't render markdown.
 *
 * @example
 * ```
 * // Invalid - contains markdown
 * feat: add feature
 *
 * ## Summary
 * - Added new feature
 * - Fixed bug
 *
 * // Valid - plain text
 * feat: add feature
 *
 * Added new feature and fixed related bug.
 * ```
 */
const bodyNoMarkdown: Rule = (parsed) => {
	const body = parsed.body;
	if (!body) return [true, ""];

	const { hasMarkdown, patterns } = detectMarkdown(body);
	if (hasMarkdown) {
		return [false, `body contains markdown formatting: ${patterns.join(", ")}`];
	}
	return [true, ""];
};

/**
 * Rule: subject-no-markdown
 *
 * @remarks
 * Rejects commit message subjects (first line) that contain markdown.
 * Subjects should be plain text without any formatting.
 */
const subjectNoMarkdown: Rule = (parsed) => {
	const subject = parsed.subject;
	if (!subject) return [true, ""];

	const { hasMarkdown, patterns } = detectMarkdown(subject);
	if (hasMarkdown) {
		return [false, `subject contains markdown formatting: ${patterns.join(", ")}`];
	}
	return [true, ""];
};

/**
 * Rule: body-prose-only
 *
 * @remarks
 * A stricter rule that requires commit bodies to be prose paragraphs,
 * rejecting any list-like structures even without markdown markers.
 * Checks for lines that look like list items.
 */
const bodyProseOnly: Rule = (parsed) => {
	const body = parsed.body;
	if (!body) return [true, ""];

	// Check for list-like patterns (lines starting with -, *, •, or numbers)
	const listPatterns = /^[\t ]*(?:[-*•]|\d+[.):])\s/m;
	if (listPatterns.test(body)) {
		return [false, "body should be prose paragraphs, not lists"];
	}
	return [true, ""];
};

/**
 * Rule: signed-off-by
 *
 * @remarks
 * Case-insensitive check for DCO signoff trailer. Accepts both
 * "Signed-off-by:" and "signed-off-by:" (and any other casing).
 *
 * This replaces the built-in commitlint signed-off-by rule which
 * is case-sensitive.
 */
const signedOffBy: Rule = (parsed) => {
	const raw = parsed.raw;
	if (!raw) return [false, "message must be signed off"];

	// Case-insensitive match for "signed-off-by:" anywhere in the message
	const signoffPattern = /^signed-off-by:\s*.+$/im;
	if (signoffPattern.test(raw)) {
		return [true, ""];
	}
	return [false, "message must be signed off"];
};

/**
 * Custom commitlint plugin with markdown prevention rules.
 *
 * @remarks
 * This plugin provides rules to enforce plain-text commit messages.
 * Rules are prefixed with `silk/` to namespace them.
 *
 * Available rules:
 * - `silk/body-no-markdown`: Reject markdown in commit body
 * - `silk/subject-no-markdown`: Reject markdown in commit subject
 * - `silk/body-prose-only`: Require prose paragraphs (no lists)
 *
 * @internal
 */
export const silkPlugin = {
	rules: {
		"silk/body-no-markdown": bodyNoMarkdown,
		"silk/subject-no-markdown": subjectNoMarkdown,
		"silk/body-prose-only": bodyProseOnly,
		"silk/signed-off-by": signedOffBy,
	},
};

/**
 * Rule names exported for type safety.
 *
 * @internal
 */
export type SilkRuleName = keyof typeof silkPlugin.rules;
