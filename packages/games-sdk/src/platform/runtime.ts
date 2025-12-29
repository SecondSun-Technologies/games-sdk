/**
 * @fileoverview Platform Runtime Interface
 * @module @secondsuntech/games-sdk/platform/runtime
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PLATFORM RUNTIME
 *
 * This is the "what the app provides to the SDK" boundary.
 * Games do NOT import this. Only renderGame() consumes it.
 *
 * The platform provides:
 * - Device info (viewport, safe areas, platform kind)
 * - Accessibility preferences
 * - Capability permission checking
 * - Clock/timing surface
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { RuntimePermissionChecker } from '../core/capability-guard.js';
import type { AccessibilityPrefs, ThemeMode } from '../types/context.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM KIND
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Platform identifier.
 */
export type PlatformKind = 'web' | 'ios' | 'android';

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWPORT & LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Viewport dimensions.
 */
export interface Viewport {
    /** Width in logical pixels */
    readonly width: number;
    /** Height in logical pixels */
    readonly height: number;
    /** Device pixel ratio (e.g., 2 for Retina, 3 for 3x) */
    readonly pixelRatio: number;
}

/**
 * Safe area insets (for notches, home indicators, etc.).
 */
export interface SafeAreaInsets {
    /** Top inset (status bar, notch) */
    readonly top: number;
    /** Right inset */
    readonly right: number;
    /** Bottom inset (home indicator) */
    readonly bottom: number;
    /** Left inset */
    readonly left: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM RUNTIME
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Platform-provided runtime environment.
 *
 * This is injected into renderGame() by the platform (or simulator).
 * Games never see or import this interface.
 *
 * @example
 * ```typescript
 * // Platform code (NOT game code)
 * const runtime: PlatformRuntime = {
 *   platform: 'ios',
 *   viewport: { width: 390, height: 844, pixelRatio: 3 },
 *   safeAreaInsets: { top: 47, right: 0, bottom: 34, left: 0 },
 *   accessibilityPrefs: { ... },
 *   themeMode: 'dark',
 *   checkRuntimePermission: (cap) => ({ granted: true }),
 *   nowMs: () => Date.now(),
 * };
 *
 * await renderGame(game, mountPoint, runtime);
 * ```
 */
export interface PlatformRuntime {
    /** Platform identifier */
    readonly platform: PlatformKind;

    /** Device viewport dimensions */
    readonly viewport: Viewport;

    /** Safe area insets for layout */
    readonly safeAreaInsets: SafeAreaInsets;

    /** Accessibility preferences (platform truth) */
    readonly accessibilityPrefs: AccessibilityPrefs;

    /** Current theme mode */
    readonly themeMode: ThemeMode;

    /**
     * Runtime capability permission checker.
     * Uses existing RuntimePermissionChecker from capability-guard.
     */
    readonly checkRuntimePermission: RuntimePermissionChecker;

    /**
     * Clock function for timing.
     * Returns current time in milliseconds.
     * Allows deterministic testing when mocked.
     */
    readonly nowMs: () => number;

    /**
     * Optional structured logging (dev only).
     */
    readonly log?: (
        level: 'debug' | 'info' | 'warn' | 'error',
        msg: string,
        data?: unknown
    ) => void;
}
