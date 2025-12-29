/**
 * @fileoverview Stack Primitive
 * @module @secondsuntech/games-sdk/ui/primitives/Stack
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * STACK PRIMITIVE
 *
 * Vertical or horizontal layout with constrained spacing.
 *
 * RULES:
 * - Stateless. No internal state.
 * - Semantic props only. No arbitrary flexbox freedom.
 * - Spacing comes from theme tokens only.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef, type ReactNode, type CSSProperties } from 'react';
import { useTheme } from '../../theme/context.js';
import type { SpacingToken, ColorToken, RadiusToken } from '../../theme/tokens.js';

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

const ALIGN_MAP: Record<StackAlign, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
};

const JUSTIFY_MAP: Record<StackJustify, string> = {
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
 * Stack - Vertical or horizontal layout primitive.
 *
 * This is a stateless render component. All game state lives in game code.
 * Provides constrained layout without arbitrary flexbox freedom.
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
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
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

    const style: CSSProperties = {
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        alignItems: ALIGN_MAP[align],
        justifyContent: JUSTIFY_MAP[justify],
        boxSizing: 'border-box',

        // Spacing
        ...(spacing !== undefined && {
            gap: theme.spacing(spacing),
        }),

        // Fill
        ...(fill && {
            flex: 1,
            minHeight: 0, // Allow shrinking
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

    // Map role
    const ariaRole = accessibilityRole === 'none' ? undefined : accessibilityRole;

    return (
        <div
            ref={ref}
            style={style}
            role={ariaRole}
            aria-label={accessibilityLabel}
            data-testid={testID}
        >
            {children}
        </div>
    );
});

Stack.displayName = 'Stack';
