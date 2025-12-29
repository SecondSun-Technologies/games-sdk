/**
 * @fileoverview Branded Types for Type-Safe Identifiers
 * @module @secondsun/games-sdk/types/branded
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PHILOSOPHY: Branded types create nominal typing in TypeScript's structural
 * type system. A SessionId is NOT just a string—it's a verified, validated
 * identifier that has passed through a runtime validator.
 *
 * WHY THIS MATTERS:
 * - SessionId cannot be accidentally assigned where LevelId is expected
 * - The compiler catches category errors that would silently corrupt data
 * - Runtime validation at boundaries ensures the brand is EARNED, not assumed
 *
 * CRITICAL RULE: Branded values are ONLY constructed via runtime validators.
 * Games cannot cast their way to a Difficulty—they must earn it through
 * the createDifficulty() function.
 *
 * GOVERNANCE: Direct casting to branded types (e.g., `as Difficulty`, `as SessionId`)
 * is considered a BUG. PRs using direct casts will not be accepted. The ESLint
 * culture and code review process enforce this—TypeScript cannot prevent `as`
 * syntactically, so we close the gap with tooling and culture.
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unique symbol used to brand types. This is never actually accessed at runtime—
 * it exists purely for the type system to distinguish branded types.
 *
 * @internal
 */
declare const __brand: unique symbol;

/**
 * Creates a branded type by intersecting a base type with a branded marker.
 * The brand makes the type nominally different from its base type.
 *
 * @example
 * type UserId = Brand<string, 'UserId'>;
 * type PostId = Brand<string, 'PostId'>;
 *
 * // These are now incompatible:
 * const userId: UserId = createUserId('123');
 * const postId: PostId = userId; // ❌ Type error!
 *
 * @template TBase - The underlying primitive type (string, number, etc.)
 * @template TBrand - A unique string literal to distinguish this brand
 */
export type Brand<TBase, TBrand extends string> = TBase & {
    readonly [__brand]: TBrand;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE BRANDED TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unique identifier for a game session.
 *
 * Sessions are created by the PLATFORM, not the game. The game receives
 * a SessionId in its context and uses it to correlate all events.
 *
 * @example
 * // In game code, you receive this from context:
 * const { sessionId } = context; // SessionId
 *
 * // NOT allowed - games cannot create sessions:
 * const fakeSession = 'abc' as SessionId; // ❌ Don't do this
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Unique identifier for a game level.
 *
 * Level identifiers must be STABLE across game versions. Once a level
 * is published, its ID should never change. This enables:
 * - Progression tracking across sessions
 * - Analytics comparison across game versions
 * - Save state restoration
 */
export type LevelId = Brand<string, 'LevelId'>;

/**
 * Difficulty rating (1-10).
 *
 * This is a CLAIM by the game, not an authority. The platform will compare
 * claimed difficulty against actual player performance to detect:
 * - Miscalibrated games
 * - Games that lie about difficulty
 * - Difficulty drift over time
 *
 * WHY Brand<number> INSTEAD OF 1 | 2 | ... | 10:
 * - Difficulty is data crossing a boundary—it needs runtime validation anyway
 * - Branded numbers compose better with analytics math (averages, comparisons)
 * - Literal unions would still need runtime validation for untrusted input
 * - The validator is the single source of truth, not the type
 *
 * @example
 * // Correct: use the validator
 * const difficulty = createDifficulty(7);
 *
 * // FORBIDDEN: direct casting is a bug and will not pass code review
 * const fake = 7 as Difficulty; // ❌ Never do this
 */
export type Difficulty = Brand<number, 'Difficulty'>;

/**
 * Unix timestamp in milliseconds.
 *
 * All timestamps in the SDK are in milliseconds since Unix epoch.
 * This provides sufficient precision for reaction time measurements
 * while being compatible with JavaScript's Date.now().
 */
export type Timestamp = Brand<number, 'Timestamp'>;

/**
 * Duration in milliseconds.
 *
 * Used for measuring time intervals (session length, level duration, etc.).
 * Always positive; validated at creation time.
 */
export type DurationMs = Brand<number, 'DurationMs'>;

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base class for all branded type validation errors.
 * Provides consistent error handling across the SDK.
 */
export class BrandedTypeError extends Error {
    public readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'BrandedTypeError';
        this.code = code;
        // Maintains proper stack trace in V8 environments
        // Use type assertion for V8-specific API
        const ErrorWithCapture = Error as typeof Error & {
            captureStackTrace?: (target: object, constructor: new (...args: unknown[]) => unknown) => void;
        };
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- V8-only API, check needed at runtime
        if (ErrorWithCapture.captureStackTrace !== undefined) {
            ErrorWithCapture.captureStackTrace(this, this.constructor as new (...args: unknown[]) => unknown);
        }
    }
}

