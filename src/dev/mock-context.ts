/**
 * @fileoverview Mock Context Generator for Development
 * @module @secondsun/games-sdk/dev/mock-context
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * Development tooling for generating mock GameContext objects.
 *
 * These are DEV-ONLY utilities. They are:
 * - Tree-shaken in production builds
 * - Never included in the main SDK bundle
 * - Only accessible via @secondsun/games-sdk/dev import
 *
 * Use these to test your game locally without the full platform.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
    type GameContext,
    type InitialContext,
    type InSessionContext,
    type SessionEndedContext,
    type AccessibilityPrefs,
    type OrgConfig,
    type ProgressionSnapshot,
    type SessionSummary,
} from '../types/context.js';
import { type GameMetadata } from '../types/metadata.js';
import { createSessionId, createTimestamp, createDuration } from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Default accessibility preferences (no accessibility needs).
 */
export const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPrefs = {
    reduceMotion: false,
    highContrast: false,
    fontScale: 1.0,
    screenReaderActive: false,
    largerTouchTargets: false,
    colorBlindMode: 'none',
};

/**
 * Accessibility preferences with all features enabled.
 * Useful for testing maximum accessibility mode.
 */
export const MAX_ACCESSIBILITY_PREFS: AccessibilityPrefs = {
    reduceMotion: true,
    highContrast: true,
    fontScale: 1.5,
    screenReaderActive: true,
    largerTouchTargets: true,
    colorBlindMode: 'protanopia',
};

/**
 * Default organization configuration.
 */
export const DEFAULT_ORG_CONFIG: OrgConfig = {
    orgName: 'Development Org',
    enableCompetitiveFeatures: true,
};

/**
 * Default progression snapshot for a new user.
 */
export const DEFAULT_PROGRESSION: ProgressionSnapshot = {
    currentLevel: 1,
    sessionsPlayed: 0,
    totalPlayTimeMs: createDuration(0),
    completionCount: 0,
};

/**
 * Progression for an experienced user (for testing advanced scenarios).
 */
export const EXPERIENCED_PROGRESSION: ProgressionSnapshot = {
    currentLevel: 10,
    totalLevels: 20,
    sessionsPlayed: 50,
    totalPlayTimeMs: createDuration(3600000), // 1 hour
    bestScores: { accuracy: 0.95, avgReactionTime: 350 },
    completionCount: 5,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK CONTEXT GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Options for generating mock context.
 */
export interface MockContextOptions {
    /** Custom accessibility preferences */
    accessibilityPrefs?: Partial<AccessibilityPrefs>;
    /** Custom org configuration */
    orgConfig?: Partial<OrgConfig>;
    /** Theme mode */
    themeMode?: 'light' | 'dark';
    /** Custom progression data (for InSessionContext) */
    progression?: Partial<ProgressionSnapshot>;
    /** Custom saved game state (for InSessionContext) */
    savedGameState?: unknown;
    /** Custom session summary (for SessionEndedContext) */
    sessionSummary?: Partial<SessionSummary>;
}

/**
 * Creates a mock InitialContext for testing pre-session UI.
 *
 * @param metadata - Game metadata
 * @param options - Optional customization
 * @returns Mock InitialContext
 *
 * @example
 * const context = createMockInitialContext(myGameMetadata);
 * render(<MyGame context={context} emit={mockEmit} />);
 */
export function createMockInitialContext(
    metadata: GameMetadata,
    options: MockContextOptions = {}
): InitialContext {
    return {
        state: 'INITIAL',
        metadata,
        accessibilityPrefs: {
            ...DEFAULT_ACCESSIBILITY_PREFS,
            ...options.accessibilityPrefs,
        },
        themeMode: options.themeMode ?? 'light',
        orgConfig: {
            ...DEFAULT_ORG_CONFIG,
            ...options.orgConfig,
        },
    };
}

/**
 * Creates a mock InSessionContext for testing active gameplay.
 *
 * @param metadata - Game metadata
 * @param options - Optional customization
 * @returns Mock InSessionContext
 *
 * @example
 * const context = createMockInSessionContext(myGameMetadata, {
 *   savedGameState: { level: 5, score: 1000 },
 * });
 * render(<MyGame context={context} emit={mockEmit} />);
 */
export function createMockInSessionContext(
    metadata: GameMetadata,
    options: MockContextOptions = {}
): InSessionContext {
    return {
        state: 'IN_SESSION',
        sessionId: createSessionId(`mock-session-${String(Date.now())}`),
        startTime: createTimestamp(),
        metadata,
        progression: {
            ...DEFAULT_PROGRESSION,
            ...options.progression,
            // Ensure DurationMs type for totalPlayTimeMs
            totalPlayTimeMs: createDuration(
                options.progression?.totalPlayTimeMs ?? 0
            ),
        } as ProgressionSnapshot,
        accessibilityPrefs: {
            ...DEFAULT_ACCESSIBILITY_PREFS,
            ...options.accessibilityPrefs,
        },
        themeMode: options.themeMode ?? 'light',
        orgConfig: {
            ...DEFAULT_ORG_CONFIG,
            ...options.orgConfig,
        },
        savedGameState: options.savedGameState,
    };
}

/**
 * Creates a mock SessionEndedContext for testing results screen.
 *
 * @param metadata - Game metadata (used to create session ID)
 * @param options - Optional customization
 * @returns Mock SessionEndedContext
 *
 * @example
 * const context = createMockSessionEndedContext(myGameMetadata, {
 *   sessionSummary: { levelsCompleted: 5 },
 * });
 * render(<MyGame context={context} emit={mockEmit} />);
 */
export function createMockSessionEndedContext(
    _metadata: GameMetadata,
    options: MockContextOptions = {}
): SessionEndedContext {
    const baseSummary: SessionSummary = {
        activeTimeMs: createDuration(300000), // 5 minutes
        levelsAttempted: 5,
        levelsCompleted: 4,
    };

    const context: SessionEndedContext = {
        state: 'ENDED',
        sessionId: createSessionId(`mock-session-ended-${String(Date.now())}`),
        sessionDurationMs: createDuration(360000), // 6 minutes
    };

    // Only add sessionSummary if we have data for it
    if (options.sessionSummary !== undefined) {
        return {
            ...context,
            sessionSummary: {
                ...baseSummary,
                ...options.sessionSummary,
                activeTimeMs: createDuration(
                    options.sessionSummary.activeTimeMs ?? 300000
                ),
            } as SessionSummary,
        };
    }

    return context;
}

/**
 * Creates a mock context based on the desired state.
 * Convenience function that dispatches to specific creators.
 *
 * @param state - Which context state to create
 * @param metadata - Game metadata
 * @param options - Optional customization
 * @returns Mock GameContext of the specified state
 */
export function createMockContext(
    state: 'INITIAL' | 'IN_SESSION' | 'ENDED',
    metadata: GameMetadata,
    options: MockContextOptions = {}
): GameContext {
    switch (state) {
        case 'INITIAL':
            return createMockInitialContext(metadata, options);
        case 'IN_SESSION':
            return createMockInSessionContext(metadata, options);
        case 'ENDED':
            return createMockSessionEndedContext(metadata, options);
    }
}
