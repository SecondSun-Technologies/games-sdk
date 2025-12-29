/**
 * @fileoverview Theme Token Definitions
 * @module @secondsuntech/games-sdk/theme/tokens
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * THEME TOKENS
 *
 * Games consume these tokens. They do not define colors, spacing, or typography.
 * The SDK owns the design system. Games express intent through semantic tokens.
 *
 * This ensures:
 * - Visual consistency across all games
 * - Automatic dark mode support
 * - Accessibility compliance (font scaling, contrast)
 * - Platform branding capability
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Color tokens for the theme.
 * Games select from these. They do not define arbitrary colors.
 */
export interface ColorTokens {
    /** Primary background color */
    readonly background: string;
    /** Elevated surface color (cards, modals) */
    readonly surface: string;
    /** Primary brand/action color */
    readonly primary: string;
    /** Primary text color */
    readonly textPrimary: string;
    /** Secondary/muted text color */
    readonly textSecondary: string;
    /** Danger/error color */
    readonly danger: string;
    /** Success color */
    readonly success: string;
    /** Warning color */
    readonly warning: string;
    /** Border/divider color */
    readonly border: string;
}

/**
 * Spacing tokens in logical pixels.
 * All spacing uses these values. No arbitrary numbers.
 */
export interface SpacingTokens {
    /** Extra small: 4px */
    readonly xs: number;
    /** Small: 8px */
    readonly sm: number;
    /** Medium: 16px */
    readonly md: number;
    /** Large: 24px */
    readonly lg: number;
    /** Extra large: 32px */
    readonly xl: number;
    /** Extra extra large: 48px */
    readonly xxl: number;
}

/**
 * Typography tokens as base font sizes.
 * Actual sizes are computed by multiplying with AccessibilityPrefs.fontScale.
 */
export interface TypographyTokens {
    /** Caption text: 12px base */
    readonly caption: number;
    /** Body text: 16px base */
    readonly body: number;
    /** Heading text: 24px base */
    readonly heading: number;
    /** Title text: 32px base */
    readonly title: number;
}

/**
 * Border radius tokens in logical pixels.
 */
export interface RadiusTokens {
    /** Small radius: 4px */
    readonly sm: number;
    /** Medium radius: 8px */
    readonly md: number;
    /** Large radius: 16px */
    readonly lg: number;
    /** Full/pill radius: 9999px */
    readonly full: number;
}

/**
 * Complete theme token set.
 */
export interface ThemeTokens {
    readonly colors: ColorTokens;
    readonly spacing: SpacingTokens;
    readonly typography: TypographyTokens;
    readonly radius: RadiusTokens;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTIC TOKEN NAMES (for props)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Color token names for component props.
 */
export type ColorToken = keyof ColorTokens;

/**
 * Spacing token names for component props.
 */
export type SpacingToken = keyof SpacingTokens;

/**
 * Typography size names for component props.
 */
export type TypographyToken = keyof TypographyTokens;

/**
 * Radius token names for component props.
 */
export type RadiusToken = keyof RadiusTokens;

// ═══════════════════════════════════════════════════════════════════════════════
// THEME MODE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Theme mode (light or dark).
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Complete theme including mode.
 */
export interface Theme {
    readonly mode: ThemeMode;
    readonly tokens: ThemeTokens;
}
