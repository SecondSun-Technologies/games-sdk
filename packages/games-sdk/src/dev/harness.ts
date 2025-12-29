/**
 * @fileoverview Dev Harness - Local Game Testing Framework
 * @module @secondsun/games-sdk/dev/harness
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * The dev harness provides a complete local testing environment.
 *
 * It includes:
 * - Mock context generation
 * - Event capture and inspection
 * - Capability mocking
 * - Hot-reloadable state management
 *
 * DEV-ONLY: This is completely removed in production builds.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { GameMetadata } from '../types/metadata.js';
import type { GameContext } from '../types/context.js';
import type { GameEvent, EmittedEvent } from '../events/event-types.js';
import type { SessionId } from '../types/branded.js';
import { createDuration } from '../types/branded.js';
import { createEventEmitter, type InternalEventEmitter } from '../events/event-emitter.js';
import { createCapabilityGuard, type CapabilityGuard } from '../core/capability-guard.js';
import { createMockInSessionContext, DEFAULT_ACCESSIBILITY_PREFS, DEFAULT_ORG_CONFIG, type MockContextOptions } from './mock-context.js';
import { createEventInspector, type EventInspector } from './event-inspector.js';
import { createMockCapabilityApi, createNoOpCapabilityApi } from './capability-apis.js';

// ═══════════════════════════════════════════════════════════════════════════════
// HARNESS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration for the dev harness.
 */
export interface DevHarnessConfig {
    /** Game metadata */
    readonly metadata: GameMetadata;

    /** Initial context options */
    readonly contextOptions?: MockContextOptions;

    /** Whether to auto-log events to console */
    readonly logEvents?: boolean;

    /** Custom event handlers */
    readonly handlers?: readonly ((event: EmittedEvent) => void)[];
}

/**
 * The dev harness instance.
 */
export interface DevHarness {
    /** Current context (mutable for testing) */
    context: GameContext;

    /** Emit function to pass to game */
    readonly emit: (event: GameEvent) => void;

    /** Capability guard to pass to game */
    readonly capabilities: CapabilityGuard;

    /** Event inspector for debugging */
    readonly inspector: EventInspector;

    /** Internal emitter (for stats) */
    readonly emitter: InternalEventEmitter;

    /** Transition to a new context state */
    setContextState(state: 'INITIAL' | 'IN_SESSION' | 'ENDED'): void;

    /** Update context options */
    updateContext(options: MockContextOptions): void;

    /** Get current session ID (if in session) */
    getSessionId(): SessionId | undefined;

    /** Reset the harness */
    reset(): void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HARNESS IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a development harness for testing games locally.
 *
 * @example
 * const harness = createDevHarness({
 *   metadata: myGameMetadata,
 *   logEvents: true,
 * });
 *
 * // Render your game
 * render(
 *   <MyGame
 *     context={harness.context}
 *     emit={harness.emit}
 *   />
 * );
 *
 * // Inspect events
 * console.log(harness.inspector.getStats());
 */
export function createDevHarness(config: DevHarnessConfig): DevHarness {
    const { metadata, contextOptions = {}, logEvents = true, handlers = [] } = config;

    // Create inspector
    const inspector = createEventInspector();

    // Track current session
    let currentSessionId: SessionId | undefined;

    // Create initial context (starts in IN_SESSION)
    const initialContext = createMockInSessionContext(metadata, contextOptions);
    let context: GameContext = initialContext;
    currentSessionId = initialContext.sessionId;

    // Combine handlers
    // Use arrow wrapper for inspector.capture to avoid unbound-method issue
    const captureHandler = (event: EmittedEvent): void => {
        inspector.capture(event);
    };
    const allHandlers = [
        captureHandler,
        ...(logEvents ? [] : []), // Inspector already logs if we want logging
        ...handlers,
    ];

    // Create emitter
    const emitter = createEventEmitter({
        gameId: metadata.id,
        sdkVersion: '0.1.0-dev',
        getSessionId: (): SessionId | undefined => currentSessionId,
        mode: 'development',
        handlers: allHandlers,
    });

    // Create capability guard with mock APIs
    const capabilities = createCapabilityGuard({
        declaredCapabilities: metadata.capabilities,
        apiFactory: createMockCapabilityApi,
        noOpApiFactory: createNoOpCapabilityApi,
    });

    /**
     * Set context to a specific state.
     */
    function setContextState(state: 'INITIAL' | 'IN_SESSION' | 'ENDED'): void {
        switch (state) {
            case 'INITIAL':
                context = {
                    state: 'INITIAL',
                    metadata,
                    accessibilityPrefs: DEFAULT_ACCESSIBILITY_PREFS,
                    themeMode: 'light',
                    orgConfig: DEFAULT_ORG_CONFIG,
                };
                currentSessionId = undefined;
                break;
            case 'IN_SESSION': {
                const newContext = createMockInSessionContext(metadata, contextOptions);
                context = newContext;
                currentSessionId = newContext.sessionId;
                break;
            }
            case 'ENDED': {
                // Keep session ID for results display
                if (currentSessionId === undefined) {
                    throw new Error('Cannot end session: no session active');
                }
                context = {
                    state: 'ENDED',
                    sessionId: currentSessionId,
                    sessionDurationMs: createDuration(300000), // 5 minutes mock
                };
                break;
            }
        }
    }

    /**
     * Update context with new options.
     */
    function updateContext(options: MockContextOptions): void {
        const newContext = createMockInSessionContext(metadata, {
            ...contextOptions,
            ...options,
        });
        context = newContext;
        currentSessionId = newContext.sessionId;
    }

    /**
     * Reset the harness to initial state.
     */
    function reset(): void {
        inspector.clear();
        emitter.resetRateLimiter();
        const newContext = createMockInSessionContext(metadata, contextOptions);
        context = newContext;
        currentSessionId = newContext.sessionId;
        console.log('%c[DevHarness] Reset', 'color: #2196F3; font-weight: bold');
    }

    // Create emit function as arrow to avoid unbound-method issue
    const emit = (event: GameEvent): void => {
        emitter.emit(event);
    };

    return {
        context,
        emit,
        capabilities,
        inspector,
        emitter,
        setContextState,
        updateContext,
        getSessionId: (): SessionId | undefined => currentSessionId,
        reset,
    };
}
