/**
 * CLI entry point using `@effect/cli`.
 *
 * @remarks
 * This module provides the CLI application for managing commitlint
 * configuration. It uses Effect for functional error handling and
 * `@effect/cli` for command parsing.
 *
 * @internal
 */
import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { ChangesetConfigReaderLive, ManagedSectionLive, VersioningStrategyLive } from "@savvy-web/silk-effects";
import { Effect, Layer, LogLevel, Logger } from "effect";
import { WorkspaceDiscoveryLive, WorkspaceRootLive } from "workspaces-effect";
import { checkCommand } from "./commands/check.js";
import { hookCommand } from "./commands/hook.js";
import { initCommand } from "./commands/init.js";

/** Root command for the CLI with all subcommands. */
const rootCommand = Command.make("savvy-commit").pipe(
	Command.withSubcommands([initCommand, checkCommand, hookCommand]),
);

/** CLI application runner. */
const cli = Command.run(rootCommand, {
	name: "savvy-commit",
	version: process.env.__PACKAGE_VERSION__ ?? "0.0.0",
});

/** Workspace discovery wired on top of workspace root. */
const WorkspaceLive = WorkspaceDiscoveryLive.pipe(Layer.provideMerge(WorkspaceRootLive));

/**
 * Logger configuration that suppresses Info/Debug logs and routes
 * Warning/Error to stderr.
 *
 * @remarks
 * Hook subcommands reserve stdout for the JSON envelope they emit to Claude
 * Code. Effect's default logger writes to stdout via console.log, which would
 * pollute that contract (e.g., workspaces-effect emits "Workspace root found"
 * on every CLI invocation). Setting minimum log level to Warning silences
 * routine Info-level traffic; the replacement logger then routes anything
 * that does fire to stderr so stdout remains pristine.
 */
const StderrLogger = Logger.replace(
	Logger.defaultLogger,
	Logger.make(({ message }) => {
		const line = typeof message === "string" ? message : JSON.stringify(message);
		process.stderr.write(`${line}\n`);
	}),
);
const MinLogLevel = Logger.minimumLogLevel(LogLevel.Warning);

/** Combined layer providing all services needed by CLI commands. */
const CliLive = Layer.mergeAll(
	ManagedSectionLive,
	VersioningStrategyLive.pipe(Layer.provide(ChangesetConfigReaderLive)),
	WorkspaceLive,
).pipe(Layer.provide(MinLogLevel), Layer.provide(StderrLogger), Layer.provideMerge(NodeContext.layer));

/**
 * Run the CLI application.
 *
 * @remarks
 * Entry point for the CLI binary. Parses command-line arguments
 * and executes the appropriate subcommand.
 *
 * @internal
 */
export function runCli(): void {
	const main = Effect.suspend(() => cli(process.argv)).pipe(Effect.provide(CliLive));
	NodeRuntime.runMain(main);
}

export { checkCommand, hookCommand, initCommand, rootCommand };
