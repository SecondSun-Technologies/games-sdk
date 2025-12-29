/**
 * @fileoverview Default Theme Definitions
 * @module @secondsuntech/games-sdk/theme/defaults
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DEFAULT THEMES
 *
 * SDK-owned default themes for light and dark mode.
 * These may be extended by platform/org configuration, but games never modify them.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { ThemeTokens, Theme } from './tokens.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TOKENS (mode-independent)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Spacing values in logical pixels.
 * Consistent across light/dark modes.
 */
const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

/**
 * Base typography sizes in logical pixels.
 * Multiplied by fontScale for accessibility.
 */
const TYPOGRAPHY = {
    caption: 12,
    body: 16,
    heading: 24,
    title: 32,
} as const;

/**
 * Border radius values in logical pixels.
 */
const RADIUS = {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// LIGHT THEME
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Light mode color tokens.
 */
const LIGHT_COLORS = {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    primary: '#6366F1',      // Indigo
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    border: '#E5E7EB',
} as const;

/**
 * Complete light theme tokens.
 */
export const LIGHT_THEME_TOKENS: ThemeTokens = {
    colors: LIGHT_COLORS,
    spacing: SPACING,
    typography: TYPOGRAPHY,
    radius: RADIUS,
};

/**
 * Light theme.
 */
export const LIGHT_THEME: Theme = {
    mode: 'light',
    tokens: LIGHT_THEME_TOKENS,
};

// ═══════════════════════════════════════════════════════════════════════════════
// DARK THEME
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Dark mode color tokens.
 */
const DARK_COLORS = {
    background: '#111827',
    surface: '#1F2937',
    primary: '#818CF8',      // Lighter indigo for dark mode
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    border: '#374151',
} as const;

/**
 * Complete dark theme tokens.
 */
export const DARK_THEME_TOKENS: ThemeTokens = {
    colors: DARK_COLORS,
    spacing: SPACING,
    typography: TYPOGRAPHY,
    radius: RADIUS,
};

/**
 * Dark theme.
 */
export const DARK_THEME: Theme = {
    mode: 'dark',
    tokens: DARK_THEME_TOKENS,
};

// ═══════════════════════════════════════════════════════════════════════════════
// THEME SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the default theme for a given mode.
 */
export function getDefaultTheme(mode: 'light' | 'dark'): Theme {
    return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}
