# Auto-Detection

`@savvy-web/commitlint` automatically detects repository characteristics to
generate appropriate commit rules. This document explains what gets detected
and how.

## Detection Overview

When you call `CommitlintConfig.silk()` without options, the package detects:

1. **DCO Requirement** - Whether commits need `Signed-off-by:` trailers
2. **Scopes** - Valid commit scopes from workspace packages
3. **Release Format** - How release commits should be formatted

## DCO Detection

Checks for the presence of a `DCO` file at the repository root.

**Detection Logic:**

```text
If file exists: /path/to/repo/DCO
Then: Require Signed-off-by trailer
Else: No signoff requirement
```

**Override:**

```typescript
// Force DCO requirement
CommitlintConfig.silk({ dco: true });

// Disable DCO
CommitlintConfig.silk({ dco: false });
```

## Scope Detection

Uses `workspace-tools` to find all packages in a monorepo and extracts their
names as valid commit scopes.

**Detection Logic:**

1. Find the monorepo root using `findProjectRoot()`
2. Get all workspaces using `getWorkspaces()`
3. Extract package names, removing scope prefixes

**Examples:**

| Package Name | Detected Scope |
| ------------ | -------------- |
| `@scope/api-client` | `api-client` |
| `@scope/cli-tools` | `cli-tools` |
| `utils` | `utils` |

**Override:**

```typescript
// Replace auto-detected scopes
CommitlintConfig.silk({ scopes: ["core", "api", "cli"] });

// Add to auto-detected scopes
CommitlintConfig.silk({ additionalScopes: ["deps", "config"] });
```

## Versioning Strategy Detection

Analyzes the repository's versioning approach to determine the appropriate
release commit format.

**Detection Factors:**

1. Presence of changesets (`.changeset/` directory)
2. Changeset configuration (`fixed` groups, `linked` packages)
3. Number of publishable packages

**Strategy Types:**

| Strategy | Description | Release Format |
| -------- | ----------- | -------------- |
| `single` | Single package, no changesets | `semver` |
| `fixed-group` | Multiple packages with fixed versions | `semver` |
| `independent` | Independent versioning per package | `packages` |

**Override:**

```typescript
CommitlintConfig.silk({ releaseFormat: "semver" });
CommitlintConfig.silk({ releaseFormat: "packages" });
CommitlintConfig.silk({ releaseFormat: "scoped" });
```

## Using Detection Utilities Directly

The detection functions are exported for direct use:

```typescript
import {
  detectDCO,
  detectScopes,
  detectReleaseFormat,
  detectVersioningStrategy,
} from "@savvy-web/commitlint";

// Check if DCO is required
const needsDCO = detectDCO("/path/to/repo");

// Get available scopes
const scopes = detectScopes("/path/to/repo");

// Get release format
const format = detectReleaseFormat("/path/to/repo");

// Get full versioning strategy info
const strategy = detectVersioningStrategy("/path/to/repo");
console.log(strategy.type); // "single" | "fixed-group" | "independent"
console.log(strategy.packages); // Array of workspace package info
```

## Detection Performance

Detection runs once when the configuration is loaded. For CI environments
where detection overhead is unwanted, use the static configuration:

```typescript
// No detection overhead
export { default } from "@savvy-web/commitlint/static";
```

## Troubleshooting

### Scopes not detected

- Ensure you have a valid `pnpm-workspace.yaml` or `workspaces` field in
  `package.json`
- Run from the repository root or specify `cwd` option

### DCO not detected

- The `DCO` file must be at the repository root (not in a subdirectory)
- File name is case-sensitive: `DCO`, not `dco` or `Dco`

### Wrong release format

- Check your `.changeset/config.json` for `fixed` or `linked` groups
- Override with `releaseFormat` option if auto-detection is incorrect
