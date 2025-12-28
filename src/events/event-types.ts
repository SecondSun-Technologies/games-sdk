/**
 * @fileoverview Game Event Type Definitions
 * @module @secondsun/games-sdk/events/event-types
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * CORE PRINCIPLE: Games do not log conclusions—they log observations.
 *
 * NOT: "user improved", "this was hard", "award points"
 * BUT: what happened, when it happened, under what conditions, how long it took
 *
 * You interpret. The game reports facts.
 *
 * WHY DISCRIMINATED UNIONS:
 * - Exhaustive switch checking prevents missed cases
 * - No runtime polymorphism surprises
 * - Adding a new event type causes compile errors everywhere that needs to handle it
 *
 * WHY NOT INHERITANCE:
 * - class GameEvent { type: string } is an escape hatch
 * - Subclasses can violate contracts silently
 * - Unions are closed; classes are open
 *
 * EVENT EMISSION CONTRACT:
 * - emit() is FIRE-AND-FORGET
 * - Returns void, never a Promise
 * - Never throws (errors are logged internally)
 * - Never blocks game execution
 * - Game cannot know if event was processed
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
    type SessionId,
    type LevelId,
    type Difficulty,
    type Timestamp,
    type DurationMs,
} from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THE COMPLETE EVENT VOCABULARY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ALL game events defined as a discriminated union.
 *
 * This is the complete vocabulary games can speak. If an event isn't
 * in this union, games cannot emit it.
 *
 * EVENT BUDGET GUIDELINE:
 * - 10-50 events per session → healthy
 * - 100+ events → suspicious (too chatty)
 * - 1-2 events → useless (not enough signal)
 *
 * You want signal, not telemetry diarrhea.
 */
export type GameEvent =
    // ─── Session Lifecycle (non-negotiable) ────────────────────────────────
    | SessionStartedEvent
    | SessionEndedEvent
    | SessionAbortedEvent

    // ─── Progression (the backbone) ────────────────────────────────────────
    | LevelStartedEvent
    | LevelCompletedEvent
    | LevelFailedEvent
    | CheckpointReachedEvent

    // ─── Performance (never a single "score") ──────────────────────────────
    | PerformanceReportedEvent

    // ─── Time-on-task (effort gold) ────────────────────────────────────────
    | ActiveTimeReportedEvent

    // ─── Difficulty & Friction (claims, not authority) ─────────────────────
    | FrictionReportedEvent

    // ─── Error & Failure (quietly powerful) ────────────────────────────────
    | ErrorMadeEvent
    | FailureOccurredEvent

    // ─── State Persistence (opaque, namespaced) ────────────────────────────
    | SaveGameStateEvent

    // ─── User Signals (carefully optional) ─────────────────────────────────
    | UserSignalEvent

    // ─── Dev-only (invisible in prod) ──────────────────────────────────────
    | DevLogEvent;

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION LIFECYCLE EVENTS
// Every game session should emit these automatically or semi-automatically.
// This gives you: engagement, drop-off, rage quits, session length distributions
//
// OWNERSHIP RULE: The platform is the SOURCE OF TRUTH for session lifecycle.
// Game-emitted SESSION_* events are acknowledgments and summaries, NOT authority.
// A game cannot "end a session early" via events—the platform decides when
// sessions truly start and end. Games report what they observed.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Emitted when the game acknowledges session start.
 *
 * The platform CREATES the session; the game ACKNOWLEDGES it.
 * This distinction matters for ownership clarity.
 */
export interface SessionStartedEvent {
    readonly type: 'SESSION_STARTED';
    /** Platform-provided session ID (from context) */
    readonly sessionId: SessionId;
}

/**
 * Emitted when a session completes normally.
 */
export interface SessionEndedEvent {
    readonly type: 'SESSION_ENDED';
    readonly sessionId: SessionId;
    /** Why did the session end? */
    readonly reason: SessionEndReason;
    /** Total duration of the session */
    readonly totalDurationMs: DurationMs;
}

/**
 * Reasons a session can end normally.
 */
