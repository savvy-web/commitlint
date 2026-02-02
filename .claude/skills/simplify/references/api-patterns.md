# API Design Patterns

Reference guide for TypeScript API design patterns. Load when designing public APIs or refactoring interfaces.

## Class-Based API Design (Primary Pattern)

Classes are the preferred way to organize APIs. They provide superior TSDoc support, encapsulation, and discoverability.

### Static Factory Pattern

Use static methods for object creation with validation.

```typescript
/**
 * Service client configuration factory.
 *
 * @remarks
 * Provides static methods for creating validated configurations.
 * Use {@link ClientFactory.create} for standard setup or
 * {@link ClientFactory.minimal} for lightweight instances.
 *
 * @example
 * ```typescript
 * import { ClientFactory } from "@org/service-client";
 *
 * // Standard configuration with defaults
 * const client = ClientFactory.create({ endpoint: "https://api.example.com" });
 *
 * // With custom options
 * const client = ClientFactory.create({ endpoint: "https://api.example.com", timeout: 5000 });
 * ```
 *
 * @public
 */
export class ClientFactory {
  /** Default request timeout in milliseconds. */
  static readonly DEFAULT_TIMEOUT = 30000;

  /** Supported API versions. */
  static readonly SUPPORTED_VERSIONS = ["v1", "v2", "v3"] as const;

  /**
   * Create a client with standard configuration.
   * @param options - Configuration options
   * @returns Configured client instance
   */
  static create(options: ClientOptions): ServiceClient {
    const validated = ClientOptionsSchema.parse(options);
    return this.buildClient(validated);
  }

  /**
   * Create a minimal client without middleware.
   * @param options - Required configuration options
   */
  static minimal(options: MinimalOptions): ServiceClient {
    return this.buildClient(options);
  }

  private static buildClient(options: ResolvedOptions): ServiceClient {
    // Implementation
  }

  // Prevent instantiation - this is a static-only class
  private constructor() {}
}
```

### Instance-Based Pattern

Use instances when the object has state or lifecycle.

```typescript
/**
 * File system scanner with caching.
 *
 * @remarks
 * Caches scan results for performance.
 * Create one instance per scanning session.
 *
 * @example
 * ```typescript
 * const scanner = new FileScanner({ root: process.cwd() });
 * const files = await scanner.scan();
 * console.log(scanner.stats); // { files: 150, duration: 120 }
 * ```
 *
 * @public
 */
export class FileScanner {
  /** Scan statistics from the last run. */
  readonly stats: ScanStats = { files: 0, duration: 0 };

  private readonly root: string;
  private cache: Map<string, string[]> = new Map();

  constructor(options: FileScannerOptions) {
    this.root = options.root;
  }

  /**
   * Scan for files matching the configured patterns.
   * Results are cached for subsequent calls.
   */
  async scan(): Promise<string[]> {
    if (this.cache.has(this.root)) {
      return this.cache.get(this.root)!;
    }
    // Scanning logic...
  }

  /** Clear the scan cache. */
  clearCache(): void {
    this.cache.clear();
  }
}
```

### Encapsulation with Access Modifiers

Use TypeScript access modifiers to enforce API boundaries.

```typescript
export class ConfigBuilder {
  // Public: Part of the API contract
  public readonly version: string;

  // Protected: Available to subclasses
  protected options: BuilderOptions;

  // Private: Implementation detail
  private validated = false;

  // Readonly: Immutable after construction
  readonly createdAt: Date;

  constructor(options: BuilderOptions) {
    this.version = "1.0";
    this.options = options;
    this.createdAt = new Date();
  }

  // Public method - part of API
  build(): Config {
    this.validate(); // Can call private method
    return this.createConfig();
  }

  // Private method - hidden from consumers
  private validate(): void {
    if (this.validated) return;
    // Validation logic
    this.validated = true;
  }

  // Protected method - subclasses can override
  protected createConfig(): Config {
    return { ...this.options };
  }
}
```

### Companion Types Pattern

Co-locate types with their class for discoverability.

