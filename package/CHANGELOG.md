# @savvy-web/commitlint

## 0.10.1

### Dependencies

* | [`783a15d`](https://github.com/savvy-web/commitlint/commit/783a15d189e75fc7ea244597a25d2d45d471aa71) | Dependency     | Type    | Action   | From     | To |
  | :--------------------------------------------------------------------------------------------------- | :------------- | :------ | :------- | :------- | -- |
  | @commitlint/cli                                                                                      | peerDependency | updated | ^21.0.1  | ^21.0.2  |    |
  | @commitlint/config-conventional                                                                      | peerDependency | updated | ^21.0.1  | ^21.0.2  |    |
  | @commitlint/cli                                                                                      | devDependency  | updated | ^21.0.1  | ^21.0.2  |    |
  | @commitlint/config-conventional                                                                      | devDependency  | updated | ^21.0.1  | ^21.0.2  |    |
  | @commitlint/lint                                                                                     | devDependency  | updated | ^21.0.1  | ^21.0.2  |    |
  | @savvy-web/rslib-builder                                                                             | devDependency  | updated | ^0.20.10 | ^0.20.11 |    |

## 0.10.0

### Breaking Changes

* [`32bb19b`](https://github.com/savvy-web/commitlint/commit/32bb19b1cbc272f72744f1d4cc4c90e22c69efb6) The options schema for `CommitlintConfig.silk(options)` has migrated from
  `zod` to Effect Schema. The accepted input shape and all defaults are
  unchanged. However, if your code catches the validation error thrown on
  invalid options by type, the error is now an Effect Schema `ParseError`
  rather than a `ZodError`:

```ts
// Before
import { ZodError } from "zod";
try {
  CommitlintConfig.silk(badOptions);
} catch (e) {
  if (e instanceof ZodError) {
    /* ... */
  }
}

// After — Effect Schema ParseError
import { ParseResult } from "effect";

try {
  CommitlintConfig.silk(badOptions);
} catch (e) {
  if (e instanceof ParseResult.ParseError) {
    /* ... */
  }
}
```

`zod` is no longer a runtime dependency of this package.

### Features

* [`32bb19b`](https://github.com/savvy-web/commitlint/commit/32bb19b1cbc272f72744f1d4cc4c90e22c69efb6) ### `savvy-commit init`: ordered managed sections in commit-msg hook

`savvy-commit init` now writes `.husky/commit-msg` as an ordered pair of
silk-effects managed sections:

1. A shared `savvy-base` preamble — `ROOT`, `in_ci()`, `detect_pm()`,
   `PM`, and `pm_exec()` — owned by this package.
2. A one-line `savvy-commit` section that runs the commitlint check:

```sh
in_ci || pm_exec commitlint --config "$ROOT/<path>" --edit "$1"
```

The package-manager runner is now standardized on local exec semantics
for all four supported PMs (`pnpm exec` / `yarn exec` / `bun x` /
`npx --no`), fixing the previous `yarn dlx` / `bun x` inconsistency.

Users may inject custom shell above, below, or between the sections.
Existing hooks are updated in place; unmanaged content is preserved.

### Dependencies

* | [`32bb19b`](https://github.com/savvy-web/commitlint/commit/32bb19b1cbc272f72744f1d4cc4c90e22c69efb6) | Dependency    | Type    | Action  | From    | To |
  | ---------------------------------------------------------------------------------------------------- | ------------- | ------- | ------- | ------- | -- |
  | zod                                                                                                  | dependency    | removed | ^4.4.3  | —       |    |
  | @savvy-web/silk-effects                                                                              | dependency    | updated | ^0.4.1  | ^0.5.0  |    |
  | shell-quote                                                                                          | dependency    | updated | ^1.8.3  | ^1.8.4  |    |
  | workspaces-effect                                                                                    | dependency    | updated | ^0.5.0  | ^1.1.0  |    |
  | @commitlint/types                                                                                    | devDependency | updated | ^20.5.0 | ^21.0.1 |    |
  | @savvy-web/rslib-builder                                                                             | devDependency | updated | ^0.20.7 | ^0.20.8 |    |

### `savvy-commit init`: hygiene hooks in `post-checkout` and `post-merge`

`savvy-commit init` now writes a `savvy-hooks` section into
`.husky/post-checkout` and `.husky/post-merge`. This section ensures
tracked `.sh` files stay executable across platforms:

```sh
git config core.fileMode false
git ls-files -z '*.sh' | xargs -0 chmod +x 2>/dev/null || true
```

The write is self-guarded and idempotent — running `init` twice or
alongside another package that writes the same section produces no diff.

The `--force` flag now only resets `.husky/commit-msg` and the config
file; the hygiene hooks are never force-reset.

### `savvy-commit check`: per-section validation

`savvy-commit check` now validates the `savvy-base`, `savvy-commit`, and
`savvy-hooks` sections (in both hygiene hooks) independently, reporting
per-section health for each. The final "configured correctly" verdict
now factors in section staleness in addition to file existence.

## 0.9.1

### Dependencies

* | [`a05cf1f`](https://github.com/savvy-web/commitlint/commit/a05cf1f77063b60dcc2901a5e299ee04055718f3) | Dependency    | Type    | Action                | From                  | To |
  | :--------------------------------------------------------------------------------------------------- | :------------ | :------ | :-------------------- | :-------------------- | -- |
  | @savvy-web/silk-effects                                                                              | dependency    | updated | ^0.3.0                | ^0.4.1                |    |
  | @typescript/native-preview                                                                           | devDependency | updated | ^7.0.0-dev.20260519.1 | ^7.0.0-dev.20260523.1 |    |
  | @savvy-web/rslib-builder                                                                             | devDependency | updated | ^0.20.4               | ^0.20.6               |    |

## 0.9.0

### Features

* [`b8f448a`](https://github.com/savvy-web/commitlint/commit/b8f448a3b874364e8e99f8a8b9a8a1662712932d) ### New `commit-create` skill

The plugin now ships a `commitlint:commit-create` skill at `plugin/skills/commit-create/SKILL.md` containing the complete commit-message contract: the type enum, `tdd(<goalId>:<state>)` scope grammar, subject and body rules, DCO signoff format, `Closes` trailer pattern, signing posture, three good examples, three annotated bad examples, and a pre-commit checklist. Agents load the skill on demand when composing a commit instead of receiving the full charter inline at session start.

### Bug Fixes

* [`b8f448a`](https://github.com/savvy-web/commitlint/commit/b8f448a3b874364e8e99f8a8b9a8a1662712932d) **Hot-path bypass for compound commands** — `match-safe-bash.sh` now hard-excludes any command that contains `git commit` or `gh pr create|edit` anywhere, including buried inside `&&`, `;`, `|`, `&`, newline-separated, or `env`-prefixed compound scripts. Previously, the allow-list matched on the first statement and silently approved compound commands whose later statements bypassed commit validation.
* **Tighter `git push` exclusions** — `--delete`, `-d`, `--tags`, and `--mirror` variants are no longer auto-allowed by the safe-bash list. These could silently delete remote branches/tags or publish all local tags including force-tag overrides.
* **`session-start` stdin handling** — the bash shim now drains stdin before the `ERR` trap is registered, preventing a producer pipe from blocking when a later guard short-circuits.
* **`mktemp` instead of `$$`** — `match-safe-bash.sh` uses `mktemp -t` for its pattern scratch file. The previous `/tmp/savvy-bash-patterns.$$` could collide between concurrent sourced invocations.
* **MCP matcher regex** — `hooks.json` matcher updated from `mcp__github(-[^_]+)?__.*` to `mcp__github(-[^_].*)?__.*` so scope names containing underscores (e.g. `mcp__github-my_org__list_issues`) route correctly to the MCP allow-list handler.

### Documentation

* [`b8f448a`](https://github.com/savvy-web/commitlint/commit/b8f448a3b874364e8e99f8a8b9a8a1662712932d) `CLAUDE.md` plugin-layout and testing sections rewritten for the new structure.
* `.claude/design/commitlint/overview.md` directory tree, hook-subcommand table, hook-registration table, and per-event prose updated to the new paths. New "Skill-Based Charter" subsection added explaining the rationale for moving the conventions out of `SessionStart` and into the skill.

### Refactoring

* [`b8f448a`](https://github.com/savvy-web/commitlint/commit/b8f448a3b874364e8e99f8a8b9a8a1662712932d) ### Plugin layout: subdirectory-per-event

The plugin's `hooks/` tree migrated from flat `pre-tool-use-bash.sh` / `session-start.sh` naming to the canonical subdirectory-per-event layout:

```text
hooks/
  session-start/main.sh
  pre-tool-use/{bash,mcp,fs}.sh
  post-tool-use/bash.sh
  user-prompt-submit/main.sh
  lib/...
  fixtures/
  __test__/<event>/...
```

`hooks.json` paths updated and now quote `"${CLAUDE_PLUGIN_ROOT}/..."` consistently. All hook scripts had their executable bit removed (they are invoked as `bash <script>` per project convention).

### Tests

* [`b8f448a`](https://github.com/savvy-web/commitlint/commit/b8f448a3b874364e8e99f8a8b9a8a1662712932d) 26 new BATS specs covering the compound-bypass guards, restricted `git push` variants, scope-with-underscore MCP routing, session-start stdin draining and `jq`-missing fail-open behavior, post-tool-use silent paths, user-prompt-submit trigger paths, and pre-tool-use truncation/empty-envelope edge cases.
* Test suite total: 290 vitest + 87 bats + 76 smoketest cases — all green.

### Realigned SessionStart context

The `SessionStart` hook no longer injects the full commit charter (≈38 lines) at session start. It now emits a TIER-1 imperative directive (≈9 lines) pointing to the `commitlint:commit-create` skill, followed by the unchanged branch and signing diagnostic blocks. Charter content is loaded progressively at the moment of need rather than competing for early-session context budget.

### Realigned UserPromptSubmit reminder

When the user mentions commit-adjacent verbs, the `UserPromptSubmit` hook now emits a five-line redirect to the `commitlint:commit-create` skill instead of an inline eight-bullet reminder. The trigger regex is unchanged.

### Shared lib helpers

Added `plugin/hooks/lib/hook-output.sh` (`emit_noop` / `emit_allow` / `emit_deny` / `emit_context`) and `plugin/hooks/lib/hook-debug.sh` (`hook_error` / `hook_debug` with configurable log paths). Every hook script now uses these helpers instead of constructing JSON envelopes inline and writing raw `echo ... >&2` for errors. CLI invocation errors are captured to per-run `mktemp` files and routed through `hook_error` for diagnosability.

### Hook script hardening

* `command -v jq` guard at the top of every hook script — hooks fail open with a structured log entry instead of crashing when `jq` is unavailable.
* `run-cli.sh` falls back to `git rev-parse --show-toplevel` before `pwd` when `CLAUDE_PROJECT_DIR` is unset.
* `pre-tool-use/fs.sh` defers `tool_name` extraction into the branch that uses it.
* `user-prompt-submit/main.sh` drops a redundant `/finalize\b` alternative from its trigger regex (already covered by `\bfinalize\b`).

## 0.8.0

### Features

* [`ef119f4`](https://github.com/savvy-web/commitlint/commit/ef119f4d501ec08f3ff7dc6c721c8cd397ef7c42) ### `tdd` commit type

Adds a `tdd` conventional commit type for TDD agent commits. The scope is required and must follow `{goalId}:{state}`, where `goalId` is a numeric identifier and `state` is one of `spike`, `red`, `green`, or `refactor`.

```text
tdd(7:spike): explore parser approach
tdd(7:red): failing test for empty-input edge case
tdd(7:green): implement sum() to pass tests
tdd(7:refactor): extract validation into separate module
```

Scope format is always enforced on `tdd` commits. When no project scopes are configured, `silk/tdd-scope` handles it directly. When project scopes are configured, the factory merges tdd validation into `silk/scope-enum` so both rules stay active. Two new public constants are exported: `TDD_SCOPE_PATTERN` (`/^\d+:(spike|red|green|refactor)$/`) and `TDD_STATES`.

### Bug Fixes

* [`ef119f4`](https://github.com/savvy-web/commitlint/commit/ef119f4d501ec08f3ff7dc6c721c8cd397ef7c42) Fixes a silent rule-loss bug in the config factory when both a custom plugin and a scope-enum override were registered as separate inline plugin objects. `@commitlint/load` uses `plugins.local = plugin`, meaning the second object clobbered the first. The factory now merges all rules into a single plugin object, ensuring `silk/body-no-markdown`, `silk/signed-off-by`, and the other Silk rules are never silently dropped when project scopes are configured.

### Dependencies

* | [`051693a`](https://github.com/savvy-web/commitlint/commit/051693a6dd146533906a5a9d02186cf3d62a693d) | Dependency     | Type    | Action  | From    | To |
  | :--------------------------------------------------------------------------------------------------- | :------------- | :------ | :------ | :------ | -- |
  | zod                                                                                                  | dependency     | updated | ^4.3.6  | ^4.4.3  |    |
  | @commitlint/cli                                                                                      | peerDependency | updated | ^20.5.0 | ^20.5.3 |    |
  | @commitlint/config-conventional                                                                      | peerDependency | updated | ^20.5.0 | ^20.5.3 |    |
  | @commitlint/cli                                                                                      | devDependency  | updated | ^20.5.2 | ^20.5.3 |    |
  | @commitlint/config-conventional                                                                      | devDependency  | updated | ^20.5.0 | ^20.5.3 |    |
  | @commitlint/lint                                                                                     | devDependency  | updated | ^20.5.0 | ^20.5.3 |    |

## 0.7.1

### Bug Fixes

* [`92559d0`](https://github.com/savvy-web/commitlint/commit/92559d0f66f39ce0febe6f491f87435566269d7e) Fixed `post-commit-verify` hook failing on non-pnpm projects by detecting the consumer's package manager from `package.json#packageManager` and lockfile presence, then building the correct invocation (`pnpm exec`, `yarn exec`, `bunx`, or `npx --no --`).
* Fixed `post-commit-verify` hook ignoring custom commitlint config paths by reading the `--config` argument from the managed section of `.husky/commit-msg` (the source of truth written by `savvy-commit init`). Falls back to cosmiconfig auto-discovery when `.husky/commit-msg` is absent.

## 0.7.0

### Features

* [`4d34b08`](https://github.com/savvy-web/commitlint/commit/4d34b0834edbefb8ac66fe285702dd681ac453d8) ### Commit message quality hooks

- New `PreToolUse(Bash)` hook auto-allows curated safe commands and routes commit-related Bash invocations through `savvy commit hook pre-commit-message`. Six rules deny markdown headers and code fences, deny commitlint failures, deny `--no-gpg-sign` when `commit.gpgsign=true`, and advise on plan-file references, soft-wraps inside bullets, body verbosity, and missing `Closes #N` trailers when the branch encodes a ticket.
- New `PreToolUse` matchers auto-allow curated GitHub MCP and GitKraken MCP operations and Read/Write/Edit calls scoped to the project's `.claude/cache/` directory.
- New `PostToolUse(Bash)` hook replays `commitlint --last`, verifies the new HEAD's signature against `commit.gpgsign`, and advises when a branch-implied ticket is missing from the commit body.
- New `UserPromptSubmit` hook injects a compact commit-quality reminder when the prompt mentions commit-related verbs.

### Bug Fixes

* [`4d34b08`](https://github.com/savvy-web/commitlint/commit/4d34b0834edbefb8ac66fe285702dd681ac453d8) `savvy-commit init` now generates a husky `commit-msg` hook that runs commitlint via `pnpm exec` instead of `pnpm dlx`. The dlx form runs commitlint in an isolated package cache that cannot resolve workspace-local imports in `commitlint.config.ts` (e.g., `import { CommitlintConfig } from "@savvy-web/commitlint"`), causing every commit to fail with `Cannot find module '@savvy-web/commitlint'`. `pnpm exec` runs the locally installed binary so workspace package resolution works as expected. Other package managers (yarn, bun, npm) are unchanged.

### Richer SessionStart context

* SessionStart now ships the existing commit conventions plus a quality charter (forbidden body content, soft-wrap rule, dependency-update guidance), a branch context block (current branch, inferred ticket id, open-issue list), and a GPG / SSH signing diagnostic with key resolution and agent responsiveness checks.

### `savvy commit hook` CLI subcommand tree

* New internal subcommand tree (`session-start`, `pre-commit-message`, `post-commit-verify`, `user-prompt-submit`) consumed by the companion plugin's bash hooks. Not stable for third-party consumption; surface and JSON shape may change between minor versions until 1.0.

## 0.6.0

### Other

* [`2c59c0e`](https://github.com/savvy-web/commitlint/commit/2c59c0eee022f674a5499c89038e2aface964b7c) Support TypeScript v6

## 0.5.2

### Bug Fixes

* [`4390e3d`](https://github.com/savvy-web/commitlint/commit/4390e3ddb6f7d80d1b131130d1ff0308cf59c825) Fix session-start hook JSON output validation by adding missing hookEventName field, converting markdown to XML tags in additionalContext, and consuming stdin to prevent broken pipe errors

## 0.5.1

### Bug Fixes

* [`180878a`](https://github.com/savvy-web/commitlint/commit/180878a97c26d556515ea85c6d99ff98ad0f8ae9) Convert plugin SessionStart hook from plain text stdout to structured JSON hookSpecificOutput.additionalContext response

## 0.5.0

### Features

* [`4fbd4cd`](https://github.com/savvy-web/commitlint/commit/4fbd4cd0a7bb7a642a572d840ce29007e3cb1442) ### Claude Code Plugin

Add Claude Code sidecar plugin that registers a SessionStart hook to inform AI agents about Silk commit conventions, allowed types, and available CLI tools. Install with:

```bash
# Add the Savvy Web plugin marketplace (one-time setup)
/plugin marketplace add savvy-web/systems

# Install the commitlint plugin for this project
/plugin install commitlint@savvy-web-systems --scope project
```

## 0.4.5

### Refactoring

* [`184c43b`](https://github.com/savvy-web/commitlint/commit/184c43bd1f4d70e0fa8e2d026460de4761067992) Replaced `workspace-tools` with `@savvy-web/silk-effects` and `workspaces-effect` across the CLI command layer. The public API (`CommitlintConfig.silk()`) is unchanged.
* `init` command now uses the `ManagedSection` service for hook marker management instead of direct string manipulation.
* `check` command now delegates to `VersioningStrategy`, `WorkspaceDiscovery`, and `ManagedSection` services from `workspaces-effect`.
* `scopes` detection is now effectful, returning an `Effect` rather than a synchronous array.
* CLI layer composition wires all `silk-effects` and `workspaces-effect` layers at the entry point.
* Deleted `src/detection/versioning.ts` (superseded by `VersioningStrategy` service) and `src/detection/utils.ts` (`findProjectRoot` inlined into `dco.ts`).

### Dependencies

* | [`7ce01c0`](https://github.com/savvy-web/commitlint/commit/7ce01c0e57121a76a6ab39dfd6608686531e3aae) | Dependency    | Type    | Action | From   | To |
  | :--------------------------------------------------------------------------------------------------- | :------------ | :------ | :----- | :----- | -- |
  | @savvy-web/vitest                                                                                    | devDependency | updated | ^1.0.1 | ^1.1.0 |    |

- | [`184c43b`](https://github.com/savvy-web/commitlint/commit/184c43bd1f4d70e0fa8e2d026460de4761067992) | Dependency | Type  | Action | From   | To |
  | :--------------------------------------------------------------------------------------------------- | :--------- | :---- | :----- | :----- | -- |
  | `@savvy-web/silk-effects`                                                                            | dependency | added | —      | ^0.1.0 |    |
  | `workspaces-effect`                                                                                  | dependency | added | —      | ^0.1.0 |    |

* | [`8abc683`](https://github.com/savvy-web/commitlint/commit/8abc6831466b0da1491caf43fe284f4b5afca314) | Dependency    | Type    | Action | From   | To |
  | :--------------------------------------------------------------------------------------------------- | :------------ | :------ | :----- | :----- | -- |
  | @savvy-web/lint-staged                                                                               | devDependency | updated | ^0.6.5 | ^0.6.6 |    |

## 0.4.4

### Bug Fixes

* [`92f5d91`](https://github.com/savvy-web/commitlint/commit/92f5d9144c6da5de42cd29e94fcecc9b301d8ab6) Pins workspace-tools to 0.41.0 due to breaking change introduced upstream.

### Dependencies

* | [`eca1694`](https://github.com/savvy-web/commitlint/commit/eca16942ed33da3b6bfe14922b0362096e5441dc) | Dependency     | Type    | Action  | From    | To |
  | :--------------------------------------------------------------------------------------------------- | :------------- | :------ | :------ | :------ | -- |
  | @commitlint/cli                                                                                      | devDependency  | updated | ^20.4.3 | ^20.5.0 |    |
  | @commitlint/config-conventional                                                                      | devDependency  | updated | ^20.4.3 | ^20.5.0 |    |
  | @savvy-web/changesets                                                                                | devDependency  | updated | ^0.5.3  | ^0.7.0  |    |
  | @savvy-web/lint-staged                                                                               | devDependency  | updated | ^0.6.2  | ^0.6.4  |    |
  | @savvy-web/vitest                                                                                    | devDependency  | updated | ^0.3.0  | ^1.0.1  |    |
  | @commitlint/cli                                                                                      | peerDependency | updated | ^20.4.3 | ^20.5.0 |    |
  | @commitlint/config-conventional                                                                      | peerDependency | updated | ^20.4.3 | ^20.5.0 |    |

## 0.4.3

### Dependencies

* | [`be5e7e6`](https://github.com/savvy-web/commitlint/commit/be5e7e6989eec7bb81a9a7bc851df15e4a552fff) | Dependency | Type    | Action  | From    | To |
  | :--------------------------------------------------------------------------------------------------- | :--------- | :------ | :------ | :------ | -- |
  | @savvy-web/changesets                                                                                | dependency | updated | ^0.5.1  | ^0.5.3  |    |
  | @savvy-web/lint-staged                                                                               | dependency | updated | ^0.6.0  | ^0.6.2  |    |
  | @savvy-web/rslib-builder                                                                             | dependency | updated | ^0.18.2 | ^0.19.0 |    |
  | @savvy-web/vitest                                                                                    | dependency | updated | ^0.2.1  | ^0.3.0  |    |

## 0.4.2

### Bug Fixes

* [`f1ee488`](https://github.com/savvy-web/commitlint/commit/f1ee4884d94e1f8be5a478cb896527e37e490c73) Migrate Effect dependencies to `catalog:silk` for centralized version management via `@savvy-web/pnpm-plugin-silk`. Adds required transitive peer dependencies (`@effect/cluster`, `@effect/printer`, `@effect/printer-ansi`, `@effect/rpc`, `@effect/sql`). Closes #66.

### Dependencies

* | [`bccdea2`](https://github.com/savvy-web/commitlint/commit/bccdea243ce388fcf4eac041a4850efac31b0d4d) | Dependency | Type    | Action  | From    | To |
  | :--------------------------------------------------------------------------------------------------- | :--------- | :------ | :------ | :------ | -- |
  | @savvy-web/changesets                                                                                | dependency | updated | ^0.4.1  | ^0.5.1  |    |
  | @savvy-web/lint-staged                                                                               | dependency | updated | ^0.5.0  | ^0.6.0  |    |
  | @savvy-web/rslib-builder                                                                             | dependency | updated | ^0.16.0 | ^0.18.2 |    |
  | @savvy-web/vitest                                                                                    | dependency | updated | ^0.2.0  | ^0.2.1  |    |

## 0.4.1

### Bug Fixes

* [`6dde84a`](https://github.com/savvy-web/commitlint/commit/6dde84a24fd3ab5c54d7377206987b039234e90b) Remove injected postinstall script from published package.json. Fixes #62.

### Dependencies

* [`0d6fe25`](https://github.com/savvy-web/commitlint/commit/0d6fe259b813d831ab556fbd218911690f13bd1a) @savvy-web/lint-staged: ^0.4.6 → ^0.5.0
* @savvy-web/rslib-builder: ^0.15.0 → ^0.16.0
* @savvy-web/vitest: ^0.1.0 → ^0.2.0

## 0.4.0

### Features

* [`a8cc358`](https://github.com/savvy-web/commitlint/commit/a8cc358330a804b1d7fecee093e96666da6fc39c) Reverts control of peerDependencies to package

## 0.3.4

### Dependencies

* [`14f936e`](https://github.com/savvy-web/commitlint/commit/14f936e05d71da4019ff389ac0ca918421f543e7) @savvy-web/lint-staged: ^0.4.0 → ^0.4.2
* @savvy-web/rslib-builder: ^0.14.1 → ^0.14.2

## 0.3.3

### Patch Changes

* e4524ff: ## Features
  * Support for @savvy-web/changesets
* 00dffc2: ## Dependencies
  * @savvy-web/rslib-builder: ^0.12.1 → ^0.12.2
* 5a32404: ## Dependencies
  * @savvy-web/rslib-builder: ^0.12.2 → ^0.14.1

## 0.3.2

### Patch Changes

* 71ddb1a: Update dependencies:

  **Dependencies:**

  * @savvy-web/lint-staged: ^0.3.1 → ^0.4.0
  * @savvy-web/rslib-builder: ^0.12.0 → ^0.12.1

## 0.3.1

### Patch Changes

* d106029: Update dependencies:

  **Dependencies:**

  * @savvy-web/lint-staged: ^0.2.2 → ^0.3.1

## 0.3.0

### Minor Changes

* fd8af78: Add managed section pattern to init command hook generation

  The `savvy-commit init` command now uses BEGIN/END markers in the `.husky/commit-msg` hook, allowing users to add custom code above or below the managed block. Re-running `init` updates only the managed section, preserving user customizations. The CI environment check now wraps the managed block in an `if` guard instead of `exit 0`, so user-defined hooks outside the markers still execute in CI. The `check` command now reports managed section status (up-to-date, outdated, or not found).

  Remove auto-detected scope restriction from silk preset

  The silk preset no longer auto-detects workspace package names and enforces them as the only allowed commit scopes. Previously, scopes like `ci`, `deps`, or `docs` would be rejected unless explicitly added via `additionalScopes`. Scopes are now unrestricted by default; users can still provide explicit `scopes` or `additionalScopes` to enforce an allowlist.

## 0.2.1

### Patch Changes

* e00fd8f: Switches to managed dependecies with @savvy-web/pnpm-plugin-silk

## 0.2.0

### Minor Changes

* 92cd2f7: Add interactive commit prompt with commitizen adapter
  * Add built-in commitizen adapter at `@savvy-web/commitlint/prompt` with `prompter` function
  * Use Unicode emojis for terminal display (🤖, ✨, 🐛, etc.)
  * Allow simple unordered lists (`-` and `*`) in commit bodies while still rejecting other markdown
  * Include full prompt configuration in `CommitlintConfig.silk()` output
  * Remove `@commitlint/cz-commitlint` dependency (users can install separately if preferred)

## 0.1.2

### Patch Changes

* 6d18e93: Update husky commit-msg hook template for modern Husky compatibility
  * Remove deprecated `dirname` sourcing (no longer needed in Husky v9+)
  * Add CI environment skip for GitHub Actions
  * Use `git rev-parse --show-toplevel` for reliable repo root detection
  * Update all file path checks to use absolute paths from repo root
  * Fix bun lockfile detection (`bun.lock` instead of `bun.lockb`)
  * Add explicit config path to commitlint command

## 0.1.1

### Patch Changes

* 66f5591: Fix missing type exports and hoist markdownlint-cli2 peer dependencies for CI compatibility

## 0.1.0

### Minor Changes

* 907c2bc: Initial implementation of dynamic commitlint configuration with auto-detection of DCO requirements, workspace scopes, and versioning strategies.
