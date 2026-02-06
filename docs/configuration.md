# Configuration Guide

Complete reference for all configuration options available in
`@savvy-web/commitlint`.

## Dynamic Configuration

The `CommitlintConfig.silk()` method accepts an options object to customize
behavior:

```typescript
import { CommitlintConfig } from "@savvy-web/commitlint";

export default CommitlintConfig.silk({
  dco: true,                    // Override DCO detection
  scopes: ["api", "cli"],       // Enforce scope allowlist
  additionalScopes: ["deps"],   // Merge additional scopes
  releaseFormat: "semver",      // Override versioning detection
  emojis: true,                 // Enable emojis in prompts
  noMarkdown: true,             // Reject markdown in commits (default)
  bodyMaxLineLength: 500,       // Custom body length (default: 300)
  cwd: "/path/to/repo",         // Working directory for detection
});
```

## Configuration Options

### dco

| Type | Default |
| ---- | ------- |
| `boolean \| undefined` | Auto-detect from DCO file |

Controls the DCO (Developer Certificate of Origin) signoff requirement.

- `true` - Always require `Signed-off-by:` trailer
- `false` - Never require signoff
- `undefined` - Auto-detect based on `DCO` file presence at repo root

```typescript
// Force DCO requirement
CommitlintConfig.silk({ dco: true });

// Disable DCO even if DCO file exists
CommitlintConfig.silk({ dco: false });
```

### scopes

| Type | Default |
| ---- | ------- |
| `string[] \| undefined` | `undefined` (no restriction) |

Enforces a `scope-enum` rule restricting commits to only these scopes.
When omitted, any scope is allowed.

```typescript
// Restrict commits to only these scopes
CommitlintConfig.silk({
  scopes: ["core", "api", "cli", "docs"],
});
```

### additionalScopes

| Type | Default |
| ---- | ------- |
| `string[] \| undefined` | `[]` |

Additional scopes merged with `scopes` (deduplicated and sorted). Can be
used alone or together with `scopes` to form the full allowlist.

```typescript
// Combine with scopes for a complete allowlist
CommitlintConfig.silk({
  scopes: ["core", "api"],
  additionalScopes: ["deps", "config"],
});
```

### releaseFormat

| Type | Default |
| ---- | ------- |
| `"semver" \| "packages" \| "scoped" \| undefined` | Auto-detect |

Controls the expected format for release commits.

- `semver` - For single-version repos: `release: v1.2.3`
- `packages` - For independent versioning: `release: version packages`
- `scoped` - For scoped releases: `release(pkg): v1.2.3`

```typescript
// Force semver release format
CommitlintConfig.silk({ releaseFormat: "semver" });
```

### emojis

| Type | Default |
| ---- | ------- |
| `boolean` | `false` |

Enables emoji prefixes in prompt configuration. This affects interactive
commit tools like commitizen.

```typescript
// Enable emojis for prompts
CommitlintConfig.silk({ emojis: true });
```

### bodyMaxLineLength

| Type | Default |
| ---- | ------- |
| `number` | `300` |

Maximum allowed line length in the commit body. Set higher than the standard
100 to accommodate detailed messages, especially from AI tools.

```typescript
// Allow longer lines in body
CommitlintConfig.silk({ bodyMaxLineLength: 500 });
```

### noMarkdown

| Type | Default |
| ---- | ------- |
| `boolean` | `true` |

Rejects markdown formatting in commit messages. When enabled, messages
containing headers, numbered lists, code fences, links, or bold/italic
formatting will be rejected. Simple unordered lists (`-` or `*`) are
allowed for readability.

```typescript
// Allow markdown in commit messages
CommitlintConfig.silk({ noMarkdown: false });
```

### cwd

| Type | Default |
| ---- | ------- |
| `string \| undefined` | `process.cwd()` |

Working directory for detection. Useful when running commitlint from a
different directory than the repository root.

```typescript
CommitlintConfig.silk({ cwd: "/path/to/repo" });
```

## Environment Variables

### COMMITLINT_SKIP_DCO

Set to `"1"` or `"true"` to disable the DCO signoff check at runtime.
Useful for CI environments that validate PR titles rather than individual
commit messages.

```bash
COMMITLINT_SKIP_DCO=1 commitlint --edit
```

## Static Configuration

For projects that don't need auto-detection, use the static export:

```typescript
export { default } from "@savvy-web/commitlint/static";
```

### Extending Static Config

```typescript
import config from "@savvy-web/commitlint/static";

export default {
  ...config,
  rules: {
    ...config.rules,
    "scope-enum": [2, "always", ["api", "cli", "core"]],
  },
};
```

## Generated Rules

The configuration generates these commitlint rules:

| Rule | Value | Condition |
| ---- | ----- | --------- |
| `body-max-line-length` | Configurable (default 300) | Always |
| `type-enum` | Extended type list | Always |
| `scope-enum` | Provided scopes | When scopes or additionalScopes set |
| `silk/signed-off-by` | `Signed-off-by:` | When DCO enabled |
| `silk/body-no-markdown` | Reject markdown in body | When noMarkdown enabled |
| `silk/subject-no-markdown` | Reject markdown in subject | When noMarkdown enabled |
| `subject-case` | Disabled | Always (allows AI-style capitalization) |

## Validation

All options are validated using Zod schemas. Invalid options will throw
descriptive errors at configuration time.
