---
name: simplify
description: Simplify and refine code for clarity, consistency, and maintainability while preserving all functionality
context: fork
agent: code-simplifier:code-simplifier
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(pnpm run *)
---

# Simplify Module Code

Review and simplify the module codebase.

## Scope

Review all TypeScript source files in `src/`. Focus on the public API surface first, then internal implementation. Check for dead code and remove. Ensure proper use of TypeScript best practices such as proper use of access modifiers.

## Output Mode

Make changes directly. Run `pnpm run ci:build` after changes to verify correctness. Fix any build errors before considering the task complete.

## Priority (highest to lowest)

1. API clarity and simplicity
2. TSDoc completeness
3. Code organization (class structure)
4. Internal implementation cleanliness

## Custom Instructions

### Class-Based API Pattern (Primary Design Principle)

**Always prefer class-based APIs.** Classes provide superior organization, encapsulation, and TSDoc documentation support. Tree-shaking is not a priority—code clarity and auto-generated documentation are.

Benefits of class-based design:

- **TSDoc integration**: API Extractor generates better documentation from classes
- **Co-location**: Related logic, constants, and types live together
- **Encapsulation**: Access modifiers (`private`, `protected`, `readonly`) enforce boundaries
- **Discoverability**: IDE autocomplete shows all related methods in one place
- **Testability**: Instance methods can be mocked; static methods provide utilities

```typescript
// PREFERRED: Class-based API
export class ConfigFactory {
  /** Default timeout in milliseconds. */
  static readonly DEFAULT_TIMEOUT = 30000;

  /** Supported configuration versions. */
  static readonly SUPPORTED_VERSIONS = ["1.0", "2.0"] as const;

  /**
   * Create a new configuration with validation.
   * @param options - Configuration options
   * @returns Validated configuration instance
   */
  static create(options: ConfigOptions): Config {
    this.validate(options);
    return new Config(options);
  }

  private static validate(options: ConfigOptions): void {
    // Validation logic - private, not part of public API
  }
}

// AVOID: Scattered functions and constants
export const DEFAULT_TIMEOUT = 30000;
export const SUPPORTED_VERSIONS = ["1.0", "2.0"];
export function createConfig(options: ConfigOptions): Config { /* ... */ }
function validateConfig(options: ConfigOptions): void { /* ... */ }
```

→ See [references/api-patterns.md](references/api-patterns.md) for class design patterns

### Versioning Freedom

Check `package.json`. If version is below `1.0.0`:

- No backward compatibility requirements
- No `@deprecated` annotations needed
- Freely restructure the API
- Document breaking changes in changesets only

### TSDoc Standards (API Extractor)

Document in **strict TSDoc** format. Be thorough—good documentation prevents future confusion.

#### Required Elements

- Document all interface properties, even if names seem self-explanatory
- Clearly mark visibility with `@public`, `@internal`, `@beta`, or `@alpha` tags
- Provide `@example` blocks for public APIs (see below)

#### Example Blocks

Add `@example` blocks to demonstrate how to use classes, methods, and functions. Every TypeScript example must be a **complete, runnable program**:

- Include all necessary imports
- Separate value and type imports (`import` vs `import type`)
- Show realistic usage, not just syntax

```typescript
/**
 * Creates a validated client instance.
 *
 * @example
 * ```typescript
 * import { ClientFactory } from "@org/service-client";
 * import type { ClientOptions } from "@org/service-client";
 *
 * const options: ClientOptions = {
 *   endpoint: "https://api.example.com",
 *   timeout: 5000,
 * };
 *
 * const client = ClientFactory.create(options);
 * const result = await client.fetch("/users");
 * ```
 */
```

**When to add examples:**

- Public classes and their primary methods
- Factory functions and constructors
- Configuration interfaces (show typical usage)
- Complex utility functions

**When examples are optional:**

- Simple getters/setters
- Self-explanatory boolean methods
- Internal utilities

