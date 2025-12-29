/**
 * @fileoverview Text Primitive (React Native)
 * @module @secondsuntech/games-sdk/ui/primitives/native/Text
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * TEXT PRIMITIVE - REACT NATIVE
 *
 * All text rendering. Uses RN Text instead of span.
 *
 * RULES:
 * - Stateless. No internal state.
 * - Semantic props only. No style objects, no classNames.
 * - Auto-scales with AccessibilityPrefs.fontScale.
 * - Games don't compute font sizes. Ever.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef } from 'react';
import { Text as RNText, type TextStyle } from 'react-native';
import { useTheme } from '../../../theme/context.js';
import type { ColorToken, TypographyToken } from '../../../theme/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Text component props.
 * All props are semantic. No arbitrary styles allowed.
 */
export interface TextProps {
    /** Text content */
    readonly children: string;

    // ─────────────────────────────────────────────────────────────────────────────
    // Semantic typography props
    // ─────────────────────────────────────────────────────────────────────────────

    /** Text size using typography token */
    readonly size?: TypographyToken;
    /** Text color using color token */
    readonly color?: ColorToken;
    /** Font weight */
    readonly weight?: 'normal' | 'medium' | 'bold';
    /** Text alignment */
    readonly align?: 'left' | 'center' | 'right';
    /** Number of lines before truncation (undefined = no limit) */
    readonly numberOfLines?: number;

    // ─────────────────────────────────────────────────────────────────────────────
    // Accessibility
    // ─────────────────────────────────────────────────────────────────────────────

    /** Override accessible label (defaults to children) */
    readonly accessibilityLabel?: string;
    /** Whether this is a heading (for screen readers) */
    readonly accessibilityRole?: 'text' | 'heading';
    /** Heading level if role is heading */
    readonly accessibilityHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Test ID for testing */
    readonly testID?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEIGHT MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const FONT_WEIGHT_MAP: Record<NonNullable<TextProps['weight']>, TextStyle['fontWeight']> = {
    normal: '400',
    medium: '500',
    bold: '700',
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Text - All text rendering primitive (React Native).
 *
 * This is a stateless render component. All game state lives in game code.
 * Font size is automatically scaled based on AccessibilityPrefs.fontScale.
 *
 * @example
 * ```tsx
 * // Basic text
 * <Text>Hello world</Text>
 *
 * // Styled text
 * <Text size="heading" weight="bold" color="primary">
 *   Important Title
 * </Text>
 *
 * // Truncated text
 * <Text numberOfLines={2}>
 *   This very long text will be truncated after two lines...
 * </Text>
 * ```
 */
export const Text = forwardRef<RNText, TextProps>(function Text(
    {
        children,
        size = 'body',
        color = 'textPrimary',
        weight = 'normal',
        align = 'left',
        numberOfLines,
        accessibilityLabel,
        accessibilityRole = 'text',
        _accessibilityHeadingLevel,
        testID,
    },
    ref
) {
    const theme = useTheme();

    // Compute font size with accessibility scaling
    const fontSize = theme.fontSize(size);

    // Build styles
    const style: TextStyle = {
        fontSize,
        fontWeight: FONT_WEIGHT_MAP[weight],
        color: theme.color(color),
        textAlign: align,
    };

    // Determine RN accessibility props
    const isHeading = accessibilityRole === 'heading';

    return (
        <RNText
            ref={ref}
            style={style}
            numberOfLines={numberOfLines}
            ellipsizeMode={numberOfLines !== undefined ? 'tail' : undefined}
            accessibilityRole={isHeading ? 'header' : 'text'}
            accessibilityLabel={accessibilityLabel ?? children}
            // RN doesn't have heading levels, but we keep the prop for parity
            testID={testID}
        >
            {children}
        </RNText>
    );
});

Text.displayName = 'Text';
