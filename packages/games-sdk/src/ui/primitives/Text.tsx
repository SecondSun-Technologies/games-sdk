/**
 * @fileoverview Text Primitive
 * @module @secondsuntech/games-sdk/ui/primitives/Text
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * TEXT PRIMITIVE
 *
 * All text rendering. Replaces <p>, <span>, <h1>, etc.
 *
 * RULES:
 * - Stateless. No internal state.
 * - Semantic props only. No style objects, no classNames.
 * - Auto-scales with AccessibilityPrefs.fontScale.
 * - Games don't compute font sizes. Ever.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef, type CSSProperties } from 'react';
import { useTheme } from '../../theme/context.js';
import type { ColorToken, TypographyToken } from '../../theme/tokens.js';

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
    // Accessibility (mostly automatic, but can be overridden)
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

const FONT_WEIGHT_MAP: Record<NonNullable<TextProps['weight']>, number> = {
    normal: 400,
    medium: 500,
    bold: 700,
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Text - All text rendering primitive.
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
export const Text = forwardRef<HTMLSpanElement, TextProps>(function Text(
    {
        children,
        size = 'body',
        color = 'textPrimary',
        weight = 'normal',
        align = 'left',
        numberOfLines,
        accessibilityLabel,
        accessibilityRole = 'text',
        accessibilityHeadingLevel,
        testID,
    },
    ref
) {
    const theme = useTheme();

    // Compute font size with accessibility scaling
    const fontSize = theme.fontSize(size);

    // Build styles
    const style: CSSProperties = {
        fontSize,
        fontWeight: FONT_WEIGHT_MAP[weight],
        color: theme.color(color),
        textAlign: align,
        margin: 0,
        padding: 0,

        // Truncation
        ...(numberOfLines !== undefined && {
            display: '-webkit-box',
            WebkitLineClamp: numberOfLines,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        }),
    };

    // Determine element type based on accessibility role
    const isHeading = accessibilityRole === 'heading';

    // Map heading level to tag
    const getHeadingTag = (level: 1 | 2 | 3 | 4 | 5 | 6): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' => {
        const tags = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const;
        return tags[level];
    };

    const HeadingTag = isHeading && accessibilityHeadingLevel !== undefined
        ? getHeadingTag(accessibilityHeadingLevel)
        : null;

    // Use heading tag if appropriate, otherwise span
    if (HeadingTag !== null) {
        const Tag = HeadingTag;
        return (
            <Tag
                ref={ref as React.Ref<HTMLHeadingElement>}
                style={style}
                aria-label={accessibilityLabel}
                data-testid={testID}
            >
                {children}
            </Tag>
        );
    }

    return (
        <span
            ref={ref}
            style={style}
            role={isHeading ? 'heading' : undefined}
            aria-level={isHeading ? accessibilityHeadingLevel : undefined}
            aria-label={accessibilityLabel}
            data-testid={testID}
        >
            {children}
        </span>
    );
});

Text.displayName = 'Text';
