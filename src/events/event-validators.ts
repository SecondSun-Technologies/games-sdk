/**
 * @fileoverview Event Validation System
 * @module @secondsun/games-sdk/events/event-validators
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * RUNTIME VALIDATION at the SDK boundary.
 *
 * WHY RUNTIME VALIDATION:
 * TypeScript types evaporate at runtime. A malicious or buggy game could send:
 * { type: 'LEVEL_COMPLETED', durationMs: -1 }
 *
 * PROD vs DEV BEHAVIOR:
 *
 * | Scenario           | DEV                          | PROD                    |
 * |--------------------|------------------------------|-------------------------|
 * | Invalid shape      | console.error + reject       | Silent drop             |
 * | Out-of-range value | console.warn + clamp         | Silent clamp            |
 * | Rate limit hit     | console.warn + drop          | Silent drop             |
 * | Size limit hit     | console.error + reject       | Silent drop             |
 * | Unknown event type | throw (catch bugs early)     | Silent drop             |
 *
 * DEV is loud so developers catch issues during development.
 * PROD is silent so bad games don't break user experience.
 *
 * This is FFI thinking: treat boundaries like foreign function calls.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
    type GameEvent,
    type SessionStartedEvent,
    type SessionEndedEvent,
    type SessionAbortedEvent,
    type LevelStartedEvent,
    type LevelCompletedEvent,
    type LevelFailedEvent,
    type CheckpointReachedEvent,
    type PerformanceReportedEvent,
    type ActiveTimeReportedEvent,
    type FrictionReportedEvent,
    type ErrorMadeEvent,
    type FailureOccurredEvent,
    type SaveGameStateEvent,
    type UserSignalEvent,
    type DevLogEvent,
} from './event-types.js';

import {
    isValidSessionId,
    isValidLevelId,
    isValidDifficulty,
    isValidDuration,
} from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION MODE
// ═══════════════════════════════════════════════════════════════════════════════

export type ValidationMode = 'production' | 'development';

/**
 * Result of event validation.
 *
 * NOTES ON WARNINGS:
 * Warnings are collected for non-fatal issues (e.g., values clamped to range).
 * Currently surfaced via:
 * - Dev console (console.warn in development mode)
 * - Future: Dev harness event inspector
 * - Future: SDK health analytics
 */
export interface ValidationResult {
    readonly valid: boolean;
    readonly event?: GameEvent;
    readonly errors: readonly string[];
    readonly warnings: readonly string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIZE LIMITS
// ═══════════════════════════════════════════════════════════════════════════════

/** Maximum size of a state blob in bytes (~1MB) */
const MAX_STATE_BLOB_SIZE = 1024 * 1024;

/** Maximum size of any single event in bytes (~64KB) */
const MAX_EVENT_SIZE = 64 * 1024;

// ═══════════════════════════════════════════════════════════════════════════════
// CLAMPING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CLAMPING POLICY:
 * - Analytics fields (accuracy, successRate, userSignal.value) → CLAMP to valid range
 * - Structural fields (IDs, types, counts) → REJECT if invalid
 *
 * Why clamp analytics:
 * - Minor floating-point artifacts (1.0000001) shouldn't reject events
 * - Platform analytics can handle clamped values
 * - Games get immediate feedback via warnings in dev mode
 *
 * Why reject structural:
 * - Invalid IDs break referential integrity
 * - Invalid types indicate game logic bugs
 * - Counts being wrong suggests deeper problems
 */

/**
 * Clamps a value to a range [min, max].
 * Returns undefined if value is not a number.
 */
function clampOptional(
    value: unknown,
    min: number,
    max: number
): { value: number; clamped: boolean } | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return undefined;
    }
    const clamped = Math.max(min, Math.min(max, value));
    return { value: clamped, clamped: clamped !== value };
}

/**
 * Clamps a non-negative value (floor at 0).
 * Returns undefined if value is not a valid number.
 */
