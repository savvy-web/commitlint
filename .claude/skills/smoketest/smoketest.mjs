#!/usr/bin/env node
/**
 * Commitlint smoketest runner.
 *
 * Usage:
 *   node .claude/skills/smoketest/smoketest.mjs [categories...] [hook] [cli] [build]
 *
 * categories: types, dco, markdown, tdd  (default: all)
 * hook        — test via git commit-msg hook only
 * cli         — test via commitlint CLI only
 * build       — run pnpm ci:build before testing
 *
 * Examples:
 *   node .claude/skills/smoketest/smoketest.mjs
 *   node .claude/skills/smoketest/smoketest.mjs tdd
 *   node .claude/skills/smoketest/smoketest.mjs tdd dco cli
 *   node .claude/skills/smoketest/smoketest.mjs build
 */

import { spawnSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const CASES = JSON.parse(readFileSync(resolve(SKILL_DIR, "cases.json"), "utf8"));
const TEMP_FILE = "/tmp/smoketest-msg.txt";
const COMMITLINT_CONFIG = "lib/configs/commitlint.config.ts";
const ALL_CATEGORIES = Object.keys(CASES);
const CONTROL_ARGS = new Set(["hook", "cli", "build"]);

const args = process.argv.slice(2);
const runBuild = args.includes("build");
const hookOnly = args.includes("hook");
const cliOnly = args.includes("cli");
const categoryArgs = args.filter((a) => !CONTROL_ARGS.has(a));
const categories = categoryArgs.length > 0 ? categoryArgs : ALL_CATEGORIES;

const runHook = !cliOnly;
const runCli = !hookOnly;

// Validate category args
for (const cat of categoryArgs) {
	if (!CASES[cat]) {
		console.error(`Unknown category: "${cat}". Valid: ${ALL_CATEGORIES.join(", ")}`);
		process.exit(1);
	}
}

// Build step
if (runBuild) {
	console.log("Building package (pnpm ci:build)...");
	const result = spawnSync("pnpm", ["ci:build"], { stdio: "inherit" });
	if (result.status !== 0) {
		console.error("Build failed — aborting smoketest.");
		process.exit(1);
	}
	console.log("");
}

let passed = 0;
let failed = 0;
const failures = [];

function writeMsg(message) {
	writeFileSync(TEMP_FILE, message, "utf8");
}

function runCLI(name, message, expectPass) {
	writeMsg(message);
	const result = spawnSync("pnpm", ["exec", "commitlint", "--config", COMMITLINT_CONFIG, "--edit", TEMP_FILE], {
		encoding: "utf8",
	});
	const didPass = result.status === 0;
	report("CLI", name, expectPass, didPass, result.stderr || result.stdout || "");
}

function runGitHook(name, message, expectPass) {
	writeMsg(message);
	const result = spawnSync("git", ["commit", "--allow-empty", "-F", TEMP_FILE], {
		encoding: "utf8",
	});
	const didPass = result.status === 0;
	if (didPass) {
		spawnSync("git", ["reset", "--soft", "HEAD~1"], { stdio: "ignore" });
	}
	report("HOOK", name, expectPass, didPass, result.stderr || result.stdout || "");
}

function report(path, name, expectPass, didPass, output) {
	const matched = didPass === expectPass;
	const expectLabel = expectPass ? "pass" : "fail";
	if (matched) {
		console.log(`  ✅ ${path} [${expectLabel}] ${name}`);
		passed++;
	} else {
		const gotLabel = didPass ? "pass" : "fail";
		console.log(`  ❌ ${path} [expected=${expectLabel} got=${gotLabel}] ${name}`);
		if (!didPass && output) {
			const lines = output
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean)
				.slice(0, 4);
			for (const line of lines) console.log(`       ${line}`);
		}
		failures.push(`${path}: ${name}`);
		failed++;
	}
}

// Run tests
for (const category of categories) {
	const cases = CASES[category];
	console.log(`\n--- ${category} (${cases.length} cases) ---`);
	for (const tc of cases) {
		const expectPass = tc.expect === "pass";
		if (runCli) runCLI(tc.name, tc.message, expectPass);
		if (runHook) runGitHook(tc.name, tc.message, expectPass);
	}
}

// Cleanup
try {
	unlinkSync(TEMP_FILE);
} catch {}

// Summary
const total = passed + failed;
console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed}/${total} passed`);

if (failures.length > 0) {
	console.log("\nFailures:");
	for (const f of failures) console.log(`  ❌ ${f}`);
	process.exit(1);
} else {
	console.log("All tests passed ✅");
}