#### Cross-References and Links

Use `{@link Type}` to create navigable references to related types, functions, or classes:

```typescript
/**
 * Creates a validated configuration.
 *
 * @param options - Raw options to validate against {@link OptionsSchema}
 * @returns A validated {@link ResolvedOptions} object
 * @see {@link ConfigFactory.create} for the primary entry point
 */
```

Use `@see` for references to external documentation or related APIs:

```typescript
/**
 * @see https://example.com/docs/configuration
 * @see {@link Detector.detectScopes} for automatic scope detection
 */
```

#### Documentation Inheritance

Use `@inheritDoc` to inherit documentation from a parent class or interface:

```typescript
interface BaseConfig {
  /**
   * Maximum execution time in milliseconds.
   * @defaultValue 30000
   */
  timeout?: number;
}

interface ExtendedConfig extends BaseConfig {
  /** {@inheritDoc BaseConfig.timeout} */
  timeout?: number;
}
```

#### Deep Explanations

Use `@remarks` for deeper discussion of appropriate use, edge cases, or design rationale:

```typescript
/**
 * Detects feature flags from environment configuration.
 *
 * @remarks
 * The detection checks for configuration files in the project root.
 * This supports multiple formats including JSON, YAML, and environment variables.
 *
 * Note: This only reads static configuration files, not runtime state.
 * For dynamic feature flags, use the FeatureService class instead.
 */
```

#### Agent-Facing Documentation

Use `@privateRemarks` to document implementation details, workarounds, or gotchas that would help future agents (or developers) understand non-obvious code:

```typescript
/**
 * Parses the input string into structured tokens.
 *
 * @privateRemarks
 * The regex uses a non-greedy match because some edge cases include
 * nested delimiters. This workaround handles those cases without
 * breaking valid inputs.
 *
 * See issue #42 for the original bug report.
 */
```

#### Complete Example

```typescript
/**
 * Configuration options for the service client.
 *
 * @remarks
 * The `timeout` property applies to the entire request lifecycle, not individual retries.
 * For retry-level timeouts, configure the retry policy separately.
 *
 * @privateRemarks
 * We intentionally don't validate timeout against MAX_SAFE_INTEGER here because
 * the Zod schema handles that validation. Duplicating it would create drift risk.
 *
 * @see https://example.com/docs/client-config
 * @see {@link ServiceClient.create} for the factory method
 *
 * @example
 * ```typescript
 * import { ServiceClient } from '@org/service-client';
 * import type { ClientConfig } from '@org/service-client';
 *
 * const config: ClientConfig = {
 *   endpoint: 'https://api.example.com',
 *   timeout: 60000,
 * };
 *
 * const client = ServiceClient.create(config);
 * ```
 *
 * @public
 */
export interface ClientConfig {
  /**
   * The API endpoint URL.
   * @see {@link ServiceClient.DEFAULT_ENDPOINT} for the default value
   */
  endpoint: string;

  /**
   * Maximum request time in milliseconds.
   * @defaultValue 30000
   */
  timeout?: number;
}
```

### Package Entry Points

Packages may have multiple entry points. Check `package.json` `exports` field to identify them:

- **Main entry** (`src/index.ts`) - Library API, should have `@packageDocumentation` block
- **CLI entry** (`src/bin/*.ts` or `src/cli/index.ts`) - Command-line interface
- **Subpath exports** - Additional public APIs exposed via `exports` field

Each entry point:

- Should have a `@packageDocumentation` or `@module` TSDoc block
- Exports only what users of that entry point need
- May re-export from implementation files (this defines the public API surface)

### Public API Surface Area

**Keep the public API minimal.** Export only what users need to interact with the module.

**What to export:**

- Primary classes and their factory methods
- Configuration types users must provide
- Result types users receive
- Error classes users may need to catch
- Constants users may reference

**What to keep internal:**

- Implementation details and helper functions
- Internal types only used between modules
- Validation logic and schemas (unless users need to extend them)
- Intermediate data structures

