/**
 * @fileoverview Event Inspector for Development
 * @module @secondsun/games-sdk/dev/event-inspector
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * Development tooling for inspecting and debugging emitted events.
 *
 * The EventInspector captures all events during development, providing:
 * - Real-time event logging
 * - Event history browsing
 * - Validation status tracking
 * - Export for debugging
 *
 * DEV-ONLY: This is completely removed in production builds.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { type EmittedEvent, type GameEvent } from '../events/event-types.js';
import { validateEvent, type ValidationResult } from '../events/event-validators.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * An event capture with additional dev metadata.
 */
export interface CapturedEvent {
    /** The emitted event (if valid) */
    readonly event: EmittedEvent | null;

    /** The raw event before processing */
    readonly rawEvent: GameEvent;

    /** Validation result */
    readonly validation: ValidationResult;

    /** When this was captured (local time) */
    readonly capturedAt: Date;

    /** Index in capture history */
    readonly index: number;
}

/**
 * Event filter for the inspector.
 */
export interface EventFilter {
    /** Filter by event type */
    readonly types?: readonly GameEvent['type'][];

    /** Only show valid events */
    readonly validOnly?: boolean;

    /** Only show invalid events */
    readonly invalidOnly?: boolean;
}

/**
 * Event inspector statistics.
 */
export interface InspectorStats {
    /** Total events captured */
    readonly total: number;

    /** Valid events */
    readonly valid: number;

    /** Invalid events (validation failed) */
    readonly invalid: number;

    /** Events by type */
    readonly byType: Readonly<Record<string, number>>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT INSPECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates an event inspector for development.
 *
 * @example
 * const inspector = createEventInspector();
 *
 * // Use as an event handler
 * const emitter = createEventEmitter({
 *   handlers: [inspector.capture],
 *   // ...
 * });
 *
 * // Later, inspect captured events
 * console.log(inspector.getHistory());
 * console.log(inspector.getStats());
 */
export function createEventInspector(): EventInspector {
    const history: CapturedEvent[] = [];
    const listeners: ((event: CapturedEvent) => void)[] = [];
    let eventIndex = 0;

    /**
     * Capture an emitted event.
     */
    function capture(event: EmittedEvent): void {
        const captured: CapturedEvent = {
            event,
            rawEvent: event.event,
            validation: { valid: true, errors: [], warnings: [] },
            capturedAt: new Date(),
            index: eventIndex++,
        };

        history.push(captured);

        // Notify listeners
        for (const listener of listeners) {
            try {
                listener(captured);
            } catch {
                // Ignore listener errors in dev tools
            }
        }

        // Log to console with nice formatting
        console.groupCollapsed(
            `%c[SDK] ${event.event.type}`,
            'color: #4CAF50; font-weight: bold'
        );
        console.log('Event:', event.event);
        console.log('Timestamp:', new Date(event.timestamp).toISOString());
        console.log('Session ID:', event.sessionId ?? '(not in session)');
        console.log('Game ID:', event.gameId);
        console.groupEnd();
    }

    /**
     * Capture a raw event (for pre-validation inspection).
     */
    function captureRaw(rawEvent: GameEvent): void {
        const validation = validateEvent(rawEvent, 'development');

        const captured: CapturedEvent = {
            event: null,
            rawEvent,
            validation,
            capturedAt: new Date(),
            index: eventIndex++,
        };

        history.push(captured);

        // Notify listeners
        for (const listener of listeners) {
            try {
                listener(captured);
            } catch {
                // Ignore listener errors
            }
        }

        // Log with different color based on validity
        const color = validation.valid ? '#4CAF50' : '#f44336';
        const status = validation.valid ? '✓' : '✗';

        console.groupCollapsed(
            `%c[SDK] ${status} ${rawEvent.type}`,
            `color: ${color}; font-weight: bold`
        );
        console.log('Event:', rawEvent);
        console.log('Valid:', validation.valid);
        if (validation.errors.length > 0) {
            console.log('Errors:', validation.errors);
        }
        if (validation.warnings.length > 0) {
            console.log('Warnings:', validation.warnings);
        }
        console.groupEnd();
    }

    /**
     * Get event history with optional filtering.
     */
    function getHistory(filter?: EventFilter): readonly CapturedEvent[] {
        if (filter === undefined) {
            return [...history];
        }

        return history.filter((captured) => {
            // Type filter
            if (filter.types !== undefined && filter.types.length > 0) {
                if (!filter.types.includes(captured.rawEvent.type)) {
                    return false;
                }
            }

            // Valid filter
            if (filter.validOnly === true && !captured.validation.valid) {
                return false;
            }

            // Invalid filter
            if (filter.invalidOnly === true && captured.validation.valid) {
                return false;
            }

            return true;
        });
    }

    /**
     * Get statistics about captured events.
     */
    function getStats(): InspectorStats {
        const byType: Record<string, number> = {};
        let valid = 0;
        let invalid = 0;

        for (const captured of history) {
            const type = captured.rawEvent.type;
            byType[type] = (byType[type] ?? 0) + 1;

            if (captured.validation.valid) {
                valid++;
            } else {
                invalid++;
            }
        }

        return {
            total: history.length,
            valid,
            invalid,
            byType,
        };
    }

    /**
     * Clear all captured events.
     */
    function clear(): void {
        history.length = 0;
        eventIndex = 0;
        console.log('%c[SDK] Event history cleared', 'color: #9E9E9E');
    }

    /**
     * Subscribe to new events.
     */
    function subscribe(listener: (event: CapturedEvent) => void): () => void {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index >= 0) {
                listeners.splice(index, 1);
            }
        };
    }

    /**
     * Export history as JSON (for debugging).
     */
    function exportJson(): string {
        return JSON.stringify(
            history.map((h) => ({
                type: h.rawEvent.type,
                event: h.rawEvent,
                valid: h.validation.valid,
                errors: h.validation.errors,
                capturedAt: h.capturedAt.toISOString(),
            })),
            null,
            2
        );
    }

    return {
        capture,
        captureRaw,
        getHistory,
        getStats,
        clear,
        subscribe,
        exportJson,
    };
}

/**
 * Event inspector interface.
 */
export interface EventInspector {
    /** Capture an emitted event */
    capture(event: EmittedEvent): void;

    /** Capture a raw event for pre-validation inspection */
    captureRaw(rawEvent: GameEvent): void;

    /** Get event history */
    getHistory(filter?: EventFilter): readonly CapturedEvent[];

    /** Get statistics */
    getStats(): InspectorStats;

    /** Clear history */
    clear(): void;

    /** Subscribe to new events */
    subscribe(listener: (event: CapturedEvent) => void): () => void;

    /** Export history as JSON */
    exportJson(): string;
}
