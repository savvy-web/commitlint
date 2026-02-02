# Bundle Optimization Patterns

Reference guide for code organization patterns. Load when needed for specific optimizations.

> **Note:** Tree-shaking is **not a priority** in this codebase. Prefer class-based design for clarity, encapsulation, and TSDoc documentation support. Apply these patterns selectively when there's a clear benefit.

## Side-Effect Free Exports

Enable tree-shaking by avoiding top-level side effects.

```typescript
// BAD: Side effect at module level - can't tree-shake
console.log("Module loaded");
const startTime = Date.now(); // Side effect

export class Config {
  createdAt = startTime; // Depends on side effect
}

// BAD: Mutable module state
export let counter = 0;
export function increment() {
  counter++;
}

// GOOD: Pure exports, no side effects
export class Config {
  readonly createdAt: number;

  constructor() {
    this.createdAt = Date.now(); // Side effect in constructor, not at import
  }
}

// GOOD: Factory function instead of mutable state
export function createCounter() {
  let count = 0;
  return {
    get value() {
      return count;
    },
    increment() {
      count++;
    },
  };
}
```

**Rules:**

- No `console.log`, `Date.now()`, or I/O at module top level
- No mutable module-level variables
- Use factory functions or classes instead of module state
- Mark package.json with `"sideEffects": false` when applicable

## Avoid Barrel File Performance Issues

Barrel files can prevent tree-shaking.

```typescript
// BAD: Barrel file imports everything
// utils/index.ts
export * from "./string.js";
export * from "./number.js";
export * from "./date.js";
export * from "./heavy-computation.js"; // Always imported!

// Consumer imports one thing, gets everything
import { formatString } from "./utils"; // Pulls in all utils

// GOOD: Direct imports
import { formatString } from "./utils/string.js";

// GOOD: If barrel is needed, use explicit named exports
// utils/index.ts
export { formatString, capitalize } from "./string.js";
export { clamp, round } from "./number.js";
// Don't re-export heavy modules
```

**When barrels are acceptable:**

- Package entry points (consumers expect to import from package name)
- Small, cohesive modules where everything is typically used together

## Lazy Loading Heavy Dependencies

Defer expensive imports until needed.

```typescript
// BAD: Heavy dependency loaded at import time
import { heavyLibrary } from "heavy-library";

export function processIfNeeded(data: unknown) {
  if (shouldProcess(data)) {
    return heavyLibrary.process(data);
  }
  return data;
}

// GOOD: Dynamic import defers loading
export async function processIfNeeded(data: unknown) {
  if (shouldProcess(data)) {
    const { heavyLibrary } = await import("heavy-library");
    return heavyLibrary.process(data);
  }
  return data;
}

// GOOD: Lazy singleton pattern
let heavyInstance: HeavyLibrary | undefined;

async function getHeavyLibrary(): Promise<HeavyLibrary> {
  if (!heavyInstance) {
    const { HeavyLibrary } = await import("heavy-library");
    heavyInstance = new HeavyLibrary();
  }
  return heavyInstance;
}
```

## Avoiding Expensive Type Computations

Complex types can slow down the TypeScript compiler.

```typescript
// BAD: Deeply recursive type
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type HugeConfig = DeepPartial<VeryLargeType>; // Slow to compute

// BETTER: Limit recursion depth
type DeepPartial<T, Depth extends number = 3> = Depth extends 0
  ? T
  : {
      [P in keyof T]?: T[P] extends object
        ? DeepPartial<T[P], [-1, 0, 1, 2][Depth]>
        : T[P];
    };

// BAD: Huge union types
type AllPermutations<T extends string[]> = /* ... */; // Exponential complexity

// BETTER: Use branded string instead
type Permission = string & { readonly __brand: "Permission" };

// BAD: Complex mapped types over large objects
type AllKeys = keyof typeof hugeObjectWith100Properties;

// BETTER: Define explicit subset
type RelevantKeys = "name" | "version" | "description";
```

**Rules:**

- Avoid recursive types deeper than 3-4 levels
- Keep union types under ~50 members
- Use `interface` over `type` for object shapes (faster)
- Avoid `keyof` on very large objects

## Type-Only Imports

Ensure type imports are erased from output.

```typescript
// BAD: Mixed imports can confuse bundlers
import { Config, createConfig } from "./config.js";

// GOOD: Separate type and value imports
import type { Config } from "./config.js";
import { createConfig } from "./config.js";

// GOOD: Inline type modifier
import { createConfig, type Config } from "./config.js";

// In tsconfig.json, enable:
{
  "compilerOptions": {
    "verbatimModuleSyntax": true // Enforces explicit type imports
  }
}
```

**Benefits:**

- Types are guaranteed to be erased (no runtime import)
- Bundlers can better tree-shake
- Makes dependencies clearer

## Conditional Exports in package.json

Different builds for different environments.

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./slim": {
      "import": "./dist/slim.js"
    }
  },
  "sideEffects": false
}
```

**Patterns:**

- Provide both ESM and CJS builds
- Put `types` condition first for TypeScript resolution
- Use `sideEffects: false` to enable tree-shaking
- Consider a `/slim` or `/lite` export for minimal bundles

## Testing Type Correctness

Validate types without runtime overhead.

```typescript
import { expectTypeOf } from "expect-type";
import type { Config, ConfigOptions } from "./config.js";

// Test that types are correct
test("ConfigOptions should be assignable to Partial<Config>", () => {
  expectTypeOf<ConfigOptions>().toMatchTypeOf<Partial<Config>>();
});

// Test that function returns correct type
test("createConfig returns Config", () => {
  expectTypeOf(createConfig).returns.toEqualTypeOf<Config>();
});

// Test that certain assignments should fail
test("Config requires name", () => {
  // @ts-expect-error - name is required
  const config: Config = { version: "1.0" };
});
```

**When to use:**

- Public API types that consumers depend on
- Generic utility types
- Type inference that could regress