/**
 * Thrown when an invalid difficulty value is provided.
 */
export class InvalidDifficultyError extends BrandedTypeError {
    public readonly providedValue: unknown;

    constructor(value: unknown) {
        super(
            `Invalid difficulty: ${String(value)}. Must be an integer between 1 and 10.`,
            'INVALID_DIFFICULTY'
        );
        this.name = 'InvalidDifficultyError';
        this.providedValue = value;
    }
}

/**
 * Thrown when an invalid session ID is provided.
 */
export class InvalidSessionIdError extends BrandedTypeError {
    public readonly providedValue: unknown;

    constructor(value: unknown) {
        super(
            `Invalid session ID: ${String(value)}. Must be a non-empty string.`,
            'INVALID_SESSION_ID'
        );
        this.name = 'InvalidSessionIdError';
        this.providedValue = value;
    }
}

/**
 * Thrown when an invalid level ID is provided.
 */
export class InvalidLevelIdError extends BrandedTypeError {
    public readonly providedValue: unknown;

    constructor(value: unknown) {
        super(
            `Invalid level ID: ${String(value)}. Must be a non-empty string.`,
            'INVALID_LEVEL_ID'
        );
        this.name = 'InvalidLevelIdError';
        this.providedValue = value;
    }
}

/**
 * Thrown when an invalid timestamp is provided.
 */
export class InvalidTimestampError extends BrandedTypeError {
    public readonly providedValue: unknown;

    constructor(value: unknown) {
        super(
            `Invalid timestamp: ${String(value)}. Must be a positive integer.`,
            'INVALID_TIMESTAMP'
        );
        this.name = 'InvalidTimestampError';
        this.providedValue = value;
    }
}

/**
 * Thrown when an invalid duration is provided.
 */
export class InvalidDurationError extends BrandedTypeError {
    public readonly providedValue: unknown;

