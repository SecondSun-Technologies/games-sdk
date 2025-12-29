/**
 * @fileoverview Theme Context and Provider
 * @module @secondsuntech/games-sdk/theme/context
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * THEME CONTEXT
 *
 * Provides theme tokens and accessibility-aware computed values to all primitives.
 * Games never interact with this directly—it's injected by the platform renderer.
 *
 * The context combines:
 * - Theme tokens (colors, spacing, typography, radius)
 * - Accessibility prefs (fontScale, reduceMotion, etc.)
 * - Computed values (scaled typography, expanded hit targets)
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Theme, ThemeTokens, SpacingToken, ColorToken, TypographyToken, RadiusToken } from './tokens.js';
import { getDefaultTheme } from './defaults.js';
import type { AccessibilityPrefs } from '../types/context.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT VALUE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolved theme context value.
 * Includes raw tokens and computed accessibility-aware values.
 */
export interface ThemeContextValue {
    /** Raw theme tokens */
    readonly tokens: ThemeTokens;
    /** Current theme mode */
    readonly mode: 'light' | 'dark';
    /** Accessibility preferences */
    readonly accessibility: AccessibilityPrefs;

    // Computed helpers
    /** Get color value from token name */
    readonly color: (token: ColorToken) => string;
    /** Get spacing value from token name */
    readonly spacing: (token: SpacingToken) => number;
    /** Get font size with accessibility scaling applied */
    readonly fontSize: (token: TypographyToken) => number;
    /** Get radius value from token name */
    readonly radius: (token: RadiusToken) => number;
    /** Get minimum hit target size (44px base, larger if accessibility enabled) */
    readonly minHitTarget: number;
    /** Whether motion should be reduced */
    readonly reduceMotion: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT ACCESSIBILITY PREFS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_ACCESSIBILITY: AccessibilityPrefs = {
    reduceMotion: false,
    highContrast: false,
    fontScale: 1.0,
    screenReaderActive: false,
    largerTouchTargets: false,
    colorBlindMode: 'none',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Theme context.
 * Primitives use this to access tokens and computed values.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Props for ThemeProvider.
 */
export interface ThemeProviderProps {
    /** Theme to use (mode + tokens) */
    readonly theme?: Theme;
    /** Accessibility preferences from platform */
    readonly accessibility?: AccessibilityPrefs;
    /** Children to render */
    readonly children: ReactNode;
}

/**
 * Theme provider component.
 * Injected by platform renderer. Games never use this directly.
 *
 * @internal
 */
export function ThemeProvider({
    theme,
    accessibility = DEFAULT_ACCESSIBILITY,
    children,
}: ThemeProviderProps): ReactNode {
    const resolvedTheme = theme ?? getDefaultTheme('light');

    const value = useMemo((): ThemeContextValue => {
        const tokens = resolvedTheme.tokens;

        // Base hit target size (44px is iOS minimum)
        const baseHitTarget = 44;
        const minHitTarget = accessibility.largerTouchTargets
            ? baseHitTarget * 1.5
            : baseHitTarget;

        return {
            tokens,
            mode: resolvedTheme.mode,
            accessibility,

            color: (token: ColorToken): string => tokens.colors[token],

            spacing: (token: SpacingToken): number => tokens.spacing[token],

            fontSize: (token: TypographyToken): number => {
                const base = tokens.typography[token];
                return Math.round(base * accessibility.fontScale);
            },

            radius: (token: RadiusToken): number => tokens.radius[token],

            minHitTarget,
            reduceMotion: accessibility.reduceMotion,
        };
    }, [resolvedTheme, accessibility]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Access the current theme context.
 * Used internally by primitives. Games should not need this directly.
 *
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (context === null) {
        throw new Error(
            '[SDK] useTheme must be used within a ThemeProvider. ' +
            'Ensure the game is rendered via renderGame() from @secondsuntech/games-sdk/platform.'
        );
    }

    return context;
}

/**
 * Check if theme context is available.
 * Useful for graceful fallbacks in development.
 */
export function useThemeOptional(): ThemeContextValue | null {
    return useContext(ThemeContext);
}