function clampNonNegative(
    value: unknown
): { value: number; clamped: boolean } | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return undefined;
    }
    const clamped = Math.max(0, value);
    return { value: clamped, clamped: clamped !== value };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Thrown in development mode for unknown event types.
 * Never thrown in production—events are silently dropped.
 */
export class UnknownEventTypeError extends Error {
    public readonly eventType: string;

    constructor(eventType: string) {
        super(
            `Unknown event type: '${eventType}'. ` +
            `This is a bug—check that you're using a valid GameEvent type.`
        );
        this.name = 'UnknownEventTypeError';
        this.eventType = eventType;
    }
}

/**
 * Thrown when event validation fails.
 */
export class EventValidationError extends Error {
    public readonly eventType: string;
    public readonly errors: readonly string[];

    constructor(eventType: string, errors: readonly string[]) {
        super(
            `Invalid ${eventType} event: ${errors.join(', ')}`
        );
        this.name = 'EventValidationError';
        this.eventType = eventType;
        this.errors = errors;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates an event at the SDK boundary.
 *
 * @param event - Unknown value from game code
 * @param mode - Validation mode (affects error handling)
 * @returns Validation result with optional cleaned event
 */
export function validateEvent(
    event: unknown,
    mode: ValidationMode
): ValidationResult {
    // Basic shape check
    if (typeof event !== 'object' || event === null) {
        if (mode === 'development') {
            console.error('[SDK] Event must be an object:', event);
        }
        return { valid: false, errors: ['Event must be an object'], warnings: [] };
    }

    // Type field check
    if (!('type' in event) || typeof (event as Record<string, unknown>)['type'] !== 'string') {
        if (mode === 'development') {
            console.error('[SDK] Event missing type field:', event);
        }
        return { valid: false, errors: ['Event must have a string type field'], warnings: [] };
    }

    const eventType = (event as Record<string, unknown>)['type'] as string;

    // Size check
    const eventSize = estimateSize(event);
    if (eventSize > MAX_EVENT_SIZE) {
        if (mode === 'development') {
            console.error(`[SDK] Event too large: ${String(eventSize)} bytes (max: ${String(MAX_EVENT_SIZE)})`);
        }
        return { valid: false, errors: [`Event exceeds size limit (${String(eventSize)} > ${String(MAX_EVENT_SIZE)})`], warnings: [] };
    }

    // Dispatch to specific validators
    switch (eventType) {
        case 'SESSION_STARTED':
            return validateSessionStarted(event, mode);
        case 'SESSION_ENDED':
            return validateSessionEnded(event, mode);
        case 'SESSION_ABORTED':
            return validateSessionAborted(event, mode);
        case 'LEVEL_STARTED':
            return validateLevelStarted(event, mode);
        case 'LEVEL_COMPLETED':
            return validateLevelCompleted(event, mode);
        case 'LEVEL_FAILED':
            return validateLevelFailed(event, mode);
        case 'CHECKPOINT_REACHED':
            return validateCheckpointReached(event, mode);
        case 'PERFORMANCE_REPORTED':
            return validatePerformanceReported(event, mode);
        case 'ACTIVE_TIME_REPORTED':
            return validateActiveTimeReported(event, mode);
        case 'FRICTION_REPORTED':
            return validateFrictionReported(event, mode);
        case 'ERROR_MADE':
            return validateErrorMade(event, mode);
        case 'FAILURE_OCCURRED':
            return validateFailureOccurred(event, mode);
        case 'SAVE_GAME_STATE':
            return validateSaveGameState(event, mode);
        case 'USER_SIGNAL':
            return validateUserSignal(event, mode);
        case 'DEV_LOG':
            return validateDevLog(event, mode);
        default:
            if (mode === 'development') {
                throw new UnknownEventTypeError(eventType);
            }
            return { valid: false, errors: [`Unknown event type: ${eventType}`], warnings: [] };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIFIC VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

function validateSessionStarted(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (!isValidSessionId(e['sessionId'])) {
        errors.push('sessionId must be a non-empty string');
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid SESSION_STARTED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as SessionStartedEvent,
        errors: [],
        warnings: [],
    };
}

function validateSessionEnded(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (!isValidSessionId(e['sessionId'])) {
        errors.push('sessionId must be a non-empty string');
    }

    const validReasons = ['completed', 'user_exit', 'timeout'];
    if (!validReasons.includes(e['reason'] as string)) {
        errors.push(`reason must be one of: ${validReasons.join(', ')}`);
    }

    if (!isValidDuration(e['totalDurationMs'])) {
        errors.push('totalDurationMs must be a non-negative integer');
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid SESSION_ENDED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as SessionEndedEvent,
        errors: [],
        warnings: [],
    };
}

function validateSessionAborted(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (!isValidSessionId(e['sessionId'])) {
        errors.push('sessionId must be a non-empty string');
    }

    const validReasons = ['crash', 'force_close', 'platform_termination', 'network_error'];
    if (!validReasons.includes(e['reason'] as string)) {
        errors.push(`reason must be one of: ${validReasons.join(', ')}`);
    }

    if (!isValidDuration(e['durationBeforeAbortMs'])) {
        errors.push('durationBeforeAbortMs must be a non-negative integer');
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid SESSION_ABORTED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as SessionAbortedEvent,
        errors: [],
        warnings: [],
    };
}

function validateLevelStarted(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isValidLevelId(e['levelId'])) {
        errors.push('levelId must be a non-empty string');
    }

    if (typeof e['attemptNumber'] !== 'number' || e['attemptNumber'] < 1) {
        errors.push('attemptNumber must be a positive integer');
    }

    if (!isValidDifficulty(e['difficulty'])) {
        errors.push('difficulty must be an integer between 1 and 10');
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid LEVEL_STARTED:', errors);
        }
        return { valid: false, errors, warnings };
    }

    return {
        valid: true,
        event: event as LevelStartedEvent,
        errors: [],
        warnings,
    };
}

function validateLevelCompleted(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (!isValidLevelId(e['levelId'])) {
        errors.push('levelId must be a non-empty string');
    }

    if (typeof e['attemptNumber'] !== 'number' || e['attemptNumber'] < 1) {
        errors.push('attemptNumber must be a positive integer');
    }

    if (!isValidDuration(e['durationMs'])) {
        errors.push('durationMs must be a non-negative integer');
    }

    if (!isValidDifficulty(e['difficulty'])) {
        errors.push('difficulty must be an integer between 1 and 10');
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid LEVEL_COMPLETED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as LevelCompletedEvent,
        errors: [],
        warnings: [],
    };
}

function validateLevelFailed(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (!isValidLevelId(e['levelId'])) {
        errors.push('levelId must be a non-empty string');
    }

    if (typeof e['attemptNumber'] !== 'number' || e['attemptNumber'] < 1) {
        errors.push('attemptNumber must be a positive integer');
    }

    if (!isValidDuration(e['durationMs'])) {
        errors.push('durationMs must be a non-negative integer');
    }

    if (!isValidDifficulty(e['difficulty'])) {
        errors.push('difficulty must be an integer between 1 and 10');
    }

    // failureReason is optional but must be valid if present
    if (e['failureReason'] !== undefined) {
        const validReasons = ['timeout', 'too_many_errors', 'user_quit', 'other'];
        if (!validReasons.includes(e['failureReason'] as string)) {
            errors.push(`failureReason must be one of: ${validReasons.join(', ')}`);
        }
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid LEVEL_FAILED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as LevelFailedEvent,
        errors: [],
        warnings: [],
    };
}

function validateCheckpointReached(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (!isValidLevelId(e['levelId'])) {
        errors.push('levelId must be a non-empty string');
    }

    if (typeof e['checkpointId'] !== 'string' || e['checkpointId'].length === 0) {
        errors.push('checkpointId must be a non-empty string');
    }

    if (!isValidDuration(e['elapsedMs'])) {
        errors.push('elapsedMs must be a non-negative integer');
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid CHECKPOINT_REACHED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as CheckpointReachedEvent,
        errors: [],
        warnings: [],
    };
}

function validatePerformanceReported(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];
    const warnings: string[] = [];
    const cleanedEvent: Record<string, unknown> = { ...e };

    // Clamp 0-1 analytics fields (accuracy, successRate)
    if (e['accuracy'] !== undefined) {
        const result = clampOptional(e['accuracy'], 0, 1);
        if (result === undefined) {
            errors.push('accuracy must be a number');
        } else {
            cleanedEvent['accuracy'] = result.value;
            if (result.clamped) {
                warnings.push(`accuracy clamped to ${String(result.value)}`);
                if (mode === 'development') {
                    console.warn(`[SDK] accuracy clamped to ${String(result.value)}`);
                }
            }
        }
    }

    if (e['successRate'] !== undefined) {
        const result = clampOptional(e['successRate'], 0, 1);
        if (result === undefined) {
            errors.push('successRate must be a number');
        } else {
            cleanedEvent['successRate'] = result.value;
            if (result.clamped) {
                warnings.push(`successRate clamped to ${String(result.value)}`);
                if (mode === 'development') {
                    console.warn(`[SDK] successRate clamped to ${String(result.value)}`);
                }
            }
        }
    }

    // Non-negative fields - clamp instead of reject
    if (e['reactionTimeMs'] !== undefined) {
        const result = clampNonNegative(e['reactionTimeMs']);
        if (result === undefined) {
            errors.push('reactionTimeMs must be a number');
        } else {
            cleanedEvent['reactionTimeMs'] = result.value;
        }
    }

    if (e['errorCount'] !== undefined) {
        const result = clampNonNegative(e['errorCount']);
        if (result === undefined) {
            errors.push('errorCount must be a number');
        } else {
            cleanedEvent['errorCount'] = result.value;
        }
    }

    if (e['hintsUsed'] !== undefined) {
        const result = clampNonNegative(e['hintsUsed']);
        if (result === undefined) {
            errors.push('hintsUsed must be a number');
        } else {
            cleanedEvent['hintsUsed'] = result.value;
        }
    }

    if (e['streakLength'] !== undefined) {
        const result = clampNonNegative(e['streakLength']);
        if (result === undefined) {
            errors.push('streakLength must be a number');
        } else {
            cleanedEvent['streakLength'] = result.value;
        }
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid PERFORMANCE_REPORTED:', errors);
        }
        return { valid: false, errors, warnings };
    }

