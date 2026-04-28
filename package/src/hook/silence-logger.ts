/**
 * Logger configuration shared by all hook subcommands.
 *
 * @remarks
 * Hook subcommands reserve stdout for the JSON envelope they emit to Claude
 * Code. Effect's default logger writes Info-level messages to stdout, which
 * pollutes that contract (e.g., workspaces-effect emits "Workspace root found"
 * on every CLI invocation). This Layer silences logs of Info and below so
 * stdout stays clean; Warning and Error still surface on stderr.
 *
 * @internal
 */
import { LogLevel, Logger } from "effect";

export const HookSilencer = Logger.minimumLogLevel(LogLevel.Warning);
