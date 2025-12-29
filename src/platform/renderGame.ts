/**
 * @fileoverview Platform Renderer
 * @module @secondsuntech/games-sdk/platform/renderGame
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PLATFORM RENDERER
 *
 * Single entry point for rendering games.
 * Games never bootstrap themselves. No ReactDOM.createRoot in games. Ever.
 *
 * This renderer:
 * - Accepts PlatformRuntime from the app
 * - Creates SessionDriver for lifecycle management
 * - Wraps emit with lifecycle gate
 * - Injects ThemeProvider + AccessibilityProvider
 * - Hides all environment details from games
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { createElement, type ReactElement } from 'react';
import { ThemeProvider } from '../theme/context.js';
import { getDefaultTheme } from '../theme/defaults.js';
import type { Theme } from '../theme/tokens.js';
import type { GameRegistration, GameRenderProps } from '../core/create-game.js';
import type { GameContext, AccessibilityPrefs, OrgConfig, ProgressionSnapshot } from '../types/context.js';
import type { GameEvent } from '../events/event-types.js';
import type { PlatformRuntime } from './runtime.js';
import { createSessionDriver, type SessionDriver } from './session.js';
import { createGatedEmit } from './eventGate.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extended render handle with session control.
 */
export interface RenderHandle {
    /** Get the session driver for lifecycle control */
    readonly sessionDriver: SessionDriver;
    /** Update accessibility preferences */
    updateAccessibility(prefs: AccessibilityPrefs): void;
    /** Unmount the game */
    unmount(): void;
}

/**
 * Configuration for rendering a game.
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

import { createDuration } from '../types/branded.js';

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
// WEB RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

// Type for react-dom/client createRoot (avoid needing @types/react-dom)
interface ReactDOMRoot {
    render(element: ReactElement): void;
    unmount(): void;
}

interface ReactDOMClient {
    createRoot(container: Element): ReactDOMRoot;
}

/**
 * Render a game in a web environment.
 */
