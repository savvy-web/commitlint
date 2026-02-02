# Type Safety Patterns

Reference guide for TypeScript type safety patterns. Load when improving type safety or refactoring types.

## Branded/Nominal Types

Prevent mixing semantically different values that share the same primitive type.

```typescript
// PROBLEM: Easy to mix up IDs
function getUser(userId: string): User { /* ... */ }
function getOrder(orderId: string): Order { /* ... */ }

getUser(orderId); // No error, but wrong!

// SOLUTION: Branded types
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUser(userId: UserId): User { /* ... */ }
function getOrder(orderId: OrderId): Order { /* ... */ }

getUser(orderId); // Error: Argument of type 'OrderId' is not assignable to 'UserId'
```

**When to use:**

- IDs that should not be interchangeable (userId, orderId, sessionId)
- Units that should not mix (pixels vs rem, milliseconds vs seconds)
- Validated strings (email, URL, slug)

## Discriminated Unions

Enable exhaustive pattern matching with compile-time safety.

```typescript
// Define a discriminated union with a common "kind" or "type" field
type ConfigResult =
  | { kind: "success"; config: ResolvedConfig }
  | { kind: "error"; message: string; code: number }
  | { kind: "partial"; config: Partial<ResolvedConfig>; warnings: string[] };

function handleResult(result: ConfigResult): void {
  switch (result.kind) {
    case "success":
      // TypeScript knows result.config exists here
      applyConfig(result.config);
      break;
    case "error":
      // TypeScript knows result.message and result.code exist here
      logError(result.message, result.code);
      break;
    case "partial":
      // TypeScript knows result.warnings exists here
      applyPartialConfig(result.config, result.warnings);
      break;
    default:
      // Exhaustiveness check - errors if a case is missing
      const _exhaustive: never = result;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}
```

**When to use:**

- State machines (loading, success, error states)
- Command/event patterns
- Polymorphic data structures
- API responses with different shapes

## Const Assertions and Readonly

Preserve literal types and prevent mutation.

```typescript
// Without as const - types are widened
const config = {
  level: "info",
  formats: ["json", "text"],
};
// Type: { level: string; formats: string[] }

// With as const - literal types preserved
const config = {
  level: "info",
  formats: ["json", "text"],
} as const;
// Type: { readonly level: "info"; readonly formats: readonly ["json", "text"] }

// Use for configuration objects that shouldn't change
export const COMMIT_TYPES = ["feat", "fix", "chore", "docs"] as const;
type CommitType = (typeof COMMIT_TYPES)[number]; // "feat" | "fix" | "chore" | "docs"

// Readonly for function parameters that shouldn't mutate input
function processItems(items: readonly string[]): string[] {
  // items.push("x"); // Error: Property 'push' does not exist
  return items.map((item) => item.toUpperCase()); // OK - creates new array
}
```

**When to use:**

- Configuration constants
- Enum-like values (prefer `as const` arrays over TypeScript enums)
- Function parameters that should not be mutated
- Return types that consumers should not modify

## Type Guards

Runtime narrowing with type safety.

```typescript
// User-defined type guard with `is` return type
function isConfigError(
  result: ConfigResult
): result is { kind: "error"; message: string; code: number } {
  return result.kind === "error";
}

// Use in conditionals
if (isConfigError(result)) {
  // TypeScript knows result has message and code here
  console.error(result.message);
}

// Type guard for nullable values
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Filter with type narrowing
const items: (string | null)[] = ["a", null, "b"];
const defined: string[] = items.filter(isDefined); // Type is string[]

// Assertion function (throws if false)
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}
```

**When to use:**

- Validating external data (API responses, user input)
- Narrowing union types
- Filtering arrays while preserving types
- Runtime assertions with type implications

## Avoiding `any`

Replace `any` with safer alternatives.

```typescript
// AVOID: any disables all type checking
function process(data: any): any {
  return data.foo.bar; // No error even if this crashes at runtime
}

// USE: unknown requires narrowing before use
function process(data: unknown): string {
  if (typeof data === "object" && data !== null && "foo" in data) {
    // Now TypeScript knows data has a foo property
    return String((data as { foo: unknown }).foo);
  }
  throw new Error("Invalid data shape");
}

// USE: generics for flexible but type-safe functions
function identity<T>(value: T): T {
  return value;
}

// USE: Record for dynamic keys with known value types
function processConfig(config: Record<string, string>): void {
  // Keys are strings, values are strings
}

// USE: specific union types instead of any
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
```

**When `any` is acceptable:**

- Migrating JavaScript to TypeScript (temporary, with TODO to fix)
- Third-party library types that are incorrect (with `@ts-expect-error` comment explaining why)
- Test mocks where full typing is impractical

## Strict Null Handling

Explicit handling of nullable values.

```typescript
// Use optional chaining for nested access
const name = user?.profile?.name;

// Use nullish coalescing for defaults (preserves 0, "", false)
const count = config.count ?? 10;

// Avoid non-null assertion (!) unless you're certain
const element = document.getElementById("app");
if (!element) throw new Error("App element not found");
element.classList.add("loaded"); // Safe - we checked above

// Use explicit undefined for optional returns
function findUser(id: string): User | undefined {
  return users.get(id);
}

// Never return null AND undefined - pick one
// Prefer undefined (aligns with optional properties)
```
