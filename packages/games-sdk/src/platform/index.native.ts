/**
 * @fileoverview Platform Package Entry Point (React Native)
 * @module @secondsuntech/games-sdk/platform (native)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PLATFORM PACKAGE - REACT NATIVE
 *
 * Native-specific platform exports. Resolved via conditional exports.
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// NATIVE RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

export {
    renderGameNative,
    type RenderConfig,
    type NativeRenderResult,
} from './renderGame.native.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES (same as web)
// ═══════════════════════════════════════════════════════════════════════════════

export {
    type PlatformRuntime,
    type PlatformKind,
    type Viewport,
    type SafeAreaInsets,
} from './runtime.js';

export {
    type SessionDriver,
} from './session.js';

export {
    type GatedEmit,
    type GatedEmitOptions,
    createGatedEmit,
} from './eventGate.js';
