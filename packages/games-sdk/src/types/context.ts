/**
 * @fileoverview Game Context Types
 * @module @secondsun/games-sdk/types/context
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PHILOSOPHY: GameContext is IMMUTABLE. Games receive this as a snapshot
 * of the world at render time.
 *
 * WHY IMMUTABLE:
 * - Games cannot silently corrupt platform state
 * - All mutations go through the event system
 * - Platform decides whether and how to apply changes
 *
 * This is the "tell me about the world" contract. Games observe and respond;
 * they do not mutate.
 *
 * SESSION LIFECYCLE OWNERSHIP:
 * - PLATFORM owns: Session creation, ID generation, termination, timeout handling
 * - GAME owns: Emitting SESSION_STARTED acknowledgment, gameplay events, SESSION_ENDED
 * - SHARED: Abort handling (platform may force-abort, game should emit SESSION_ABORTED)
 *
 * If platform terminates a session, game events after termination are silently dropped.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { type SessionId, type Timestamp, type DurationMs } from './branded.js';
import { type GameMetadata } from './metadata.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT STATES (Discriminated Union)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The complete game context.
 *
 * This is a discriminated union based on the 'state' field. Each state
 * provides different data, and TypeScript enforces that you handle each
 * state appropriately.
 *
 * WHY DISCRIMINATED UNIONS:
 * - Impossible to access sessionId before a session starts
 * - TypeScript exhaustive checking ensures all states are handled
 * - No runtime "undefined" checks scattered through game code
 *
 * @example
 * function render(context: GameContext) {
 *   switch (context.state) {
 *     case 'INITIAL':
 *       return <WelcomeScreen />;
 *     case 'IN_SESSION':
 *       // TypeScript knows sessionId exists here
 *       return <Game sessionId={context.sessionId} />;
 *     case 'ENDED':
 *       return <ResultsScreen sessionId={context.sessionId} />;
 *   }
 * }
 */
export type GameContext =
    | InitialContext
    | InSessionContext
    | SessionEndedContext;

/**
 * Before a session starts.
 *
 * The game sees its metadata loaded but no session-specific data yet.
 * Use this state to show a welcome screen, instructions, or loading UI.
 *
 * PLATFORM → GAME: "Here's your metadata. When you're ready, I'll start a session."
 */
export interface InitialContext {
    /** Discriminant for the INITIAL state */
    readonly state: 'INITIAL';

    /** The game's static metadata */
    readonly metadata: GameMetadata;

    /** User's accessibility preferences */
    readonly accessibilityPrefs: AccessibilityPrefs;

    /** Current theme mode */
    readonly themeMode: ThemeMode;

    /** Organization-specific configuration */
    readonly orgConfig: OrgConfig;
}

/**
 * Active session state.
 *
 * This is where the game spends most of its time. The session has been
 * created by the platform, and the game has full context to render gameplay.
 *
 * PLATFORM → GAME: "Session is active. Here's everything you need."
 */
export interface InSessionContext {
    /** Discriminant for the IN_SESSION state */
    readonly state: 'IN_SESSION';

    /** Platform-generated unique identifier for this session */
    readonly sessionId: SessionId;

    /** When the session started (platform-provided timestamp) */
    readonly startTime: Timestamp;

    /** The game's static metadata */
    readonly metadata: GameMetadata;

    /** Current progression data for this user in this game */
    readonly progression: ProgressionSnapshot;

    /** User's accessibility preferences */
    readonly accessibilityPrefs: AccessibilityPrefs;

    /** Current theme mode */
    readonly themeMode: ThemeMode;

    /** Organization-specific configuration */
    readonly orgConfig: OrgConfig;

    /**
     * Opaque game state blob from the previous session.
     *
     * This is returned VERBATIM from the last SAVE_GAME_STATE event.
     * The SDK never interprets or validates this blob—that's the game's
     * responsibility using stateSchemaVersion.
     *
     * May be undefined if:
     * - This is the first session
     * - The platform cleared state
     * - The state was corrupted and discarded
     *
     * Games should always handle undefined gracefully.
     */
    readonly savedGameState: unknown;
}

/**
 * After session has ended.
 *
 * The session is complete. The game can show results, but cannot emit
 * gameplay events. Only cleanup and transition events are valid.
 *
 * PLATFORM → GAME: "Session is over. Show results if you want."
 */