    return {
        valid: true,
        event: cleanedEvent as unknown as PerformanceReportedEvent,
        errors: [],
        warnings,
    };
}

function validateActiveTimeReported(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (!isValidDuration(e['activeDurationMs'])) {
        errors.push('activeDurationMs must be a non-negative integer');
    }

    if (e['idleDurationMs'] !== undefined && !isValidDuration(e['idleDurationMs'])) {
        errors.push('idleDurationMs must be a non-negative integer');
    }

    if (e['pausesCount'] !== undefined) {
        if (typeof e['pausesCount'] !== 'number' || e['pausesCount'] < 0) {
            errors.push('pausesCount must be a non-negative number');
        }
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid ACTIVE_TIME_REPORTED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as ActiveTimeReportedEvent,
        errors: [],
        warnings: [],
    };
}

function validateFrictionReported(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (!isValidDifficulty(e['claimedDifficulty'])) {
        errors.push('claimedDifficulty must be an integer between 1 and 10');
    }

    const validLoadTypes = ['memory', 'focus', 'speed', 'regulation', 'planning', 'mixed'];
    if (!validLoadTypes.includes(e['cognitiveLoadType'] as string)) {
        errors.push(`cognitiveLoadType must be one of: ${validLoadTypes.join(', ')}`);
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid FRICTION_REPORTED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as FrictionReportedEvent,
        errors: [],
        warnings: [],
    };
}