export type SessionEndReason =
    /** User completed the game/session goal */
    | 'completed'
    /** User chose to exit */
    | 'user_exit'
    /** Session timed out (platform-enforced limit) */
    | 'timeout';

/**
 * Emitted when a session is aborted abnormally.
 */
export interface SessionAbortedEvent {
    readonly type: 'SESSION_ABORTED';
    readonly sessionId: SessionId;
    /** Why was the session aborted? */
    readonly reason: SessionAbortReason;
    /** Duration before abort */
    readonly durationBeforeAbortMs: DurationMs;
}

/**
 * Reasons a session can be aborted.
 */
export type SessionAbortReason =
    /** App crashed or unrecoverable error */
    | 'crash'
    /** User force-closed the app */
    | 'force_close'
    /** Platform force-terminated (e.g., low memory) */
    | 'platform_termination'
    /** Network error prevented continuation */
    | 'network_error';

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESSION EVENTS
// These describe where the user is in the game.
// Powers: progression tracking, effort estimation, fairness checks
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Emitted when a level/round/stage begins.
 */
export interface LevelStartedEvent {
    readonly type: 'LEVEL_STARTED';
    /** Stable level identifier (must not change across versions) */
    readonly levelId: LevelId;
    /** Which attempt is this? (1 = first try) */
    readonly attemptNumber: number;
    /** Game-claimed difficulty (platform will verify against outcomes) */
    readonly difficulty: Difficulty;
}

/**
 * Emitted when a level is completed successfully.
 *
 * Note: No "score" field. Games report raw observations.
 * The platform derives "score" from these facts.
 */
export interface LevelCompletedEvent {
    readonly type: 'LEVEL_COMPLETED';
    readonly levelId: LevelId;
    readonly attemptNumber: number;
    /** How long did this attempt take? */
    readonly durationMs: DurationMs;
    readonly difficulty: Difficulty;
}

/**
 * Emitted when a level attempt fails.
 */
export interface LevelFailedEvent {
    readonly type: 'LEVEL_FAILED';
    readonly levelId: LevelId;
    readonly attemptNumber: number;
    /** How long before failure? */
    readonly durationMs: DurationMs;
    readonly difficulty: Difficulty;
    /** Why did the user fail? */
    readonly failureReason?: LevelFailureReason;
}

/**
 * Reasons a level can fail.
 */
export type LevelFailureReason =
    /** Ran out of time */
    | 'timeout'
    /** Too many errors */
    | 'too_many_errors'
    /** User gave up */
    | 'user_quit'
    /** Other game-specific reason */
    | 'other';

/**
 * Emitted when a checkpoint within a level is reached.
 * Useful for long levels to track partial progress.
 */
export interface CheckpointReachedEvent {
    readonly type: 'CHECKPOINT_REACHED';
    readonly levelId: LevelId;
    /** Identifier for this checkpoint within the level */
    readonly checkpointId: string;
    /** Time since level started */
    readonly elapsedMs: DurationMs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE EVENTS
// Performance is MULTI-DIMENSIONAL, not a single number.
// Platform decides which dimensions matter for this user.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reports multi-dimensional performance metrics.
 *
 * All fields are optional—different games measure different things.
 * Emit what makes sense for your game.
 *
 * ANTI-ABUSE NOTE: Games should emit performance events at meaningful
 * boundaries (level completion, round end, session summary), NOT continuously.
 * Continuous performance telemetry is a sign of bad game design, not
 * good instrumentation.
 *
 * NEVER include a single "score" field. The platform computes
 * composite scores from these raw observations.
 */
export interface PerformanceReportedEvent {
    readonly type: 'PERFORMANCE_REPORTED';

    /** 0-1, proportion of correct responses */
    readonly accuracy?: number;

    /** Central tendency of reaction times in milliseconds */
    readonly reactionTimeMs?: number;

    /** Count of errors/mistakes made */
    readonly errorCount?: number;

    /** Count of hints or assists used */
    readonly hintsUsed?: number;

    /** Longest consecutive success streak */
    readonly streakLength?: number;