**Advanced usage exports (use judiciously):**

In some cases, expose internal classes for power users who need fine-grained control. Mark these clearly:

```typescript
// Primary API - what most users need
export { ServiceClient } from "./client/factory.js";
export type { ClientConfig } from "./client/schema.js";

// Advanced API - for users who need lower-level access
// Consider using a subpath export like "@org/package/advanced"
export { RequestBuilder } from "./internal/builder.js";
export type { RequestConfig, RetryPolicy } from "./internal/types.js";
```

**Questions to ask before exporting:**

1. Will typical users need this? → Export from main entry
2. Will power users need this? → Consider subpath export or `@internal` tag
3. Is this an implementation detail? → Keep internal, don't export

### Barrel Export Rules

**Only package entry points should re-export.** Entry points are files exposed via `package.json` `exports`.

Internal modules must import directly from each other, never through barrel files.

```typescript
// WRONG: intermediate barrel file (src/utils/index.ts)
export { parseConfig } from "./parser.js";
export { validateSchema } from "./validator.js";

// WRONG: importing through barrel
import { parseConfig } from "./utils/index.js";

// CORRECT: import directly from the source file
import { parseConfig } from "./utils/parser.js";
```

When you find intermediate barrel files (index.ts files that only re-export):

1. Update all internal imports to use direct paths
2. Move the re-exports to an entry point if they're part of the public API
3. Delete the intermediate barrel file
4. If the barrel had a `@module` TSDoc block, move that documentation to the appropriate entry point or remove if redundant

**Allowed re-exports:** Only in entry points defined in `package.json` `exports` (e.g., `src/index.ts`, `src/bin/cli.ts`).

### Type Export Rules

- Define types where they're used, export from that file only
- The main `index.ts` re-exports from implementation files (single source of truth)
- Never re-export types through intermediate barrel files
- Prefer `export type { Foo }` over `export { type Foo }` for type-only exports
- Use `verbatimModuleSyntax` in tsconfig to enforce explicit type imports

## TypeScript Best Practices

Apply these patterns when simplifying code. For detailed examples, see the reference files.

### Type Safety

- **Branded types**: Use for IDs that shouldn't be interchangeable (`UserId` vs `OrderId`)
- **Discriminated unions**: Use `kind` or `type` field for exhaustive pattern matching
- **Const assertions**: Use `as const` for literal types and immutable data
- **Type guards**: Create `is` functions for runtime narrowing
- **Avoid `any`**: Use `unknown` with narrowing, or generics

→ See [references/type-patterns.md](references/type-patterns.md) for examples

### API Design

- **Function overloads**: When return type depends on input type
- **Error hierarchy**: Extend a base error class, use `cause` for chaining
- **Explicit return types**: All public functions should declare return types
- **Generic constraints**: Use `extends` to constrain generic parameters
- **Zod integration**: Define schema first, infer type with `z.infer<>`

→ See [references/api-patterns.md](references/api-patterns.md) for examples

### Bundle Optimization (Lower Priority)

Tree-shaking is **not a priority**—prefer class-based design for clarity and documentation. Apply these selectively:

- **Type-only imports**: Use `import type` to ensure erasure (always do this)
- **Direct imports**: Import from source files, not barrel files (internally)
- **Avoid expensive types**: Limit recursive types, keep unions small
- **Lazy loading**: Only for truly heavy optional dependencies

→ See [references/bundle-optimization.md](references/bundle-optimization.md) for details when needed

## Reference Materials

Load these files when you need detailed patterns and examples:

- [references/type-patterns.md](references/type-patterns.md) - Branded types, discriminated unions, const assertions, type guards, avoiding `any`
- [references/api-patterns.md](references/api-patterns.md) - Function overloads, error classes, builders, Zod integration
- [references/bundle-optimization.md](references/bundle-optimization.md) - Tree-shaking, side effects, lazy loading, type testing
