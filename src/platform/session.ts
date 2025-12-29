/**
 * @fileoverview Session Lifecycle Driver
 * @module @secondsuntech/games-sdk/platform/session
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * SESSION DRIVER
 *
 * Platform-owned session lifecycle management.
 *
 * OWNERSHIP RULES:
 * - PLATFORM owns: session creation, ID generation, termination
 * - GAMES own: acknowledging lifecycle, emitting gameplay events
 *
 * Games cannot:
 * - Start sessions
 * - End sessions early
 * - Extend sessions
 *
 * Events emitted after termination are DROPPED.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { SessionId } from '../types/branded.js';
import type { SessionEndReason, SessionAbortReason } from '../events/event-types.js';
import type {
    GameContext,
    InitialContext,
    InSessionContext,
    SessionEndedContext,
    AccessibilityPrefs,
    ThemeMode,
    OrgConfig,
    ProgressionSnapshot,
} from '../types/context.js';
import type { GameMetadata } from '../types/metadata.js';
import { createTimestamp, createDuration } from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration for creating a session driver.
 */
export interface SessionDriverConfig {
    readonly metadata: GameMetadata;
    readonly accessibilityPrefs: AccessibilityPrefs;
    readonly themeMode: ThemeMode;
    readonly orgConfig: OrgConfig;
    readonly progression: ProgressionSnapshot;
    readonly savedGameState?: unknown;
    readonly nowMs: () => number;
}

/**
 * Session driver interface.
 *
 * Platform-owned lifecycle driver. Games receive context snapshots
 * but cannot directly mutate the lifecycle.
 */
export interface SessionDriver {
    /**
     * Get current context snapshot.
     * Returns a FROZEN object (new reference each call).
     */
    getContext(): Readonly<GameContext>;

    /**
     * Start a session (platform only).
     */
    startSession(sessionId: SessionId): void;

    /**
     * End session normally (platform only).
     * Uses typed SessionEndReason, not arbitrary strings.
     */
    endSession(reason: SessionEndReason): void;

    /**
     * Abort session abnormally (platform only).
     * Uses typed SessionAbortReason, not arbitrary strings.
     */
    abortSession(reason: SessionAbortReason): void;

    /**
     * Subscribe to context changes.
     * Returns unsubscribe function.
     */
    subscribe(listener: (context: GameContext) => void): () => void;

    /**
     * Check if session is active (events should be accepted).
     */
    isSessionActive(): boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a session driver.
 *
 * @param config - Session driver configuration
 * @returns Session driver instance
 */
export function createSessionDriver(config: SessionDriverConfig): SessionDriver {
    const { metadata, accessibilityPrefs, themeMode, orgConfig, progression, savedGameState, nowMs } = config;

    // Mutable state
    let currentState: 'INITIAL' | 'IN_SESSION' | 'ENDED' = 'INITIAL';
    let sessionId: SessionId | undefined;
    let startTime: number | undefined;
    let sessionDurationMs: number | undefined;

    const listeners = new Set<(context: GameContext) => void>();

    // Helper: create frozen context snapshot
    function createContextSnapshot(): Readonly<GameContext> {
        switch (currentState) {
            case 'INITIAL': {
                const ctx: InitialContext = {
                    state: 'INITIAL',
                    metadata,
                    accessibilityPrefs,
                    themeMode,
                    orgConfig,
                };
                return Object.freeze({ ...ctx });
            }

            case 'IN_SESSION': {
                if (sessionId === undefined || startTime === undefined) {
                    throw new Error('[SDK] Invalid state: IN_SESSION without sessionId');
                }
                const ctx: InSessionContext = {
                    state: 'IN_SESSION',
                    sessionId,
                    startTime: createTimestamp(startTime),
                    metadata,
                    progression,
                    accessibilityPrefs,
                    themeMode,
                    orgConfig,
                    savedGameState,
                };
                return Object.freeze({ ...ctx });
            }

            case 'ENDED': {
                if (sessionId === undefined || sessionDurationMs === undefined) {
                    throw new Error('[SDK] Invalid state: ENDED without session data');
                }
                const ctx: SessionEndedContext = {
                    state: 'ENDED',
                    sessionId,
                    sessionDurationMs: createDuration(sessionDurationMs),
                };
                return Object.freeze({ ...ctx });
            }
        }
    }

    // Helper: notify all listeners
    function notifyListeners(): void {
        const ctx = createContextSnapshot();
        for (const listener of listeners) {
            try {
                listener(ctx);
            } catch {
                // Don't let listener errors break the driver
            }
        }
    }

    return {
        getContext(): Readonly<GameContext> {
            return createContextSnapshot();
        },

        startSession(sid: SessionId): void {
            if (currentState !== 'INITIAL') {
                throw new Error(
                    `[SDK] Cannot start session: already in state ${currentState}`
                );
            }
            sessionId = sid;
            startTime = nowMs();
            currentState = 'IN_SESSION';
            notifyListeners();
        },

        endSession(_reason: SessionEndReason): void {
            if (currentState !== 'IN_SESSION') {
                throw new Error(
                    `[SDK] Cannot end session: not in session (state: ${currentState})`
                );
            }
            // reason logged but not stored (we track end state, not reason)
            sessionDurationMs = nowMs() - (startTime ?? 0);
            currentState = 'ENDED';
            notifyListeners();
        },

        abortSession(_reason: SessionAbortReason): void {
            if (currentState !== 'IN_SESSION') {
                throw new Error(
                    `[SDK] Cannot abort session: not in session (state: ${currentState})`
                );
            }
            // reason logged but not stored (we track end state, not reason)
            sessionDurationMs = nowMs() - (startTime ?? 0);
            currentState = 'ENDED';
            notifyListeners();
        },

        subscribe(listener: (context: GameContext) => void): () => void {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },

        isSessionActive(): boolean {
            return currentState === 'IN_SESSION';
        },
    };
}