    /** Success rate as 0-1 proportion */
    readonly successRate?: number;

    /** Number of items/trials completed */
    readonly itemsCompleted?: number;

    /** Optional context: which level/round this applies to */
    readonly levelId?: LevelId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME-ON-TASK EVENTS
// Time is one of the few universal currencies.
// Huge for: effort modeling, abuse detection, fair comparisons
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reports active engagement time.
 *
 * Games that don't report this get less trust. Simple.
 */
export interface ActiveTimeReportedEvent {
    readonly type: 'ACTIVE_TIME_REPORTED';

    /** Time user was actively engaged */
    readonly activeDurationMs: DurationMs;

    /** Time user was idle (if detectable) */
    readonly idleDurationMs?: DurationMs;

    /** Number of pauses during this period */
    readonly pausesCount?: number;

    /** Optional: which level this applies to */
    readonly levelId?: LevelId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRICTION EVENTS
// Let games describe friction without letting them define it.
// Platform compares claims to actual outcomes.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reports friction/difficulty signals.
 *
 * These are CLAIMS by the game. The platform will compare against:
 * - Completion rates
 * - Retries
 * - Time spent
 *
 * And quietly stop believing liars.
 */
export interface FrictionReportedEvent {
    readonly type: 'FRICTION_REPORTED';

    /** Game's claimed difficulty for this segment */
    readonly claimedDifficulty: Difficulty;

    /** What type of cognitive load? */
    readonly cognitiveLoadType: CognitiveLoadType;

    /** How many rule changes occurred? (confusion factor) */
    readonly ruleChangesCount?: number;

    /** How many elements to track simultaneously? */
    readonly simultaneousElementsCount?: number;

    /** Optional: which level this applies to */
    readonly levelId?: LevelId;
}

/**
 * Types of cognitive load a game can impose.
 */
export type CognitiveLoadType =
    | 'memory'
    | 'focus'
    | 'speed'
    | 'regulation'
    | 'planning'
    | 'mixed';

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR & FAILURE EVENTS
// Failure is more informative than success.
// Helps: tune difficulty, detect frustration, personalize suggestions
// Never shame users for failure. Just observe.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reports a single error/mistake.
 */
export interface ErrorMadeEvent {
    readonly type: 'ERROR_MADE';

    /** What kind of error? */
    readonly errorType: ErrorType;

    /** Optional: how many of this error type in current context */
    readonly count?: number;

    /** Optional: which level this occurred in */
    readonly levelId?: LevelId;

    /** Optional: structured context about the error */
    readonly context?: Readonly<Record<string, unknown>>;
}

/**
 * Types of errors users can make.
 */
export type ErrorType =
    /** Incorrect input/response */
    | 'wrong_input'
    /** Action took too long */
    | 'timeout'
    /** Violated game rules */
    | 'rule_violation'
    /** Missed a target/opportunity */
    | 'missed_target'
    /** Selected wrong item */
    | 'wrong_selection'
    /** Broke a sequence/pattern */
    | 'sequence_break';

/**
 * Reports a broader failure condition.
 */
export interface FailureOccurredEvent {
    readonly type: 'FAILURE_OCCURRED';

    /** What kind of failure? */
    readonly failureType: FailureType;

    /** How many errors led to this failure? */
    readonly errorCount?: number;

    /** Optional: which level */
    readonly levelId?: LevelId;
}

/**
 * Types of failure conditions.
 */
export type FailureType =
    /** Failed due to too many errors */
    | 'error_threshold'
    /** Failed due to running out of time */
    | 'time_expired'
    /** Failed due to resource depletion (lives, energy, etc.) */
    | 'resource_depleted'
    /** Failed due to invalid state */
    | 'invalid_state';

// ═══════════════════════════════════════════════════════════════════════════════
// STATE PERSISTENCE EVENTS
// Opaque, namespaced, game-specific memory.
// Platform stores verbatim; game owns schema and migration.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Requests saving game-specific state.
 *
 * SIZE CONSTRAINTS:
 * - Default limit: 10–50KB (sufficient for most game state)
 * - Platform-configurable per organization
 * - Larger sizes require explicit override and justification
 * - Must be JSON-serializable
 *
 * VERSIONING:
 * - Game must handle its own schema versioning/migration
 * - Use stateSchemaVersion in metadata
 *
 * The SDK validates size but NEVER interprets the blob.
 */
export interface SaveGameStateEvent {
    readonly type: 'SAVE_GAME_STATE';

