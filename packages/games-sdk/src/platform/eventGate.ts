/**
 * @fileoverview Event Lifecycle Gate
 * @module @secondsuntech/games-sdk/platform/eventGate
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * EVENT LIFECYCLE GATE
 *
 * Deterministic mechanism for dropping events based on session state.
 *
 * LIFECYCLE MODEL:
 * 1. Platform transitions context to IN_SESSION with sessionId
 * 2. Game sees IN_SESSION, emits SESSION_STARTED as acknowledgment
 * 3. Gate validates event.sessionId === context.sessionId
 *
 * RULES:
 * - INITIAL: only DEV_LOG allowed (debugging before session)
 *   - SESSION_STARTED NOT allowed here - platform transitions first
 * - IN_SESSION: all gameplay events allowed IF sessionId matches
 * - ENDED: everything dropped (maybe allow DEV_LOG)
 *
 * This is a MECHANISM, not just a policy. It's deterministic and testable.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { GameEvent } from '../events/event-types.js';
import type { SessionDriver } from './session.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Gated emit function type.
 */
export type GatedEmit = (event: GameEvent) => void;

/**
 * Drop reason codes for diagnostics.
 */
export type DropReasonCode =
    | 'BEFORE_SESSION'
    | 'SESSION_ID_MISMATCH'
    | 'AFTER_SESSION_ENDED'
    | 'INVALID_STATE_FOR_EVENT';

/**
 * Options for creating a gated emit.
 */
export interface GatedEmitOptions {
    /** Session driver to check lifecycle state */
    readonly sessionDriver: SessionDriver;
    /** Platform emit function (receives valid events) */
    readonly platformEmit: (event: GameEvent) => void;
    /** Optional: log dropped events (dev only) */
    readonly onEventDropped?: (event: GameEvent, reason: string, code: DropReasonCode) => void;
    /** Allow DEV_LOG events even after session ends (dev only) */
    readonly allowDevLogAfterEnd?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if an event has a sessionId field.
 */
function hasSessionId(event: GameEvent): event is GameEvent & { sessionId: string } {
    return 'sessionId' in event && typeof (event as unknown as Record<string, unknown>)['sessionId'] === 'string';
}

// Events that require IN_SESSION state (kept for documentation, may be used in future)
// const SESSION_REQUIRED_EVENTS = new Set([
//     'SESSION_STARTED', 'SESSION_ENDED', 'SESSION_ABORTED', 'LEVEL_STARTED',
//     'LEVEL_COMPLETED', 'LEVEL_FAILED', 'CHECKPOINT_REACHED', 'PERFORMANCE_REPORTED',
//     'ACTIVE_TIME_REPORTED', 'FRICTION_REPORTED', 'ERROR_MADE', 'FAILURE_OCCURRED',
//     'SAVE_GAME_STATE', 'USER_SIGNAL',
// ]);

// ═══════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a gated emit function that enforces lifecycle rules.
 *
 * HARDENED RULES:
 * - INITIAL: Only DEV_LOG allowed. Platform must transition to IN_SESSION first.
 * - IN_SESSION: Events with sessionId must match context.sessionId.
 * - ENDED: Only DEV_LOG if allowDevLogAfterEnd is true.
 *
 * @param options - Gate configuration
 * @returns Gated emit function
 */
export function createGatedEmit(options: GatedEmitOptions): GatedEmit {
    const { sessionDriver, platformEmit, onEventDropped, allowDevLogAfterEnd = false } = options;

    const drop = (event: GameEvent, reason: string, code: DropReasonCode): void => {
        onEventDropped?.(event, reason, code);
    };

    return (event: GameEvent): void => {
        const ctx = sessionDriver.getContext();

        switch (ctx.state) {
            case 'INITIAL':
                // Before session: ONLY DEV_LOG allowed for debugging
                // SESSION_STARTED is NOT allowed here - platform transitions first,
                // then game acks with SESSION_STARTED after seeing IN_SESSION
                if (event.type === 'DEV_LOG') {
                    platformEmit(event);
                } else {
                    drop(
                        event,
                        `Event '${event.type}' emitted before session started. ` +
                        `Platform must transition to IN_SESSION first.`,
                        'BEFORE_SESSION'
                    );
                }
                break;

            case 'IN_SESSION':
                // During session: validate sessionId if present
                if (hasSessionId(event)) {
                    if (event.sessionId !== ctx.sessionId) {
                        drop(
                            event,
                            `sessionId mismatch: event.sessionId='${event.sessionId}' !== ` +
                            `context.sessionId='${ctx.sessionId}'`,
                            'SESSION_ID_MISMATCH'
                        );
                        return;
                    }
                }

                // All events allowed if sessionId matches (or not required)
                platformEmit(event);
                break;

            case 'ENDED':
                // After session: drop everything (maybe allow DEV_LOG)
                if (event.type === 'DEV_LOG' && allowDevLogAfterEnd) {
                    platformEmit(event);
                } else {
                    drop(
                        event,
                        `Event '${event.type}' emitted after session ended`,
                        'AFTER_SESSION_ENDED'
                    );
                }
                break;
        }
    };
}

