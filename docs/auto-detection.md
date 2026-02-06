# Auto-Detection

`@savvy-web/commitlint` automatically detects repository characteristics to
generate appropriate commit rules. This document explains what gets detected
and how.

## Detection Overview

When you call `CommitlintConfig.silk()` without options, the package detects:

1. **DCO Requirement** - Whether commits need `Signed-off-by:` trailers
2. **Release Format** - How release commits should be formatted

Scopes are not auto-detected. By default, any scope is allowed. Use the
`scopes` or `additionalScopes` options to enforce an allowlist.

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

## Scope Configuration

By default, scopes are unrestricted -- any scope is allowed in commit
messages. To enforce an allowlist, provide explicit scopes:

```typescript
// Restrict to specific scopes
CommitlintConfig.silk({ scopes: ["core", "api", "cli"] });

// Or combine lists
CommitlintConfig.silk({
  scopes: ["core", "api"],
  additionalScopes: ["deps", "config"],
});
```

The `detectScopes()` utility is still exported for programmatic use. It
finds all packages in a monorepo and extracts their names as scope values:

| Package Name | Detected Scope |
| ------------ | -------------- |
| `@scope/api-client` | `api-client` |
| `@scope/cli-tools` | `cli-tools` |
| `utils` | `utils` |

```typescript
import { detectScopes } from "@savvy-web/commitlint";

// Use detected scopes as an explicit allowlist
const scopes = detectScopes("/path/to/repo");
CommitlintConfig.silk({ scopes });
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

### Scopes not enforced

Scopes are unrestricted by default. To enforce an allowlist, explicitly
provide `scopes` or `additionalScopes` in the configuration options.

If using `detectScopes()` directly, ensure you have a valid
`pnpm-workspace.yaml` or `workspaces` field in `package.json`, and
run from the repository root or specify `cwd`.

### DCO not detected

- The `DCO` file must be at the repository root (not in a subdirectory)
- File name is case-sensitive: `DCO`, not `dco` or `Dco`

### Wrong release format

- Check your `.changeset/config.json` for `fixed` or `linked` groups
- Override with `releaseFormat` option if auto-detection is incorrect