    /**
     * The state to persist. This is returned verbatim next session.
     * Use JSON-serializable data only.
     */
    readonly stateBlob: unknown;

    /**
     * Schema version of this state blob.
     * Should match stateSchemaVersion in game metadata.
     * Used by the game for migration, not by the platform.
     */
    readonly schemaVersion: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER SIGNAL EVENTS
// Voluntary signals from user intent.
// Use sparingly, optionally, never to penalize.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reports a voluntary user signal.
 *
 * These are optional self-reports from users when the game offers them.
 * Pairs nicely with AI personalization systems.
 */
export interface UserSignalEvent {
    readonly type: 'USER_SIGNAL';

    /** What kind of signal? */
    readonly signalType: UserSignalType;

    /**
     * Value/intensity of the signal.
     *
     * EXPECTED RANGE: 0.0 to 1.0 (normalized intensity)
     * - 0 = lowest intensity / least agreement
     * - 1 = highest intensity / strongest agreement
     *
     * Platform will clamp out-of-range values and may ignore
     * obviously invalid submissions.
     */
    readonly value?: number;

    /** Optional: which level this applies to */
    readonly levelId?: LevelId;
}

/**
 * Types of user self-report signals.
 */
export type UserSignalType =
    /** User felt the content was too easy */
    | 'felt_easy'
    /** User felt the content was too hard */
    | 'felt_hard'
    /** User felt stressed/anxious */
    | 'felt_stressed'
    /** User felt calm/relaxed */
    | 'felt_calm'
    /** User wants to continue */
    | 'wants_more'
    /** User wants to stop */
    | 'wants_stop'
    /** User is enjoying the activity */
    | 'enjoying'
    /** User is frustrated */
    | 'frustrated';

// ═══════════════════════════════════════════════════════════════════════════════
// DEV-ONLY EVENTS
// Invisible in production. Exist to keep developers sane.
// Never reach analytics or rewards.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Development-only logging event.
 *
 * These are COMPLETELY STRIPPED in production:
 * - Never reach analytics
 * - Never affect rewards
 * - Never stored
 *
 * Use freely during development for debugging.
 */
export interface DevLogEvent {
    readonly type: 'DEV_LOG';

    /** Log message */
    readonly message: string;

    /** Optional structured data */
    readonly data?: Readonly<Record<string, unknown>>;

    /** Log level for filtering */
    readonly level?: 'debug' | 'info' | 'warn' | 'error';
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMITTED EVENT (with SDK-injected metadata)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * An event after SDK processing.
 *
 * The SDK automatically injects:
 * - timestamp: When the event was emitted
 * - sessionId: Current session (if in session)
 * - gameId: From game metadata
 *
 * Games emit raw GameEvent; platform receives EmittedEvent.
 */
export interface EmittedEvent {
    /** The original event from the game */
    readonly event: GameEvent;

    /** SDK-injected timestamp */
    readonly timestamp: Timestamp;

    /** SDK-injected session ID (if in session) */
    readonly sessionId?: SessionId;

    /** SDK-injected game ID */
    readonly gameId: string;

    /** SDK version that processed this event */
    readonly sdkVersion: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: assertNever for exhaustive checking
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ensures exhaustive handling of discriminated unions.
 *
 * Use in the default case of switch statements to catch
 * unhandled event types at compile time.
 *
 * @example
 * switch (event.type) {
 *   case 'SESSION_STARTED': ...
 *   case 'SESSION_ENDED': ...
 *   // If you miss a case, TypeScript errors here:
 *   default: assertNever(event);
 * }
 */
export function assertNever(x: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}
