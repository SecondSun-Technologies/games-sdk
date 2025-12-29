/**
 * @fileoverview Event Gate Unit Tests
 * @module @secondsuntech/games-sdk/__tests__/eventGate.test
 *
 * Tests for the event lifecycle gate mechanism.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGatedEmit, type GatedEmit, type GatedEmitOptions, type DropReasonCode } from '../platform/eventGate.js';
import type { SessionDriver } from '../platform/session.js';
import type { GameContext, InSessionContext, InitialContext, SessionEndedContext } from '../types/context.js';
import type { GameEvent, SessionStartedEvent, LevelStartedEvent, DevLogEvent } from '../events/event-types.js';
import { createSessionId, createDifficulty, createTimestamp, createDuration, createLevelId } from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function createMockSessionDriver(context: GameContext): SessionDriver {
    return {
        getContext: () => context,
        subscribe: vi.fn(() => () => { }),
        startSession: vi.fn(),
        endSession: vi.fn(),
    } as unknown as SessionDriver;
}

function createInitialContext(): InitialContext {
    return {
        state: 'INITIAL',
        accessibilityPrefs: {
            fontScale: 1,
            reduceMotion: false,
            highContrast: false,
            colorBlindMode: 'none',
            largerTouchTargets: false,
        },
        themeMode: 'light',
        orgConfig: { orgName: 'Test', enableCompetitiveFeatures: false },
        metadata: {
            id: 'test-game',
            name: 'Test Game',
            version: '1.0.0',
            targetDurationMs: createDuration(300000),
            difficulty: createDifficulty(5),
            category: 'puzzle',
        },
    } as InitialContext;
}

function createInSessionContext(sessionId: string): InSessionContext {
    return {
        state: 'IN_SESSION',
        sessionId: createSessionId(sessionId),
        startedAt: createTimestamp(Date.now()),
        accessibilityPrefs: {
            fontScale: 1,
            reduceMotion: false,
            highContrast: false,
            colorBlindMode: 'none',
            largerTouchTargets: false,
        },
        themeMode: 'light',
        orgConfig: { orgName: 'Test', enableCompetitiveFeatures: false },
        progression: {
            currentLevel: 1,
            sessionsPlayed: 0,
            totalPlayTimeMs: createDuration(0),
            completionCount: 0,
        },
        metadata: {
            id: 'test-game',
            name: 'Test Game',
            version: '1.0.0',
            targetDurationMs: createDuration(300000),
            difficulty: createDifficulty(5),
            category: 'puzzle',
        },
    } as InSessionContext;
}

function createEndedContext(sessionId: string): SessionEndedContext {
    return {
        state: 'ENDED',
        sessionId: createSessionId(sessionId),
        startedAt: createTimestamp(Date.now() - 60000),
        endedAt: createTimestamp(Date.now()),
        accessibilityPrefs: {
            fontScale: 1,
            reduceMotion: false,
            highContrast: false,
            colorBlindMode: 'none',
            largerTouchTargets: false,
        },
        themeMode: 'light',
        orgConfig: { orgName: 'Test', enableCompetitiveFeatures: false },
        summary: {
            durationMs: createDuration(60000),
            exitReason: 'completed',
        },
        metadata: {
            id: 'test-game',
            name: 'Test Game',
            version: '1.0.0',
            targetDurationMs: createDuration(300000),
            difficulty: createDifficulty(5),
            category: 'puzzle',
        },
    } as SessionEndedContext;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('createGatedEmit', () => {
    describe('INITIAL state', () => {
        it('drops SESSION_STARTED in INITIAL state (platform must transition first)', () => {
            const platformEmit = vi.fn();
            const onEventDropped = vi.fn();
            const sessionDriver = createMockSessionDriver(createInitialContext());

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                onEventDropped,
            });

            const event: SessionStartedEvent = {
                type: 'SESSION_STARTED',
                sessionId: createSessionId('session-123'),
                timestamp: createTimestamp(Date.now()),
                userTimeZone: 'America/New_York',
            };

            gatedEmit(event);

            expect(platformEmit).not.toHaveBeenCalled();
            expect(onEventDropped).toHaveBeenCalledWith(
                event,
                expect.stringContaining('before session started'),
                'BEFORE_SESSION'
            );
        });

        it('allows DEV_LOG in INITIAL state for debugging', () => {
            const platformEmit = vi.fn();
            const onEventDropped = vi.fn();
            const sessionDriver = createMockSessionDriver(createInitialContext());

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                onEventDropped,
            });

            const event: DevLogEvent = {
                type: 'DEV_LOG',
                level: 'info',
                message: 'Debug message',
                timestamp: createTimestamp(Date.now()),
            };

            gatedEmit(event);

            expect(platformEmit).toHaveBeenCalledWith(event);
            expect(onEventDropped).not.toHaveBeenCalled();
        });

        it('drops LEVEL_STARTED in INITIAL state', () => {
            const platformEmit = vi.fn();
            const onEventDropped = vi.fn();
            const sessionDriver = createMockSessionDriver(createInitialContext());

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                onEventDropped,
            });

            const event: LevelStartedEvent = {
                type: 'LEVEL_STARTED',
                sessionId: createSessionId('session-123'),
                levelId: createLevelId('level-1'),
                timestamp: createTimestamp(Date.now()),
                attemptNumber: 1,
            };

            gatedEmit(event);

            expect(platformEmit).not.toHaveBeenCalled();
            expect(onEventDropped).toHaveBeenCalledWith(
                event,
                expect.any(String),
                'BEFORE_SESSION'
            );
        });
    });

    describe('IN_SESSION state', () => {
        it('allows SESSION_STARTED in IN_SESSION with matching sessionId', () => {
            const platformEmit = vi.fn();
            const onEventDropped = vi.fn();
            const sessionId = 'session-abc-123';
            const sessionDriver = createMockSessionDriver(createInSessionContext(sessionId));

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                onEventDropped,
            });

            const event: SessionStartedEvent = {
                type: 'SESSION_STARTED',
                sessionId: createSessionId(sessionId),
                timestamp: createTimestamp(Date.now()),
                userTimeZone: 'America/New_York',
            };

            gatedEmit(event);

            expect(platformEmit).toHaveBeenCalledWith(event);
            expect(onEventDropped).not.toHaveBeenCalled();
        });

        it('drops events with mismatched sessionId in IN_SESSION', () => {
            const platformEmit = vi.fn();
            const onEventDropped = vi.fn();
            const sessionDriver = createMockSessionDriver(createInSessionContext('correct-session'));

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                onEventDropped,
            });

            const event: SessionStartedEvent = {
                type: 'SESSION_STARTED',
                sessionId: createSessionId('wrong-session'),
                timestamp: createTimestamp(Date.now()),
                userTimeZone: 'America/New_York',
            };

            gatedEmit(event);

            expect(platformEmit).not.toHaveBeenCalled();
            expect(onEventDropped).toHaveBeenCalledWith(
                event,
                expect.stringContaining('sessionId mismatch'),
                'SESSION_ID_MISMATCH'
            );
        });

        it('allows LEVEL_STARTED with matching sessionId', () => {
            const platformEmit = vi.fn();
            const onEventDropped = vi.fn();
            const sessionId = 'session-xyz';
            const sessionDriver = createMockSessionDriver(createInSessionContext(sessionId));

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                onEventDropped,
            });

            const event: LevelStartedEvent = {
                type: 'LEVEL_STARTED',
                sessionId: createSessionId(sessionId),
                levelId: createLevelId('level-1'),
                timestamp: createTimestamp(Date.now()),
                attemptNumber: 1,
            };

            gatedEmit(event);

            expect(platformEmit).toHaveBeenCalledWith(event);
            expect(onEventDropped).not.toHaveBeenCalled();
        });

        it('allows DEV_LOG without sessionId field', () => {
            const platformEmit = vi.fn();
            const sessionDriver = createMockSessionDriver(createInSessionContext('session-123'));

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
            });

            const event: DevLogEvent = {
                type: 'DEV_LOG',
                level: 'warn',
                message: 'Warning message',
                timestamp: createTimestamp(Date.now()),
            };

            gatedEmit(event);

            expect(platformEmit).toHaveBeenCalledWith(event);
        });
    });

    describe('ENDED state', () => {
        it('drops all events except DEV_LOG in ENDED state', () => {
            const platformEmit = vi.fn();
            const onEventDropped = vi.fn();
            const sessionDriver = createMockSessionDriver(createEndedContext('session-123'));

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                onEventDropped,
            });

            const event: LevelStartedEvent = {
                type: 'LEVEL_STARTED',
                sessionId: createSessionId('session-123'),
                levelId: createLevelId('level-1'),
                timestamp: createTimestamp(Date.now()),
                attemptNumber: 1,
            };

            gatedEmit(event);

            expect(platformEmit).not.toHaveBeenCalled();
            expect(onEventDropped).toHaveBeenCalledWith(
                event,
                expect.stringContaining('after session ended'),
                'AFTER_SESSION_ENDED'
            );
        });

        it('allows DEV_LOG in ENDED state when allowDevLogAfterEnd is true', () => {
            const platformEmit = vi.fn();
            const sessionDriver = createMockSessionDriver(createEndedContext('session-123'));

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                allowDevLogAfterEnd: true,
            });

            const event: DevLogEvent = {
                type: 'DEV_LOG',
                level: 'error',
                message: 'Post-session error',
                timestamp: createTimestamp(Date.now()),
            };

            gatedEmit(event);

            expect(platformEmit).toHaveBeenCalledWith(event);
        });

        it('drops DEV_LOG in ENDED state when allowDevLogAfterEnd is false', () => {
            const platformEmit = vi.fn();
            const onEventDropped = vi.fn();
            const sessionDriver = createMockSessionDriver(createEndedContext('session-123'));

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit,
                onEventDropped,
                allowDevLogAfterEnd: false,
            });

            const event: DevLogEvent = {
                type: 'DEV_LOG',
                level: 'info',
                message: 'Debug message',
                timestamp: createTimestamp(Date.now()),
            };

            gatedEmit(event);

            expect(platformEmit).not.toHaveBeenCalled();
            expect(onEventDropped).toHaveBeenCalledWith(
                event,
                expect.any(String),
                'AFTER_SESSION_ENDED'
            );
        });
    });

    describe('onEventDropped callback', () => {
        it('calls onEventDropped with reason on drop', () => {
            const onEventDropped = vi.fn();
            const sessionDriver = createMockSessionDriver(createInitialContext());

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit: vi.fn(),
                onEventDropped,
            });

            const event: LevelStartedEvent = {
                type: 'LEVEL_STARTED',
                sessionId: createSessionId('session-123'),
                levelId: createLevelId('level-1'),
                timestamp: createTimestamp(Date.now()),
                attemptNumber: 1,
            };

            gatedEmit(event);

            expect(onEventDropped).toHaveBeenCalledTimes(1);
            expect(onEventDropped).toHaveBeenCalledWith(
                event,
                expect.any(String),
                expect.any(String)
            );
        });

        it('does not throw if onEventDropped is not provided', () => {
            const sessionDriver = createMockSessionDriver(createInitialContext());

            const gatedEmit = createGatedEmit({
                sessionDriver,
                platformEmit: vi.fn(),
                // No onEventDropped
            });

            const event: LevelStartedEvent = {
                type: 'LEVEL_STARTED',
                sessionId: createSessionId('session-123'),
                levelId: createLevelId('level-1'),
                timestamp: createTimestamp(Date.now()),
                attemptNumber: 1,
            };

            expect(() => gatedEmit(event)).not.toThrow();
        });
    });
});
