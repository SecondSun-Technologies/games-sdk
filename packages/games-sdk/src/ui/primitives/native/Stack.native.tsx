/**
 * @fileoverview Stack Primitive (React Native)
 * @module @secondsuntech/games-sdk/ui/primitives/native/Stack
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * STACK PRIMITIVE - REACT NATIVE
 *
 * Vertical or horizontal layout with constrained spacing.
 *
 * RULES:
 * - Stateless. No internal state.
 * - Semantic props only. No arbitrary flexbox freedom.
 * - Spacing comes from theme tokens only.
 * - Gap is simulated via margin (RN has no CSS gap).
 * - Spacing applies BETWEEN children only, not edges.
 * - Nested stacks: outer stack owns spacing between its direct children.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef, Children, type ReactNode, type ReactElement, isValidElement } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../../theme/context.js';
import type { SpacingToken, ColorToken, RadiusToken } from '../../../theme/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stack direction.
 */
export type StackDirection = 'vertical' | 'horizontal';

/**
 * Stack alignment (cross-axis).
 */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

/**
 * Stack justification (main-axis).
 */
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

/**
 * Stack component props.
 * All props are semantic. No arbitrary styles allowed.
 */
export interface StackProps {
    /** Child elements */
    readonly children: ReactNode;

    // ─────────────────────────────────────────────────────────────────────────────
    // Layout props
    // ─────────────────────────────────────────────────────────────────────────────

    /** Stack direction */
    readonly direction: StackDirection;
    /** Space between children using spacing token */
    readonly spacing?: SpacingToken;
    /** Cross-axis alignment */
    readonly align?: StackAlign;
    /** Main-axis justification */
    readonly justify?: StackJustify;
    /** Whether stack fills available space */
    readonly fill?: boolean;

    // ─────────────────────────────────────────────────────────────────────────────
    // Container styling (semantic only)
    // ─────────────────────────────────────────────────────────────────────────────

    /** Padding using spacing token */
    readonly padding?: SpacingToken;
    /** Background color using color token */
    readonly background?: ColorToken;
    /** Border radius using radius token */
    readonly radius?: RadiusToken;

    // ─────────────────────────────────────────────────────────────────────────────
    // Accessibility
    // ─────────────────────────────────────────────────────────────────────────────

    /** Accessible label */
    readonly accessibilityLabel?: string;
    /** Accessibility role */
    readonly accessibilityRole?: 'none' | 'group' | 'list' | 'navigation';
    /** Test ID for testing */
    readonly testID?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALIGNMENT MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const ALIGN_MAP: Record<StackAlign, ViewStyle['alignItems']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
};

const JUSTIFY_MAP: Record<StackJustify, ViewStyle['justifyContent']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stack - Vertical or horizontal layout primitive (React Native).
 *
 * This is a stateless render component. All game state lives in game code.
 * Provides constrained layout without arbitrary flexbox freedom.
 *
 * Gap is simulated via margins between children (RN has no CSS gap).
 * Spacing applies BETWEEN children only, not at edges.
 *
 * @example
 * ```tsx
 * // Vertical stack with medium spacing
 * <Stack direction="vertical" spacing="md">
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 * </Stack>
 *
 * // Horizontal stack, centered
 * <Stack direction="horizontal" spacing="sm" align="center" justify="between">
 *   <Text>Left</Text>
 *   <Text>Right</Text>
 * </Stack>
 * ```
 */
export const Stack = forwardRef<View, StackProps>(function Stack(
    {
        children,
        direction,
        spacing,
        align = 'stretch',
        justify = 'start',
        fill = false,
        padding,
        background,
        radius,
        accessibilityLabel,
        accessibilityRole = 'none',
        testID,
    },
    ref
) {
    const theme = useTheme();
    const spacingValue = spacing !== undefined ? theme.spacing(spacing) : 0;
    const isVertical = direction === 'vertical';

    const containerStyle: ViewStyle = {
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: ALIGN_MAP[align],
        justifyContent: JUSTIFY_MAP[justify],

        // Fill
        ...(fill && {
            flex: 1,
        }),

        // Container styling
        ...(padding !== undefined && {
            padding: theme.spacing(padding),
        }),
        ...(background !== undefined && {
            backgroundColor: theme.color(background),
        }),
        ...(radius !== undefined && {
            borderRadius: theme.radius(radius),
        }),
    };

    // Apply margin between children (gap simulation)
    const childrenArray = Children.toArray(children).filter(isValidElement);
    const lastIndex = childrenArray.length - 1;

    const styledChildren = childrenArray.map((child, index) => {
        // Don't apply margin to last child
        if (index === lastIndex || spacingValue === 0) {
            return child;
        }

        const marginStyle: ViewStyle = isVertical
            ? { marginBottom: spacingValue }
            : { marginRight: spacingValue };

        // Wrap in View to apply margin
        return (
            <View key={(child as ReactElement).key ?? index} style={marginStyle}>
                {child}
            </View>
        );
    });

    // Map role to RN accessibility role
    const getRNAccessibilityRole = (): 'none' | 'menu' | undefined => {
        switch (accessibilityRole) {
            case 'none':
                return 'none';
            case 'navigation':
                return 'menu';
            case 'group':
            case 'list':
                return undefined;
            default:
                return undefined;
        }
    };

    return (
        <View
            ref={ref}
            style={containerStyle}
            accessibilityRole={getRNAccessibilityRole()}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
        >
            {styledChildren}
        </View>
    );
});

Stack.displayName = 'Stack';