function validateErrorMade(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    const validErrorTypes = [
        'wrong_input', 'timeout', 'rule_violation',
        'missed_target', 'wrong_selection', 'sequence_break'
    ];
    if (!validErrorTypes.includes(e['errorType'] as string)) {
        errors.push(`errorType must be one of: ${validErrorTypes.join(', ')}`);
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid ERROR_MADE:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as ErrorMadeEvent,
        errors: [],
        warnings: [],
    };
}

function validateFailureOccurred(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    const validFailureTypes = [
        'error_threshold', 'time_expired', 'resource_depleted', 'invalid_state'
    ];
    if (!validFailureTypes.includes(e['failureType'] as string)) {
        errors.push(`failureType must be one of: ${validFailureTypes.join(', ')}`);
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid FAILURE_OCCURRED:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as FailureOccurredEvent,
        errors: [],
        warnings: [],
    };
}

function validateSaveGameState(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    // stateBlob is required but can be any JSON-serializable value
    if (!('stateBlob' in e)) {
        errors.push('stateBlob is required');
    } else {
        // Check size
        const blobSize = estimateSize(e['stateBlob']);
        if (blobSize > MAX_STATE_BLOB_SIZE) {
            errors.push(`stateBlob exceeds size limit (${String(blobSize)} > ${String(MAX_STATE_BLOB_SIZE)})`);
        }
    }

    if (typeof e['schemaVersion'] !== 'number' || e['schemaVersion'] < 1) {
        errors.push('schemaVersion must be a positive integer');
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid SAVE_GAME_STATE:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as SaveGameStateEvent,
        errors: [],
        warnings: [],
    };
}