export interface SessionEndedContext {
    /** Discriminant for the ENDED state */
    readonly state: 'ENDED';

    /** The session that just ended (for result display) */
    readonly sessionId: SessionId;

    /** Final session duration */
    readonly sessionDurationMs: DurationMs;

    /** Summary of session performance (if available) */
    readonly sessionSummary?: SessionSummary;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Progression snapshot for a user in a specific game.
 *
 * This is READ-ONLY. Games cannot directly modify progression;
 * they emit events, and the platform derives progression from those events.
 */
export interface ProgressionSnapshot {
    /** Current level the user has reached */
    readonly currentLevel: number;

    /** Total number of levels in the game (if applicable) */
    readonly totalLevels?: number;

    /** Number of sessions played in this game */
    readonly sessionsPlayed: number;

    /** Total time spent in this game across all sessions */
    readonly totalPlayTimeMs: DurationMs;

    /** User's best performance metrics (game-specific) */
    readonly bestScores?: Readonly<Record<string, number>>;

    /** Number of times the user has completed the game */
    readonly completionCount: number;
}

/**
 * Accessibility preferences set by the user.
 *
 * Games MUST respect these preferences. The platform may reject games
 * that don't properly implement accessibility.
 */
export interface AccessibilityPrefs {
    /** Whether to reduce motion/animations */
    readonly reduceMotion: boolean;

    /** Whether to increase contrast */
    readonly highContrast: boolean;

    /** User's preferred font size multiplier (1.0 = default) */
    readonly fontScale: number;

    /** Whether screen reader is active */
    readonly screenReaderActive: boolean;

    /** Whether to prefer larger touch targets */
    readonly largerTouchTargets: boolean;

    /** Whether to enable color blind mode and which type */
    readonly colorBlindMode: ColorBlindMode;
}

/**
 * Color blind mode options.
 */
export type ColorBlindMode =
    | 'none'
    | 'protanopia'   // Red-blind
    | 'deuteranopia' // Green-blind
    | 'tritanopia';  // Blue-blind

/**
 * Theme mode (light/dark).
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Organization-specific configuration.
 *
 * Organizations (e.g., healthcare providers) can configure how games
 * behave within their deployment.
 */
export interface OrgConfig {
    /** Organization's display name */
    readonly orgName: string;

    /** Optional brand color (hex format) */
    readonly brandColor?: string;

    /** Whether to show competitive features (leaderboards, etc.) */
    readonly enableCompetitiveFeatures: boolean;

    /** Maximum session duration override (may be shorter than game default) */
    readonly maxSessionDurationMs?: DurationMs;

    /** Custom labels for difficulty levels */
    readonly difficultyLabels?: Readonly<Record<number, string>>;
}

/**
 * Summary of a completed session.
 *
 * This is computed by the platform after the session ends, based on
 * the events the game emitted.
 */
export interface SessionSummary {
    /** Total active time (excluding pauses) */
    readonly activeTimeMs: DurationMs;

    /** Number of levels attempted */
    readonly levelsAttempted: number;

    /** Number of levels completed */
    readonly levelsCompleted: number;

    /** Overall performance rating (platform-computed) */
    readonly performanceRating?: number;

    /** Whether the user improved compared to previous sessions */
    readonly showedImprovement?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Type guard for InitialContext.
 */
export function isInitialContext(context: GameContext): context is InitialContext {
    return context.state === 'INITIAL';
}

/**
 * Type guard for InSessionContext.
 */
export function isInSessionContext(context: GameContext): context is InSessionContext {
    return context.state === 'IN_SESSION';
}

/**
 * Type guard for SessionEndedContext.
 */
export function isSessionEndedContext(context: GameContext): context is SessionEndedContext {
    return context.state === 'ENDED';
}

/**
 * Asserts that a context is InSessionContext.
 * Useful when you know you're in a session and want cleaner code.
 *
 * @throws {Error} If context is not InSessionContext
 */
export function assertInSession(context: GameContext): asserts context is InSessionContext {
    if (context.state !== 'IN_SESSION') {
        throw new Error(
            `Expected IN_SESSION context, got ${context.state}. ` +
            `This function should only be called during active gameplay.`
        );
    }
}