```typescript
/**
 * Options for {@link ConfigFactory.create}.
 * @public
 */
export interface ConfigFactoryOptions {
  /** Package name for the configuration. */
  name: string;
  /** Enable DCO signoff requirement. */
  dco?: boolean;
}

/**
 * Result returned by {@link ConfigFactory.create}.
 * @public
 */
export interface ConfigFactoryResult {
  /** The generated configuration. */
  config: UserConfig;
  /** Warnings encountered during generation. */
  warnings: string[];
}

/**
 * Factory for creating service configurations.
 * @public
 */
export class ConfigFactory {
  static create(options: ConfigFactoryOptions): ConfigFactoryResult {
    // Implementation
  }
}
```

### When to Use Classes vs Functions

**Use classes when:**

- You have related methods that share context
- You need instance state or caching
- You want TSDoc to group related functionality
- You need access modifiers for encapsulation
- The API will be extended or subclassed

**Use standalone functions when:**

- The function is truly independent (no related functions)
- It's a simple utility with no state
- It's only used internally (not part of public API)

```typescript
// PREFER: Class groups related validation logic
export class Validator {
  static validateSchema(): boolean { /* ... */ }
  static validateFormat(): string[] { /* ... */ }
  static validatePermissions(): Result { /* ... */ }
}

// AVOID: Scattered functions
export function validateSchema(): boolean { /* ... */ }
export function validateFormat(): string[] { /* ... */ }
export function validatePermissions(): Result { /* ... */ }
```

## Function Overloads

Provide better IntelliSense and type inference for functions with multiple signatures.

```typescript
// PROBLEM: Union return type loses specificity
function parse(input: string | Buffer): string | Uint8Array {
  if (typeof input === "string") return input;
  return new Uint8Array(input);
}
const result = parse("hello"); // Type: string | Uint8Array (too broad)

// SOLUTION: Function overloads
function parse(input: string): string;
function parse(input: Buffer): Uint8Array;
function parse(input: string | Buffer): string | Uint8Array {
  if (typeof input === "string") return input;
  return new Uint8Array(input);
}
const result = parse("hello"); // Type: string (precise!)

// Overloads for optional parameters with different behaviors
function createElement(tag: "input"): HTMLInputElement;
function createElement(tag: "div"): HTMLDivElement;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}
```

**When to use:**

- Return type depends on input type
- Different parameter combinations have different behaviors
- Improving IntelliSense for common use cases

**Rules:**

- Overload signatures must be more specific than the implementation
- Order overloads from most specific to least specific
- Implementation signature is not callable - it just handles all cases

## Builder Pattern with Type Safety

Compile-time enforcement of required fields.

```typescript
// Type-safe builder that tracks which fields have been set
type BuilderState = {
  name: boolean;
  version: boolean;
};

class ConfigBuilder<State extends BuilderState = { name: false; version: false }> {
  private config: Partial<Config> = {};

  name(value: string): ConfigBuilder<State & { name: true }> {
    this.config.name = value;
    return this as unknown as ConfigBuilder<State & { name: true }>;
  }

  version(value: string): ConfigBuilder<State & { version: true }> {
    this.config.version = value;
    return this as unknown as ConfigBuilder<State & { version: true }>;
  }

  description(value: string): this {
    this.config.description = value;
    return this;
  }

  // Only callable when all required fields are set
  build(this: ConfigBuilder<{ name: true; version: true }>): Config {
    return this.config as Config;
  }
}

// Usage
new ConfigBuilder()
  .name("my-app")
  .build(); // Error: 'build' does not exist (version not set)

new ConfigBuilder()
  .name("my-app")
  .version("1.0.0")
  .build(); // OK - returns Config
```

**Simpler alternative for most cases:**

```typescript
// Required options in constructor, optional via methods
class ConfigBuilder {
  private config: Config;

  constructor(required: { name: string; version: string }) {
    this.config = { ...required, description: undefined };
  }

  description(value: string): this {
    this.config.description = value;
    return this;
  }

  build(): Config {
    return { ...this.config };
  }
}
```