    constructor(value: unknown) {
        super(
            `Invalid duration: ${String(value)}. Must be a non-negative integer.`,
            'INVALID_DURATION'
        );
        this.name = 'InvalidDurationError';
        this.providedValue = value;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUNTIME VALIDATORS (The ONLY way to create branded types)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a validated Difficulty value.
 *
 * This is the ONLY way to create a Difficulty. Direct casting is forbidden
 * because it bypasses validation. The platform uses this at the boundary
 * when games emit events, ensuring all difficulty claims are valid.
 *
 * @param value - The raw number to validate and brand
 * @returns A branded Difficulty value
 * @throws {InvalidDifficultyError} If value is not an integer between 1 and 10
 *
 * @example
 * const easy = createDifficulty(3);    // ✅ Valid
 * const hard = createDifficulty(9);    // ✅ Valid
 * const invalid = createDifficulty(0); // ❌ Throws
 * const invalid = createDifficulty(11); // ❌ Throws
 * const invalid = createDifficulty(5.5); // ❌ Throws
 */
export function createDifficulty(value: number): Difficulty {
    if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 10
    ) {
        throw new InvalidDifficultyError(value);
    }
    return value as Difficulty;
}

/**
 * Creates a validated SessionId.
 *
 * While games typically receive SessionIds from the platform context
 * rather than creating them, this validator is used internally by the
 * platform when creating new sessions.
 *
 * @param value - The raw string to validate and brand
 * @returns A branded SessionId value
 * @throws {InvalidSessionIdError} If value is not a non-empty string
 *
 * @example
 * const sessionId = createSessionId('abc-123-def'); // ✅ Valid
 * const invalid = createSessionId('');              // ❌ Throws
 * const invalid = createSessionId(null);            // ❌ Throws
 */
export function createSessionId(value: string): SessionId {
    if (typeof value !== 'string' || value.length === 0) {
        throw new InvalidSessionIdError(value);
    }
    return value as SessionId;
}

/**
 * Creates a validated LevelId.
 *
 * Level IDs should be stable, meaningful identifiers that don't change
 * across game versions. Good: 'level-1', 'tutorial', 'boss-final'.
 * Bad: random UUIDs that change each build.
 *
 * @param value - The raw string to validate and brand
 * @returns A branded LevelId value
 * @throws {InvalidLevelIdError} If value is not a non-empty string
 *
 * @example
 * const levelId = createLevelId('memory-match-easy-1'); // ✅ Valid
 * const invalid = createLevelId('');                     // ❌ Throws
 */
export function createLevelId(value: string): LevelId {
    if (typeof value !== 'string' || value.length === 0) {
        throw new InvalidLevelIdError(value);
    }
    return value as LevelId;
}

/**
 * Creates a validated Timestamp (current time if not provided).
 *
 * IMPORTANT: Games should NEVER call this function directly.
 * Timestamps are automatically injected by the SDK on event emission.
 * This function exists for internal SDK use and platform integration only.
 *
 * If you find yourself calling createTimestamp() in game code, you're
 * doing something wrong—the SDK handles all timing automatically.
 *
 * @param value - Optional timestamp value. Defaults to Date.now()
 * @returns A branded Timestamp value
 * @throws {InvalidTimestampError} If value is not a positive integer
 *
 * @internal This is primarily for SDK internal use
 *
 * @example
 * // SDK internal use:
 * const now = createTimestamp();              // ✅ Current time
 * const past = createTimestamp(1609459200000); // ✅ Specific time
 *
 * // Game code should NEVER do this:
 * emit({ ...event, timestamp: createTimestamp() }); // ❌ Wrong!
 * // The SDK injects timestamps automatically
 */
export function createTimestamp(value?: number): Timestamp {
    const ts = value ?? Date.now();
    if (typeof ts !== 'number' || !Number.isInteger(ts) || ts < 0) {
        throw new InvalidTimestampError(ts);
    }
    return ts as Timestamp;
}

/**
 * Creates a validated DurationMs.
 *
 * Durations must be non-negative. Zero is valid (instantaneous events).
 *
 * @param value - The raw number to validate and brand
 * @returns A branded DurationMs value
 * @throws {InvalidDurationError} If value is not a non-negative integer
 *
 * @example
 * const duration = createDuration(5000); // ✅ 5 seconds
 * const instant = createDuration(0);     // ✅ Instantaneous
 * const invalid = createDuration(-100);  // ❌ Throws
 */
export function createDuration(value: number): DurationMs {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        throw new InvalidDurationError(value);
    }
    return value as DurationMs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE GUARDS (For runtime type checking at boundaries)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Type guard for checking if a value could be a valid difficulty.
 * Does NOT brand the value—use createDifficulty() for that.
 *
 * @param value - Unknown value to check
 * @returns True if value is a valid difficulty number
 */
export function isValidDifficulty(value: unknown): value is number {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 10
    );
}

/**
 * Type guard for checking if a value could be a valid session ID.
 * Does NOT brand the value—use createSessionId() for that.
 *
 * @param value - Unknown value to check
 * @returns True if value is a non-empty string
 */
export function isValidSessionId(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for checking if a value could be a valid level ID.
 * Does NOT brand the value—use createLevelId() for that.
 *
 * @param value - Unknown value to check
 * @returns True if value is a non-empty string
 */
export function isValidLevelId(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for checking if a value could be a valid timestamp.
 * Does NOT brand the value—use createTimestamp() for that.
 *
 * @param value - Unknown value to check
 * @returns True if value is a positive integer
 */
export function isValidTimestamp(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Type guard for checking if a value could be a valid duration.
 * Does NOT brand the value—use createDuration() for that.
 *
 * @param value - Unknown value to check
 * @returns True if value is a non-negative integer
 */
export function isValidDuration(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
