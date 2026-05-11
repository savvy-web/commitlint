---
"@savvy-web/commitlint": minor
---

## Features

### New `commit-create` skill

The plugin now ships a `commitlint:commit-create` skill at `plugin/skills/commit-create/SKILL.md` containing the complete commit-message contract: the type enum, `tdd(<goalId>:<state>)` scope grammar, subject and body rules, DCO signoff format, `Closes` trailer pattern, signing posture, three good examples, three annotated bad examples, and a pre-commit checklist. Agents load the skill on demand when composing a commit instead of receiving the full charter inline at session start.

### Realigned SessionStart context

The `SessionStart` hook no longer injects the full commit charter (≈38 lines) at session start. It now emits a TIER-1 imperative directive (≈9 lines) pointing to the `commitlint:commit-create` skill, followed by the unchanged branch and signing diagnostic blocks. Charter content is loaded progressively at the moment of need rather than competing for early-session context budget.

### Realigned UserPromptSubmit reminder

When the user mentions commit-adjacent verbs, the `UserPromptSubmit` hook now emits a five-line redirect to the `commitlint:commit-create` skill instead of an inline eight-bullet reminder. The trigger regex is unchanged.

## Bug Fixes

* **Hot-path bypass for compound commands** — `match-safe-bash.sh` now hard-excludes any command that contains `git commit` or `gh pr create|edit` anywhere, including buried inside `&&`, `;`, `|`, `&`, newline-separated, or `env`-prefixed compound scripts. Previously, the allow-list matched on the first statement and silently approved compound commands whose later statements bypassed commit validation.
* **Tighter `git push` exclusions** — `--delete`, `-d`, `--tags`, and `--mirror` variants are no longer auto-allowed by the safe-bash list. These could silently delete remote branches/tags or publish all local tags including force-tag overrides.
* **`session-start` stdin handling** — the bash shim now drains stdin before the `ERR` trap is registered, preventing a producer pipe from blocking when a later guard short-circuits.
* **`mktemp` instead of `$$`** — `match-safe-bash.sh` uses `mktemp -t` for its pattern scratch file. The previous `/tmp/savvy-bash-patterns.$$` could collide between concurrent sourced invocations.
* **MCP matcher regex** — `hooks.json` matcher updated from `mcp__github(-[^_]+)?__.*` to `mcp__github(-[^_].*)?__.*` so scope names containing underscores (e.g. `mcp__github-my_org__list_issues`) route correctly to the MCP allow-list handler.

## Refactoring

### Plugin layout: subdirectory-per-event

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

### Shared lib helpers

Added `plugin/hooks/lib/hook-output.sh` (`emit_noop` / `emit_allow` / `emit_deny` / `emit_context`) and `plugin/hooks/lib/hook-debug.sh` (`hook_error` / `hook_debug` with configurable log paths). Every hook script now uses these helpers instead of constructing JSON envelopes inline and writing raw `echo ... >&2` for errors. CLI invocation errors are captured to per-run `mktemp` files and routed through `hook_error` for diagnosability.

### Hook script hardening

* `command -v jq` guard at the top of every hook script — hooks fail open with a structured log entry instead of crashing when `jq` is unavailable.
* `run-cli.sh` falls back to `git rev-parse --show-toplevel` before `pwd` when `CLAUDE_PROJECT_DIR` is unset.
* `pre-tool-use/fs.sh` defers `tool_name` extraction into the branch that uses it.
* `user-prompt-submit/main.sh` drops a redundant `/finalize\b` alternative from its trigger regex (already covered by `\bfinalize\b`).

## Tests

* 26 new BATS specs covering the compound-bypass guards, restricted `git push` variants, scope-with-underscore MCP routing, session-start stdin draining and `jq`-missing fail-open behavior, post-tool-use silent paths, user-prompt-submit trigger paths, and pre-tool-use truncation/empty-envelope edge cases.
* Test suite total: 290 vitest + 87 bats + 76 smoketest cases — all green.

## Documentation

* `CLAUDE.md` plugin-layout and testing sections rewritten for the new structure.
* `.claude/design/commitlint/overview.md` directory tree, hook-subcommand table, hook-registration table, and per-event prose updated to the new paths. New "Skill-Based Charter" subsection added explaining the rationale for moving the conventions out of `SessionStart` and into the skill.
