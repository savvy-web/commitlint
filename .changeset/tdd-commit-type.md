---
"@savvy-web/commitlint": minor
---

## Features

### `tdd` commit type

Adds a `tdd` conventional commit type for TDD agent commits. The scope is required and must follow `{goalId}:{state}`, where `goalId` is a numeric identifier and `state` is one of `spike`, `red`, `green`, or `refactor`.

```text
tdd(7:spike): explore parser approach
tdd(7:red): failing test for empty-input edge case
tdd(7:green): implement sum() to pass tests
tdd(7:refactor): extract validation into separate module
```

Scope format is always enforced on `tdd` commits. When no project scopes are configured, `silk/tdd-scope` handles it directly. When project scopes are configured, the factory merges tdd validation into `silk/scope-enum` so both rules stay active. Two new public constants are exported: `TDD_SCOPE_PATTERN` (`/^\d+:(spike|red|green|refactor)$/`) and `TDD_STATES`.

## Bug Fixes

Fixes a silent rule-loss bug in the config factory when both a custom plugin and a scope-enum override were registered as separate inline plugin objects. `@commitlint/load` uses `plugins.local = plugin`, meaning the second object clobbered the first. The factory now merges all rules into a single plugin object, ensuring `silk/body-no-markdown`, `silk/signed-off-by`, and the other Silk rules are never silently dropped when project scopes are configured.
