/**
 * @fileoverview Native Renderer
 * @module @secondsuntech/games-sdk/platform/renderGame.native
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * NATIVE RENDERER
 *
 * React Native rendering entry point. Returns a component for embedding.
 * Host app mounts GameRoot inside its own navigation/safe-area structure.
 *
 * CRITICAL: No AppRegistry calls. The SDK does NOT register apps.
 * That would let a guest rewire the host's wiring.
 *
 * Contract:
 * - renderGameNative() returns { GameRoot, sessionDriver, updateAccessibility }
 * - Host app mounts GameRoot where it wants
 * - Host controls lifecycle via sessionDriver
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { createElement, useState, useEffect, type ComponentType } from 'react';
import { ThemeProvider } from '../theme/context.js';
import { getDefaultTheme } from '../theme/defaults.js';
import type { Theme } from '../theme/tokens.js';
import type { GameRegistration, GameRenderProps } from '../core/create-game.js';
import type { GameContext, AccessibilityPrefs, OrgConfig, ProgressionSnapshot } from '../types/context.js';
import type { GameEvent } from '../events/event-types.js';
import type { PlatformRuntime } from './runtime.js';
import { createSessionDriver, type SessionDriver } from './session.js';
import { createGatedEmit } from './eventGate.js';
import { createDuration } from '../types/branded.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration for rendering a game (same as web).
 */
export interface RenderConfig {
    /** Custom theme (overrides runtime.themeMode) */
    readonly theme?: Theme | undefined;
    /** Org configuration */
    readonly orgConfig: OrgConfig;
    /** User progression */
    readonly progression: ProgressionSnapshot;
    /** Saved game state from previous session */
    readonly savedGameState?: unknown;
    /** Platform event handler (receives validated, gated events) */
    readonly onEvent: (event: GameEvent) => void;
    /** Optional: called when event is dropped by lifecycle gate */
    readonly onEventDropped?: ((event: GameEvent, reason: string) => void) | undefined;
}

/**
 * Result from renderGameNative.
 * Host app mounts GameRoot wherever desired.
 */
export interface NativeRenderResult {
    /** React component to mount in host app's navigation */
    readonly GameRoot: ComponentType;
    /** Session driver for lifecycle control */
    readonly sessionDriver: SessionDriver;
    /** Update accessibility preferences */
    readonly updateAccessibility: (prefs: AccessibilityPrefs) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_ORG_CONFIG: OrgConfig = {
    orgName: 'Default',
    enableCompetitiveFeatures: false,
};

const DEFAULT_PROGRESSION: ProgressionSnapshot = {
    currentLevel: 1,
    sessionsPlayed: 0,
    totalPlayTimeMs: createDuration(0),
    completionCount: 0,
};

// No-op function for default event handler
const noop = (): void => { /* intentionally empty */ };

// ═══════════════════════════════════════════════════════════════════════════════
// NATIVE RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a React Native game component for embedding.
 *
 * Returns a component that can be mounted in the host app's navigation.
 * NO AppRegistry calls are made. The host app controls mounting.
 *
 * @param game - The game registration from createGame()
 * @param runtime - Platform runtime (from app)
 * @param config - Render configuration
 * @returns Object with GameRoot component and lifecycle controls
 *
 * @example
 * ```typescript
 * // Host app code
 * import { renderGameNative } from '@secondsuntech/games-sdk/platform';
 *
 * const { GameRoot, sessionDriver } = renderGameNative(game, runtime, {
 *   orgConfig: { orgName: 'Acme', enableCompetitiveFeatures: true },
 *   progression: userProgression,
 *   onEvent: (event) => sendToBackend(event),
 * });
 *
 * // Mount in navigation
 * function GameScreen() {
 *   return <GameRoot />;
 * }
 *
 * // Start session when ready
 * sessionDriver.startSession(sessionId);
 * ```
 */
export function renderGameNative<TState = unknown>(
    game: GameRegistration<TState>,
    runtime: PlatformRuntime,
    config?: Partial<RenderConfig>
): NativeRenderResult {
    const fullConfig: RenderConfig = {
        orgConfig: config?.orgConfig ?? DEFAULT_ORG_CONFIG,
        progression: config?.progression ?? DEFAULT_PROGRESSION,
        savedGameState: config?.savedGameState,
        onEvent: config?.onEvent ?? noop,
        onEventDropped: config?.onEventDropped,
        theme: config?.theme,
    };

    // Create session driver
    const sessionDriver = createSessionDriver({
        metadata: game.metadata,
        accessibilityPrefs: runtime.accessibilityPrefs,
        themeMode: runtime.themeMode,
        orgConfig: fullConfig.orgConfig,
        progression: fullConfig.progression,
        savedGameState: fullConfig.savedGameState,
        nowMs: runtime.nowMs,
    });

    // Create gated emit
    const gatedEmitOptions = {
        sessionDriver,
        platformEmit: fullConfig.onEvent,
        allowDevLogAfterEnd: true,
        ...(fullConfig.onEventDropped !== undefined && { onEventDropped: fullConfig.onEventDropped }),
    };
    const gatedEmit = createGatedEmit(gatedEmitOptions);

    // Mutable accessibility state (updated via updateAccessibility)
    let currentAccessibility = runtime.accessibilityPrefs;
    let accessibilityListeners: Array<(prefs: AccessibilityPrefs) => void> = [];

    const theme = fullConfig.theme ?? getDefaultTheme(runtime.themeMode);

    // Helper: extract saved state
    const extractSavedState = (context: GameContext): unknown => {
        if (context.state === 'IN_SESSION') {
            return context.savedGameState;
        }
        return undefined;
    };

    // The game root component
    function GameRoot(): React.ReactElement {
        // Subscribe to context changes
        const [context, setContext] = useState<Readonly<GameContext>>(() => sessionDriver.getContext());
        const [accessibility, setAccessibility] = useState(currentAccessibility);

        useEffect(() => {
            const unsubscribe = sessionDriver.subscribe((ctx) => {
                setContext(ctx);
            });
            return unsubscribe;
        }, []);

        // Subscribe to accessibility updates
        useEffect(() => {
            const listener = (prefs: AccessibilityPrefs): void => {
                setAccessibility(prefs);
            };
            accessibilityListeners.push(listener);
            return () => {
                accessibilityListeners = accessibilityListeners.filter((l) => l !== listener);
            };
        }, []);

        const props: GameRenderProps<TState> = {
            context,
            emit: gatedEmit as (event: unknown) => void,
            savedState: extractSavedState(context) as TState | undefined,
        };

        const gameElement = createElement(game.render, props);

        return createElement(
            ThemeProvider,
            {
                theme,
                accessibility,
                children: gameElement,
            }
        );
    }

    return {
        GameRoot,
        sessionDriver,
        updateAccessibility(prefs: AccessibilityPrefs): void {
            currentAccessibility = prefs;
            accessibilityListeners.forEach((listener) => {
                listener(prefs);
            });
        },
    };
}
