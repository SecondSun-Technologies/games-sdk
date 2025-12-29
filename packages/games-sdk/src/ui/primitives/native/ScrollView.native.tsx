/**
 * @fileoverview ScrollView Primitive (React Native)
 * @module @secondsuntech/games-sdk/ui/primitives/native/ScrollView
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * SCROLLVIEW PRIMITIVE - REACT NATIVE
 *
 * Scrolling container. Uses RN ScrollView.
 *
 * RULES:
 * - Stateless. No internal state.
 * - Semantic props only.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef, type ReactNode } from 'react';
import { ScrollView as RNScrollView, type ViewStyle } from 'react-native';
import { useTheme } from '../../../theme/context.js';
import type { SpacingToken, ColorToken } from '../../../theme/tokens.js';

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
 * ScrollView - Scrolling container primitive (React Native).
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
export const ScrollView = forwardRef<RNScrollView, ScrollViewProps>(function ScrollView(
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

    const containerStyle: ViewStyle = {
        // Fill
        ...(fill && {
            flex: 1,
        }),

        // Container styling
        ...(background !== undefined && {
            backgroundColor: theme.color(background),
        }),
    };

    const contentContainerStyle: ViewStyle = {
        ...(padding !== undefined && {
            padding: theme.spacing(padding),
        }),

        // For horizontal, content should be row-aligned
        ...(direction === 'horizontal' && {
            flexDirection: 'row',
        }),
    };

    return (
        <RNScrollView
            ref={ref}
            style={containerStyle}
            contentContainerStyle={contentContainerStyle}
            horizontal={direction === 'horizontal'}
            showsVerticalScrollIndicator={showScrollIndicators && direction !== 'horizontal'}
            showsHorizontalScrollIndicator={showScrollIndicators && direction === 'horizontal'}
            keyboardShouldPersistTaps="handled"
            accessibilityRole="scrollbar"
            accessibilityLabel={accessibilityLabel}
            testID={testID}
        >
            {children}
        </RNScrollView>
    );
});

ScrollView.displayName = 'ScrollView';
