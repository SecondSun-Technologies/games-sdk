/**
 * @fileoverview Event Emitter - Fire and Forget
 * @module @secondsun/games-sdk/events/event-emitter
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * CRITICAL: emit() is FIRE-AND-FORGET.
 *
 * - Returns void, never a Promise
 * - Never throws (errors are logged internally in dev, silent in prod)
 * - Never blocks game execution
 * - Game cannot know if event was processed
 *
 * This ensures games cannot:
 * - Wait for platform confirmation
 * - Retry on failure
 * - Make decisions based on event delivery
 *
 * Games should NEVER:
 * - Manually log analytics
 * - Talk to backends
 * - Format payloads for storage
 *
 * If a dev thinks about analytics plumbing, the SDK failed.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { type GameEvent, type EmittedEvent } from './event-types.js';
import { validateEvent, type ValidationMode } from './event-validators.js';
import { createTimestamp, type SessionId } from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

/** Maximum events per second before rate limiting */
const MAX_EVENTS_PER_SECOND = 50;

/** Time window for rate limiting (ms) */
const RATE_LIMIT_WINDOW_MS = 1000;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Event handler function type.
 * Handlers receive the fully-processed EmittedEvent.
 */
export type EventHandler = (event: EmittedEvent) => void;

/**
 * Configuration for creating an event emitter.
 */
export interface EventEmitterConfig {
    /** Game ID from metadata */
    readonly gameId: string;

    /** SDK version string */
    readonly sdkVersion: string;

    /** Current session ID getter (may return undefined if not in session) */
    readonly getSessionId: () => SessionId | undefined;

    /** Validation mode */
    readonly mode: ValidationMode;

    /** Event handlers to call on valid events */
    readonly handlers: readonly EventHandler[];
}

/**
 * The event emitter interface exposed to games.
 *
 * Games interact with this to emit events. The implementation
 * handles validation, enrichment, and delivery.
 */
export interface EventEmitter {
    /**
     * Fire-and-forget event emission.
     *
     * @param event - The event to emit
     * @returns void - NEVER a Promise, NEVER throws
     */
    emit(event: GameEvent): void;
}

/**
 * Extended emitter for internal SDK use.
 * Includes methods not exposed to games.
 */
export interface InternalEventEmitter extends EventEmitter {
    /**
     * Count of SUCCESSFULLY PROCESSED events (passed validation, delivered to handlers).
     * Does NOT include dropped events (validation failures, rate limits).
     * Use getDroppedCount() to see rejected events.
     */
    getEventCount(): number;

    /**
     * Count of DROPPED events (failed validation, rate limited, etc.).
     * Use for monitoring SDK health and detecting misbehaving games.
     */
    getDroppedCount(): number;

    /** Reset rate limiting (for testing) */
    resetRateLimiter(): void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates an event emitter for a game.
 *
 * @param config - Emitter configuration
 * @returns Event emitter instance
 */
export function createEventEmitter(config: EventEmitterConfig): InternalEventEmitter {
    const { gameId, sdkVersion, getSessionId, mode, handlers } = config;

    // Counters
    let eventCount = 0;
    let droppedCount = 0;

    // Rate limiting state
    let rateLimitWindowStart = Date.now();
    let eventsInWindow = 0;

    /**
     * Check and update rate limiting.
     * @returns true if event should be allowed, false if rate limited
     */
    function checkRateLimit(): boolean {
        const now = Date.now();

        // Reset window if expired
        if (now - rateLimitWindowStart >= RATE_LIMIT_WINDOW_MS) {
            rateLimitWindowStart = now;
            eventsInWindow = 0;
        }

        // Check limit
        if (eventsInWindow >= MAX_EVENTS_PER_SECOND) {
            return false;
        }

        eventsInWindow++;
        return true;
    }

    /**
     * Fire-and-forget event emission.
     * NEVER throws, NEVER returns a Promise.
     */
    function emit(event: GameEvent): void {
        // Rate limit check
        if (!checkRateLimit()) {
            droppedCount++;
            if (mode === 'development') {
                console.warn(
                    `[SDK] Event rate limited: ${event.type}. ` +
                    `Max ${String(MAX_EVENTS_PER_SECOND)} events per second.`
                );
            }
            return;
        }

        // Skip DEV_LOG in production entirely
        if (mode === 'production' && event.type === 'DEV_LOG') {
            return;
        }

        // Validate - CRITICAL: must never throw to honor the emit() contract
        let result;
        try {
            result = validateEvent(event, mode);
        } catch (error) {
            // Validator threw (e.g., unknown event type in dev mode)
            // This is a bug in the game, but we still must not throw
            droppedCount++;
            if (mode === 'development') {
                console.error(
                    '[SDK] Event validation threw unexpectedly:',
                    error instanceof Error ? error.message : String(error)
                );
            }
            return;
        }

        if (!result.valid) {
            droppedCount++;
            // Errors already logged by validator in dev mode
            return;
        }

        // Create enriched event
        // Handle sessionId carefully for exactOptionalPropertyTypes
        const sessionId = getSessionId();
        const emittedEvent: EmittedEvent = sessionId !== undefined
            ? {
                event: result.event ?? event,
                timestamp: createTimestamp(),
                sessionId,
                gameId,
                sdkVersion,
            }
            : {
                event: result.event ?? event,
                timestamp: createTimestamp(),
                gameId,
                sdkVersion,
            };

        // Deliver to handlers
        for (const handler of handlers) {
            try {
                handler(emittedEvent);
            } catch (handlerError) {
                // Never let handler errors bubble up to game code
                if (mode === 'development') {
                    console.error('[SDK] Event handler threw:', handlerError);
                }
            }
        }

        eventCount++;
    }

    return {
        emit,
        getEventCount: () => eventCount,
        getDroppedCount: () => droppedCount,
        resetRateLimiter: () => {
            rateLimitWindowStart = Date.now();
            eventsInWindow = 0;
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FOR GAME USE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a simple emit function for game use.
 *
 * This is the function that gets passed to games in their render props.
 * It's just the emit method from an EventEmitter.
 *
 * @param emitter - The internal event emitter
 * @returns Just the emit function
 */
export function createEmitFunction(emitter: EventEmitter): (event: GameEvent) => void {
    return emitter.emit.bind(emitter);
}
