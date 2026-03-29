---
"@savvy-web/commitlint": patch
---

## Refactoring

- Replaced `workspace-tools` with `@savvy-web/silk-effects` and `workspaces-effect` across the CLI command layer. The public API (`CommitlintConfig.silk()`) is unchanged.
- `init` command now uses the `ManagedSection` service for hook marker management instead of direct string manipulation.
- `check` command now delegates to `VersioningStrategy`, `WorkspaceDiscovery`, and `ManagedSection` services from `workspaces-effect`.
- `scopes` detection is now effectful, returning an `Effect` rather than a synchronous array.
- CLI layer composition wires all `silk-effects` and `workspaces-effect` layers at the entry point.
- Deleted `src/detection/versioning.ts` (superseded by `VersioningStrategy` service) and `src/detection/utils.ts` (`findProjectRoot` inlined into `dco.ts`).

## Dependencies

| Dependency | Type | Action | From | To |
| :--- | :--- | :--- | :--- | :--- |
| `@savvy-web/silk-effects` | dependency | added | — | ^0.1.0 |
| `workspaces-effect` | dependency | added | — | ^0.1.0 |
