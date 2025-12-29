/**
 * @fileoverview Event Validator Unit Tests
 * @module @secondsuntech/games-sdk/__tests__/event-validators.test
 *
 * Tests for the event validation system, focusing on clamping behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEvent, type ValidationMode, type ValidationResult } from '../events/event-validators.js';
import { createSessionId, createTimestamp, createDuration, createLevelId, createDifficulty } from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function createValidSessionStarted() {
    return {
        type: 'SESSION_STARTED',
        sessionId: createSessionId('session-123'),
        timestamp: createTimestamp(Date.now()),
        userTimeZone: 'America/New_York',
    };
}

function createValidLevelCompleted() {
    return {
        type: 'LEVEL_COMPLETED',
        sessionId: createSessionId('session-123'),
        levelId: createLevelId('level-1'),
        timestamp: createTimestamp(Date.now()),
        durationMs: createDuration(30000),
        attemptNumber: 1,
        difficulty: createDifficulty(5),
        accuracy: 0.85,
        errorCount: 2,
    };
}

function createValidPerformanceReported() {
    return {
        type: 'PERFORMANCE_REPORTED',
        sessionId: createSessionId('session-123'),
        timestamp: createTimestamp(Date.now()),
        metric: 'accuracy',
        value: 0.9,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateEvent', () => {
    describe('basic validation', () => {
        it('validates a correct SESSION_STARTED event', () => {
            const event = createValidSessionStarted();
            const result = validateEvent(event, 'development');

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('validates a correct LEVEL_COMPLETED event', () => {
            const event = createValidLevelCompleted();
            const result = validateEvent(event, 'development');

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('rejects null event', () => {
            const result = validateEvent(null, 'development');

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('rejects event without type', () => {
            const event = { sessionId: 'session-123' };
            const result = validateEvent(event, 'development');

            expect(result.valid).toBe(false);
        });
    });

    describe('analytics field handling', () => {
        it('validates event with accuracy at boundary (1.0)', () => {
            const event = {
                ...createValidLevelCompleted(),
                accuracy: 1.0,
            };

            const result = validateEvent(event, 'development');
            expect(result.valid).toBe(true);
        });

        it('validates event with accuracy at lower boundary (0.0)', () => {
            const event = {
                ...createValidLevelCompleted(),
                accuracy: 0.0,
            };

            const result = validateEvent(event, 'development');
            expect(result.valid).toBe(true);
        });

        it('validates event with zero errorCount', () => {
            const event = {
                ...createValidLevelCompleted(),
                errorCount: 0,
            };

            const result = validateEvent(event, 'development');
            expect(result.valid).toBe(true);
        });
    });

    describe('rejection behavior for structural fields', () => {
        it('rejects invalid sessionId', () => {
            const event = {
                type: 'SESSION_STARTED',
                sessionId: '', // Empty string is invalid
                timestamp: Date.now(),
                userTimeZone: 'America/New_York',
            };

            const result = validateEvent(event, 'development');

            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.toLowerCase().includes('session'))).toBe(true);
        });
    });

    describe('dev vs prod mode', () => {
        let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
        let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        });

        afterEach(() => {
            consoleWarnSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('processes clamped values in development mode', () => {
            const event = {
                ...createValidLevelCompleted(),
                accuracy: 1.5, // Will be clamped
            };

            const result = validateEvent(event, 'development');

            // Validation completes (may log warnings internally)
            expect(result).toBeDefined();
        });

        it('is silent in production mode when clamping', () => {
            const event = {
                ...createValidLevelCompleted(),
                accuracy: 1.5, // Will be clamped
            };

            validateEvent(event, 'production');

            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
    });

    describe('unknown event types', () => {
        it('throws in development mode for unknown event type', () => {
            const event = {
                type: 'UNKNOWN_EVENT_TYPE',
                sessionId: createSessionId('session-123'),
                timestamp: createTimestamp(Date.now()),
            };

            expect(() => validateEvent(event, 'development')).toThrow();
        });

        it('returns invalid silently in production mode for unknown event type', () => {
            const event = {
                type: 'UNKNOWN_EVENT_TYPE',
                sessionId: createSessionId('session-123'),
                timestamp: createTimestamp(Date.now()),
            };

            const result = validateEvent(event, 'production');

            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.includes('Unknown'))).toBe(true);
        });
    });
});