function validateUserSignal(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];
    const warnings: string[] = [];
    const cleanedEvent: Record<string, unknown> = { ...e };

    const validSignalTypes = [
        'felt_easy', 'felt_hard', 'felt_stressed', 'felt_calm',
        'wants_more', 'wants_stop', 'enjoying', 'frustrated'
    ];
    if (!validSignalTypes.includes(e['signalType'] as string)) {
        errors.push(`signalType must be one of: ${validSignalTypes.join(', ')}`);
    }

    // Clamp value to 0-1 range (per event-types.ts doc)
    if (e['value'] !== undefined) {
        const result = clampOptional(e['value'], 0, 1);
        if (result === undefined) {
            // Not a number - just omit it, don't reject
            delete cleanedEvent['value'];
            warnings.push('value was not a valid number, omitted');
        } else {
            cleanedEvent['value'] = result.value;
            if (result.clamped) {
                warnings.push(`value clamped to ${String(result.value)}`);
                if (mode === 'development') {
                    console.warn(`[SDK] USER_SIGNAL value clamped to ${String(result.value)}`);
                }
            }
        }
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid USER_SIGNAL:', errors);
        }
        return { valid: false, errors, warnings };
    }

    return {
        valid: true,
        event: cleanedEvent as unknown as UserSignalEvent,
        errors: [],
        warnings,
    };
}

function validateDevLog(event: unknown, mode: ValidationMode): ValidationResult {
    const e = event as Record<string, unknown>;
    const errors: string[] = [];

    if (typeof e['message'] !== 'string') {
        errors.push('message must be a string');
    }

    if (e['level'] !== undefined) {
        const validLevels = ['debug', 'info', 'warn', 'error'];
        if (!validLevels.includes(e['level'] as string)) {
            errors.push(`level must be one of: ${validLevels.join(', ')}`);
        }
    }

    if (errors.length > 0) {
        if (mode === 'development') {
            console.error('[SDK] Invalid DEV_LOG:', errors);
        }
        return { valid: false, errors, warnings: [] };
    }

    return {
        valid: true,
        event: event as DevLogEvent,
        errors: [],
        warnings: [],
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estimates the JSON size of a value in bytes.
 */
function estimateSize(value: unknown): number {
    try {
        return new TextEncoder().encode(JSON.stringify(value)).length;
    } catch {
        // If it can't be serialized, assume worst case
        return MAX_EVENT_SIZE + 1;
    }
}
