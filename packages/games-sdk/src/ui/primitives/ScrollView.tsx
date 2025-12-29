/**
 * @fileoverview ScrollView Primitive
 * @module @secondsuntech/games-sdk/ui/primitives/ScrollView
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * SCROLLVIEW PRIMITIVE
 *
 * Scrolling container.
 *
 * RULES:
 * - Stateless. No internal state.
 * - Semantic props only.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef, type ReactNode, type CSSProperties } from 'react';
import { useTheme } from '../../theme/context.js';
import type { SpacingToken, ColorToken } from '../../theme/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ScrollView component props.
 */
export interface ScrollViewProps {
    /** Scrollable content */
    readonly children: ReactNode;

    // ─────────────────────────────────────────────────────────────────────────────
    // Scroll behavior
    // ─────────────────────────────────────────────────────────────────────────────

    /** Scroll direction */
    readonly direction?: 'vertical' | 'horizontal' | 'both';
    /** Whether to show scroll indicators */
    readonly showScrollIndicators?: boolean;

    // ─────────────────────────────────────────────────────────────────────────────
    // Container styling (semantic only)
    // ─────────────────────────────────────────────────────────────────────────────

    /** Padding using spacing token */
    readonly padding?: SpacingToken;
    /** Background color using color token */
    readonly background?: ColorToken;
    /** Whether to fill available height */
    readonly fill?: boolean;

    // ─────────────────────────────────────────────────────────────────────────────
    // Accessibility
    // ─────────────────────────────────────────────────────────────────────────────

    /** Accessible label */
    readonly accessibilityLabel?: string;
    /** Test ID for testing */
    readonly testID?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ScrollView - Scrolling container primitive.
 *
 * This is a stateless render component.
 *
 * @example
 * ```tsx
 * // Vertical scroll
 * <ScrollView fill>
 *   <Stack direction="vertical" spacing="sm">
 *     {items.map(item => <Text key={item.id}>{item.name}</Text>)}
 *   </Stack>
 * </ScrollView>
 *
 * // Horizontal scroll
 * <ScrollView direction="horizontal">
 *   <Stack direction="horizontal" spacing="md">
 *     {cards.map(card => <Card key={card.id} {...card} />)}
 *   </Stack>
 * </ScrollView>
 * ```
 */
export const ScrollView = forwardRef<HTMLDivElement, ScrollViewProps>(function ScrollView(
    {
        children,
        direction = 'vertical',
        showScrollIndicators = true,
        padding,
        background,
        fill = false,
        accessibilityLabel,
        testID,
    },
    ref
) {
    const theme = useTheme();

    const getOverflow = (): CSSProperties => {
        switch (direction) {
            case 'vertical':
                return { overflowY: 'auto', overflowX: 'hidden' };
            case 'horizontal':
                return { overflowX: 'auto', overflowY: 'hidden' };
            case 'both':
                return { overflow: 'auto' };
        }
    };

    const style: CSSProperties = {
        ...getOverflow(),
        boxSizing: 'border-box',
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS

        // Fill
        ...(fill && {
            flex: 1,
            minHeight: 0,
        }),

        // Container styling
        ...(padding !== undefined && {
            padding: theme.spacing(padding),
        }),
        ...(background !== undefined && {
            backgroundColor: theme.color(background),
        }),

        // Hide scrollbars if requested
        ...(!showScrollIndicators && {
            scrollbarWidth: 'none' as const, // Firefox
            msOverflowStyle: 'none' as const, // IE/Edge
        }),
    };

    // Additional CSS for hiding WebKit scrollbars would need to be in a stylesheet
    // or use a CSS-in-JS solution. For now, we handle it at the style level where possible.

    return (
        <div
            ref={ref}
            style={style}
            role="region"
            aria-label={accessibilityLabel}
            tabIndex={0}
            data-testid={testID}
        >
            {children}
        </div>
    );
});

ScrollView.displayName = 'ScrollView';
