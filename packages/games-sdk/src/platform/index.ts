/**
 * @fileoverview Platform Module Public Exports
 * @module @secondsuntech/games-sdk/platform
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PLATFORM RENDERER
 *
 * Single entry point for rendering games.
 * Used by platform code and simulator, NOT by games.
 * ══════════════════════════════════════════════════════════════════════════════
 */

// Renderer
export {
    renderGame,
    createGameElement,
    type RenderHandle,
    type RenderConfig,
} from './renderGame.js';

// Runtime interface (platform provides this)
export {
    type PlatformRuntime,
    type PlatformKind,
    type Viewport,
    type SafeAreaInsets,
} from './runtime.js';

// Session lifecycle driver
export {
    createSessionDriver,
    type SessionDriver,
    type SessionDriverConfig,
} from './session.js';

// Event lifecycle gate
export {
    createGatedEmit,
    type GatedEmit,
    type GatedEmitOptions,
} from './eventGate.js';