async function renderWebWithRuntime<TState>(
    game: GameRegistration<TState>,
    mountPoint: Element,
    runtime: PlatformRuntime,
    config: RenderConfig
): Promise<RenderHandle> {
    // Dynamic import of react-dom/client
    const modulePath = 'react-dom/client';
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const importFn = Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
    const reactDOMClient = await importFn(modulePath) as ReactDOMClient;

    // Create session driver
    const sessionDriver = createSessionDriver({
        metadata: game.metadata,
        accessibilityPrefs: runtime.accessibilityPrefs,
        themeMode: runtime.themeMode,
        orgConfig: config.orgConfig,
        progression: config.progression,
        savedGameState: config.savedGameState,
        nowMs: runtime.nowMs,
    });

    // Create gated emit
    const gatedEmitOptions = {
        sessionDriver,
        platformEmit: config.onEvent,
        allowDevLogAfterEnd: true,
        ...(config.onEventDropped !== undefined && { onEventDropped: config.onEventDropped }),
    };
    const gatedEmit = createGatedEmit(gatedEmitOptions);

    let currentAccessibility = runtime.accessibilityPrefs;
    const theme = config.theme ?? getDefaultTheme(runtime.themeMode);

    const root = reactDOMClient.createRoot(mountPoint);

    // Helper: extract saved state
    const extractSavedState = (context: GameContext): unknown => {
        if (context.state === 'IN_SESSION') {
            return context.savedGameState;
        }
        return undefined;
    };

    const renderApp = (): void => {
        const context = sessionDriver.getContext();

        const props: GameRenderProps<TState> = {
            context,
            emit: gatedEmit as (event: unknown) => void,
            savedState: extractSavedState(context) as TState | undefined,
        };

        const gameElement = createElement(game.render, props);

        const wrappedElement = createElement(
            ThemeProvider,
            {
                theme,
                accessibility: currentAccessibility,
                children: gameElement,
            }
        );

        root.render(wrappedElement);
    };

    // Subscribe to context changes and re-render
    sessionDriver.subscribe(() => {
        renderApp();
    });

    // Initial render
    renderApp();

    return {
        sessionDriver,
        updateAccessibility(prefs: AccessibilityPrefs): void {
            currentAccessibility = prefs;
            renderApp();
        },
        unmount(): void {
            root.unmount();
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// NATIVE RENDERER (PLACEHOLDER)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render a game in a React Native environment.
 */
async function renderNativeWithRuntime<TState>(
    _game: GameRegistration<TState>,
    _runtime: PlatformRuntime,
    _config: RenderConfig
): Promise<RenderHandle> {
    return Promise.reject(new Error(
        '[SDK] React Native rendering is not yet implemented. ' +
        'Contact platform team for native support.'
    ));
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render a game using PlatformRuntime.
 *
 * This is the production API for rendering games.
 *
 * @param game - The game registration from createGame()
 * @param mountPoint - DOM element to mount to (web only)
 * @param runtime - Platform runtime (from app or simulator)
 * @param config - Render configuration
 * @returns Handle for controlling the rendered game
 *
 * @example
 * ```typescript
 * // Platform/simulator code (NOT game code)
 * import { renderGame } from '@secondsuntech/games-sdk/platform';
 *
 * const handle = await renderGame(game, document.getElementById('root')!, runtime, {
 *   orgConfig: { orgName: 'Acme', enableCompetitiveFeatures: true },
 *   progression: userProgression,
 *   onEvent: (event) => sendToBackend(event),
 * });
 *
 * // Start session (platform controls lifecycle)
 * handle.sessionDriver.startSession(sessionId);
 *
 * // Later: end session
 * handle.sessionDriver.endSession('completed');
 * ```
 */
export async function renderGame<TState = unknown>(
    game: GameRegistration<TState>,
    mountPoint: Element | undefined,
    runtime: PlatformRuntime,
    config?: Partial<RenderConfig>
): Promise<RenderHandle> {
    const fullConfig: RenderConfig = {
        orgConfig: config?.orgConfig ?? DEFAULT_ORG_CONFIG,
        progression: config?.progression ?? DEFAULT_PROGRESSION,
        savedGameState: config?.savedGameState,
        onEvent: config?.onEvent ?? noop,
        onEventDropped: config?.onEventDropped,
        theme: config?.theme,
    };

    // Environment detection
    const isWeb = typeof document !== 'undefined';

    if (isWeb) {
        if (mountPoint === undefined) {
            throw new Error('[SDK] mountPoint is required for web rendering');
        }
        return renderWebWithRuntime(game, mountPoint, runtime, fullConfig);
    } else {
        return renderNativeWithRuntime(game, runtime, fullConfig);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE: CREATE GAME ELEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a React element for a game without mounting.
 *
 * Useful for testing or embedding in existing React apps.
 */
export function createGameElement<TState = unknown>(
    game: GameRegistration<TState>,
    runtime: PlatformRuntime,
    config?: Partial<RenderConfig>
): { element: ReactElement; sessionDriver: SessionDriver } {
    const fullConfig: RenderConfig = {
        orgConfig: config?.orgConfig ?? DEFAULT_ORG_CONFIG,
        progression: config?.progression ?? DEFAULT_PROGRESSION,
        savedGameState: config?.savedGameState,
        onEvent: config?.onEvent ?? noop,
        onEventDropped: config?.onEventDropped,
        theme: config?.theme,
    };

    const sessionDriver = createSessionDriver({
        metadata: game.metadata,
        accessibilityPrefs: runtime.accessibilityPrefs,
        themeMode: runtime.themeMode,
        orgConfig: fullConfig.orgConfig,
        progression: fullConfig.progression,
        savedGameState: fullConfig.savedGameState,
        nowMs: runtime.nowMs,
    });

    const gatedEmitOptions = {
        sessionDriver,
        platformEmit: fullConfig.onEvent,
        allowDevLogAfterEnd: true,
        ...(fullConfig.onEventDropped !== undefined && { onEventDropped: fullConfig.onEventDropped }),
    };
    const gatedEmit = createGatedEmit(gatedEmitOptions);

    const context = sessionDriver.getContext();
    const theme = fullConfig.theme ?? getDefaultTheme(runtime.themeMode);

    const extractSavedState = (ctx: GameContext): unknown => {
        if (ctx.state === 'IN_SESSION') {
            return ctx.savedGameState;
        }
        return undefined;
    };

    const props: GameRenderProps<TState> = {
        context,
        emit: gatedEmit as (event: unknown) => void,
        savedState: extractSavedState(context) as TState | undefined,
    };

    const gameElement = createElement(game.render, props);

    const element = createElement(
        ThemeProvider,
        {
            theme,
            accessibility: runtime.accessibilityPrefs,
            children: gameElement,
        }
    );

    return { element, sessionDriver };
}
