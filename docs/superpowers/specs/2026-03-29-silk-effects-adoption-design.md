# Adopt silk-effects: Replace Versioning Detection and Managed Section Logic

**Date:** 2026-03-29
**Ticket:** #85
**Branch:** feat/silk-effects

## Summary

Replace all internal `workspace-tools` usage with `@savvy-web/silk-effects` and
`workspaces-effect`, fully removing the `workspace-tools` dependency. This
migrates versioning detection, managed section handling, project root discovery,
and workspace package enumeration to Effect-native services.

## Decision: Breaking Change for Managed Section Markers

Pre-1.0, so no backwards compatibility for marker format. Users re-run
`savvy-commit init` to get new hooks. No migration path for old markers.

## Decision: Full Effect-ification

All detection functions become effectful rather than wrapping Effect services in
synchronous adapters. Callers (`check.ts`, `factory.ts`) already run in Effect
contexts, making this natural.

## Dependencies

### Add

- `@savvy-web/silk-effects` — shared Silk Suite business logic (versioning,
  tags, managed sections)
- `workspaces-effect` — Effect-native workspace discovery (replaces
  workspace-tools)

### Remove

- `workspace-tools` — fully replaced by the above

## Files Deleted

| File | Reason |
| ---- | ------ |
| `src/detection/versioning.ts` | Replaced by silk-effects `VersioningStrategy` + `TagStrategy` |
| `src/detection/versioning.test.ts` | Tests for deleted module |
| `src/detection/utils.ts` | `safelyFindProjectRoot()` inlined into `dco.ts` without workspace-tools; no other consumers remain |

## Files Modified

### `src/cli/commands/init.ts`

**Current:** Exports `BEGIN_MARKER`, `END_MARKER`, `extractManagedSection()`,
`generateManagedContent()`. Manually assembles marker strings and parses hook
files.

**After:** Use silk-effects `ManagedSection` service for section read/write.
`generateManagedContent(configPath)` stays local — silk-effects does not
generate hook shell scripts, only manages the marker mechanics.

- `extractManagedSection(content)` replaced by `ManagedSection.read(path, "savvy-commit")`
- Manual marker assembly replaced by `ManagedSection.write(path, "savvy-commit", content)`
- `BEGIN_MARKER` / `END_MARKER` exports removed (no longer needed by consumers)
- Init command provides `ManagedSectionLive` layer

### `src/cli/commands/init.test.ts`

Update tests to work with `ManagedSection` service. Tests for
`extractManagedSection` and marker constants replaced with tests against
`ManagedSection.read()` / `ManagedSection.write()`. Tests for
`generateManagedContent` remain (local function unchanged).

### `src/cli/commands/check.ts`

**Current:** Imports `detectReleaseFormat` from versioning, imports
`BEGIN_MARKER`, `END_MARKER`, `extractManagedSection`, `generateManagedContent`
from init.

**After:**

- Use `VersioningStrategy.detect()` + local `STRATEGY_TO_FORMAT` map to get
  release format
- Use `WorkspaceDiscovery.listPackages()` to determine publishable packages
- Use `SilkPublishabilityPlugin.detect()` to filter publishable packages
- Use `ManagedSection.read()` / `ManagedSection.isManaged()` for hook
  validation
- Provide layers: `VersioningStrategyLive`, `ChangesetConfigReaderLive`,
  `WorkspacesLive`, `ManagedSectionLive`, `SilkPublishabilityPluginLive`

### `src/cli/commands/check.test.ts`

Update tests for the effectful check command. Mock or provide test layers for
silk-effects and workspaces-effect services.

### `src/detection/scopes.ts`

**Current:** Synchronous `detectScopes(cwd)` using `getWorkspaceInfos()` from
workspace-tools and `safelyFindProjectRoot()` from utils.

**After:** Effectful `detectScopes` using `WorkspaceDiscovery.listPackages()`
and `WorkspaceRoot.find()` from workspaces-effect. Returns
`Effect<string[], WorkspaceRootNotFoundError | WorkspaceDiscoveryError>`.

### `src/detection/dco.ts`

**Current:** Synchronous `detectDCO(cwd)` using `safelyFindProjectRoot()` from
utils and `existsSync`.

**After:** Remains synchronous. Replace `safelyFindProjectRoot()` with a local
inline directory traversal (walk up looking for `pnpm-workspace.yaml` or `.git`)
using `existsSync`. This is a 5-line function that doesn't warrant pulling in
an Effect service. `detectDCO` stays synchronous so that `createConfig()` and
`CommitlintConfig.silk()` (the public API) remain synchronous.

### `src/config/factory.ts`

**No changes.** `createConfig()` stays synchronous because `detectDCO()` stays
synchronous. The public API (`CommitlintConfig.silk()`) is unaffected.

### `package.json`

- Add `@savvy-web/silk-effects` and `workspaces-effect` to dependencies
- Remove `workspace-tools` from dependencies

## Architecture: Layer Composition

The CLI commands (`init`, `check`) are the top-level Effect programs that
provide all required layers. `scopes.ts` becomes effectful and declares service
requirements via Effect's type system. `dco.ts` stays synchronous with an
inlined project root traversal — no Effect services needed.

```text
CLI Command (init/check)
  -> provides NodeContext.layer
  -> provides WorkspacesLive (from workspaces-effect)
  -> provides VersioningStrategyLive, ChangesetConfigReaderLive (from silk-effects)
  -> provides TagStrategyLive (from silk-effects)
  -> provides ManagedSectionLive (from silk-effects)
  -> provides SilkPublishabilityPluginLive, TargetResolverLive (from silk-effects)
  -> calls detectScopes() which requires WorkspaceRoot + WorkspaceDiscovery
  -> calls detectDCO() synchronously (no Effect services needed)
```

## Testing Strategy

- Existing test assertions for behavior (tag formatting, release format
  detection, managed section parsing) are preserved — only the implementation
  changes
- Tests that directly test deleted functions (`getPackageTag`,
  `isPackagePublishable`, `detectVersioningStrategy`) are removed
- Tests for `generateManagedContent` remain unchanged (local function)
- Integration tests that call `detectReleaseFormat` on the real repo adapt to
  the effectful API
- Mock layers or test layers provided where needed for isolation

## Out of Scope

- No changes to `src/config/factory.ts` or `CommitlintConfig.silk()` public API
- No changes to the public API exports from `src/index.ts` beyond removing
  re-exports of deleted types
- No changes to the prompt, formatter, or static config modules
- No changes to the build pipeline or CI configuration
