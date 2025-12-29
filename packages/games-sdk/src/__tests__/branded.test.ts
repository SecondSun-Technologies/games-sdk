/**
 * @fileoverview Branded Types Unit Tests
 * @module @secondsuntech/games-sdk/__tests__/branded.test
 *
 * Tests for branded type validators.
 */

import { describe, it, expect } from 'vitest';
import {
    createSessionId,
    createLevelId,
    createDifficulty,
    createTimestamp,
    createDuration,
    isValidSessionId,
    isValidLevelId,
    isValidDifficulty,
    isValidTimestamp,
    isValidDuration,
    InvalidSessionIdError,
    InvalidLevelIdError,
    InvalidDifficultyError,
    InvalidTimestampError,
    InvalidDurationError,
} from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION ID TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('SessionId', () => {
    describe('createSessionId', () => {
        it('creates valid SessionId from non-empty string', () => {
            const result = createSessionId('session-abc-123');
            expect(typeof result).toBe('string');
            expect(result).toBe('session-abc-123');
        });

        it('throws InvalidSessionIdError for empty string', () => {
            expect(() => createSessionId('')).toThrow(InvalidSessionIdError);
        });

        // Note: createSessionId does not trim - whitespace-only is valid
        // This is intentional - validation should happen at a higher level
        it('creates SessionId from whitespace-only string (no validation)', () => {
            const result = createSessionId('   ');
            expect(result).toBe('   ');
        });
    });

    describe('isValidSessionId', () => {
        it('returns true for valid session ID', () => {
            expect(isValidSessionId('valid-id')).toBe(true);
        });

        it('returns false for empty string', () => {
            expect(isValidSessionId('')).toBe(false);
        });

        it('returns false for non-string', () => {
            expect(isValidSessionId(123)).toBe(false);
            expect(isValidSessionId(null)).toBe(false);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL ID TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('LevelId', () => {
    describe('createLevelId', () => {
        it('creates valid LevelId from non-empty string', () => {
            const result = createLevelId('level-1');
            expect(result).toBe('level-1');
        });

        it('throws InvalidLevelIdError for empty string', () => {
            expect(() => createLevelId('')).toThrow(InvalidLevelIdError);
        });
    });

    describe('isValidLevelId', () => {
        it('returns true for valid level ID', () => {
            expect(isValidLevelId('level-42')).toBe(true);
        });

        it('returns false for empty string', () => {
            expect(isValidLevelId('')).toBe(false);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DIFFICULTY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Difficulty', () => {
    describe('createDifficulty', () => {
        it('creates valid Difficulty for values 1-10', () => {
            for (let i = 1; i <= 10; i++) {
                const result = createDifficulty(i);
                expect(result).toBe(i);
            }
        });

        it('throws InvalidDifficultyError for 0', () => {
            expect(() => createDifficulty(0)).toThrow(InvalidDifficultyError);
        });

        it('throws InvalidDifficultyError for 11', () => {
            expect(() => createDifficulty(11)).toThrow(InvalidDifficultyError);
        });

        it('throws InvalidDifficultyError for negative numbers', () => {
            expect(() => createDifficulty(-1)).toThrow(InvalidDifficultyError);
        });

        it('throws InvalidDifficultyError for non-integers', () => {
            expect(() => createDifficulty(5.5)).toThrow(InvalidDifficultyError);
        });
    });

    describe('isValidDifficulty', () => {
        it('returns true for integers 1-10', () => {
            for (let i = 1; i <= 10; i++) {
                expect(isValidDifficulty(i)).toBe(true);
            }
        });

        it('returns false for values outside 1-10', () => {
            expect(isValidDifficulty(0)).toBe(false);
            expect(isValidDifficulty(11)).toBe(false);
            expect(isValidDifficulty(-5)).toBe(false);
        });

        it('returns false for non-integers', () => {
            expect(isValidDifficulty(5.5)).toBe(false);
            expect(isValidDifficulty('5')).toBe(false);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TIMESTAMP TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Timestamp', () => {
    describe('createTimestamp', () => {
        it('creates valid Timestamp from positive integer', () => {
            const now = Date.now();
            const result = createTimestamp(now);
            expect(result).toBe(now);
        });

        it('throws InvalidTimestampError for negative values', () => {
            expect(() => createTimestamp(-1)).toThrow(InvalidTimestampError);
        });

        it('throws InvalidTimestampError for non-integers', () => {
            expect(() => createTimestamp(1234.5)).toThrow(InvalidTimestampError);
        });
    });

    describe('isValidTimestamp', () => {
        it('returns true for valid timestamps', () => {
            expect(isValidTimestamp(Date.now())).toBe(true);
            expect(isValidTimestamp(0)).toBe(true);
        });

        it('returns false for negative values', () => {
            expect(isValidTimestamp(-1)).toBe(false);
        });

        it('returns false for non-numbers', () => {
            expect(isValidTimestamp('1234')).toBe(false);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DURATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('DurationMs', () => {
    describe('createDuration', () => {
        it('creates valid DurationMs from non-negative integer', () => {
            const result = createDuration(5000);
            expect(result).toBe(5000);
        });

        it('allows zero duration', () => {
            const result = createDuration(0);
            expect(result).toBe(0);
        });

        it('throws InvalidDurationError for negative values', () => {
            expect(() => createDuration(-100)).toThrow(InvalidDurationError);
        });

        it('throws InvalidDurationError for non-integers', () => {
            expect(() => createDuration(1000.5)).toThrow(InvalidDurationError);
        });
    });

    describe('isValidDuration', () => {
        it('returns true for non-negative integers', () => {
            expect(isValidDuration(0)).toBe(true);
            expect(isValidDuration(60000)).toBe(true);
        });

        it('returns false for negative values', () => {
            expect(isValidDuration(-1)).toBe(false);
        });

        it('returns false for non-integers', () => {
            expect(isValidDuration(100.5)).toBe(false);
        });
    });
});