## Error Class Hierarchy

Typed error handling with cause chains.

```typescript
/**
 * Base error for all package errors.
 * @public
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "ServiceError";
    // Maintains proper stack trace in V8 environments
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Error thrown when configuration is invalid.
 * @public
 */
export class ConfigValidationError extends ServiceError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
    options?: { cause?: unknown }
  ) {
    super(`Invalid config field "${field}": ${message}`, options);
    this.name = "ConfigValidationError";
  }
}

/**
 * Error thrown when a network request fails.
 * @public
 */
export class NetworkError extends ServiceError {
  constructor(
    message: string,
    public readonly statusCode: number,
    options?: { cause?: unknown }
  ) {
    super(`Request failed (${statusCode}): ${message}`, options);
    this.name = "NetworkError";
  }
}

// Usage with cause chaining
try {
  const config = JSON.parse(rawConfig);
} catch (error) {
  throw new ConfigValidationError(
    "Invalid JSON",
    "configFile",
    rawConfig,
    { cause: error } // Preserves original error
  );
}

// Type-safe error handling
function handleError(error: unknown): void {
  if (error instanceof ConfigValidationError) {
    console.error(`Config error in ${error.field}:`, error.value);
  } else if (error instanceof NetworkError) {
    console.error(`Network error (${error.statusCode}):`, error.message);
  } else if (error instanceof ServiceError) {
    console.error("Service error:", error.message);
  } else {
    throw error; // Re-throw unknown errors
  }
}
```

**Rules:**

- All package errors should extend a base error class
- Include structured data (field names, codes) for programmatic handling
- Use `cause` option to chain errors and preserve stack traces
- Set `this.name` for proper error identification

## Strict Return Types

Explicit return types prevent accidental API changes.

```typescript
// PROBLEM: Implicit return type can change unexpectedly
function getConfig() {
  // If this changes, callers might break silently
  return { name: "app", version: "1.0" };
}

// SOLUTION: Explicit return type catches changes at the source
function getConfig(): Config {
  return { name: "app", version: "1.0" };
}

// Distinguish void from undefined
function logMessage(msg: string): void {
  console.log(msg);
  // Cannot return a value
}

function findItem(id: string): Item | undefined {
  return items.get(id);
  // Explicitly returns undefined when not found
}

// Never for functions that don't return
function fail(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {
    // ...
  }
}
```

**Rules:**

- All public API functions should have explicit return types
- Use `void` for side-effect functions that return nothing
- Use `undefined` (not `null`) for "not found" returns
- Use `never` for functions that throw or never return

## Generic Constraints

Flexible but type-safe generic functions.

```typescript
// Constrain generic to specific shape
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Constrain to objects with specific methods
interface Serializable {
  serialize(): string;
}

function save<T extends Serializable>(item: T): void {
  const data = item.serialize();
  // ...
}

// Default generic parameters
function createArray<T = string>(length: number, fill: T): T[] {
  return Array(length).fill(fill);
}

createArray(3, "x"); // Type: string[]
createArray<number>(3, 0); // Type: number[]

// Multiple constraints with intersection
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}
```

## Zod Schema Integration

Keep types and runtime validation in sync.

```typescript
import { z } from "zod";

// Define schema once, infer type from it
const ConfigOptionsSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  dco: z.boolean().optional(),
  scopes: z.array(z.string()).optional(),
});

// Infer TypeScript type from schema - single source of truth
type ConfigOptions = z.infer<typeof ConfigOptionsSchema>;

// Use schema for validation
function createConfig(options: unknown): Config {
  const validated = ConfigOptionsSchema.parse(options);
  // validated is now typed as ConfigOptions
  return buildConfig(validated);
}

// Export both schema and type for consumers
export { ConfigOptionsSchema };
export type { ConfigOptions };
```

**Rules:**

- Define Zod schema first, infer type from it (not the other way around)
- Export both schema and inferred type
- Use `.parse()` for validation that throws, `.safeParse()` for Result-style
- Don't duplicate validation logic outside the schema
