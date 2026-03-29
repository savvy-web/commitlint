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
import { ManagedSectionLive } from "@savvy-web/silk-effects/hooks";
import { ChangesetConfigReaderLive, VersioningStrategyLive } from "@savvy-web/silk-effects/versioning";
import { Effect, Layer } from "effect";
import { WorkspaceDiscoveryLive, WorkspaceRootLive } from "workspaces-effect";
import { checkCommand } from "./commands/check.js";
import { initCommand } from "./commands/init.js";

/** Root command for the CLI with all subcommands. */
const rootCommand = Command.make("savvy-commit").pipe(Command.withSubcommands([initCommand, checkCommand]));

/** CLI application runner. */
const cli = Command.run(rootCommand, {
	name: "savvy-commit",
	version: process.env.__PACKAGE_VERSION__ ?? "0.0.0",
});

/** Workspace discovery wired on top of workspace root. */
const WorkspaceLive = WorkspaceDiscoveryLive.pipe(Layer.provideMerge(WorkspaceRootLive));

/** Combined layer providing all services needed by CLI commands. */
const CliLive = Layer.mergeAll(
	ManagedSectionLive,
	VersioningStrategyLive.pipe(Layer.provide(ChangesetConfigReaderLive)),
	WorkspaceLive,
).pipe(Layer.provideMerge(NodeContext.layer));

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

export { checkCommand, initCommand, rootCommand };
