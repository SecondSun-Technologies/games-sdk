/**
 * @fileoverview View Primitive (React Native)
 * @module @secondsuntech/games-sdk/ui/primitives/native/View
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * VIEW PRIMITIVE - REACT NATIVE
 *
 * The base layout container. Uses RN View instead of div.
 *
 * RULES:
 * - Stateless. No internal state beyond trivial focus.
 * - Semantic props only. No style objects, no classNames.
 * - Games compute position values (x, y, scale), View applies them.
 * - Safe area comes from PlatformRuntime via context, NOT from device.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef, type ReactNode } from 'react';
import { View as RNView, type ViewStyle } from 'react-native';
import { useTheme } from '../../../theme/context.js';
import type { SpacingToken, ColorToken, RadiusToken } from '../../../theme/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * View component props.
 * All props are semantic. No arbitrary styles allowed.
 */
export interface ViewProps {
    /** Child elements */
    readonly children?: ReactNode;

    // ─────────────────────────────────────────────────────────────────────────────
    // Semantic layout props (from theme tokens)
    // ─────────────────────────────────────────────────────────────────────────────

    /** Padding (all sides) using spacing token */
    readonly padding?: SpacingToken;
    /** Horizontal padding using spacing token */
    readonly paddingX?: SpacingToken;
    /** Vertical padding using spacing token */
    readonly paddingY?: SpacingToken;
    /** Margin (all sides) using spacing token */
    readonly margin?: SpacingToken;
    /** Background color using color token */
    readonly background?: ColorToken;
    /** Border radius using radius token */
    readonly radius?: RadiusToken;
    /** Flex grow value */
    readonly flex?: number;

    // ─────────────────────────────────────────────────────────────────────────────
    // Computed positioning (from game logic)
    // ─────────────────────────────────────────────────────────────────────────────

    /** X position offset (computed by game) */
    readonly x?: number;
    /** Y position offset (computed by game) */
    readonly y?: number;
    /** Scale factor (computed by game) */
    readonly scale?: number;
    /** Opacity 0-1 (computed by game) */
    readonly opacity?: number;
    /** Rotation in degrees (computed by game) */
    readonly rotation?: number;

    // ─────────────────────────────────────────────────────────────────────────────
    // Accessibility
    // ─────────────────────────────────────────────────────────────────────────────

    /** Accessible label for screen readers */
    readonly accessibilityLabel?: string;
    /** Accessibility role */
    readonly accessibilityRole?: 'none' | 'group' | 'region' | 'list' | 'listitem';
    /** Test ID for testing */
    readonly testID?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * View - Base layout container primitive (React Native).
 *
 * This is a stateless render component. All game state lives in game code.
 *
 * @example
 * ```tsx
 * // Semantic styling via tokens
 * <View padding="md" background="surface" radius="md">
 *   <Text>Content</Text>
 * </View>
 *
 * // Computed positioning from game logic
 * <View x={computedX} y={computedY} scale={scale}>
 *   <Text>Positioned</Text>
 * </View>
 * ```
 */
export const View = forwardRef<RNView, ViewProps>(function View(
    {
        children,
        padding,
        paddingX,
        paddingY,
        margin,
        background,
        radius,
        flex,
        x,
        y,
        scale,
        opacity,
        rotation,
        accessibilityLabel,
        accessibilityRole = 'none',
        testID,
    },
    ref
) {
    const theme = useTheme();

    // Build transform array from computed values
    const transforms: ViewStyle['transform'] = [];
    if (x !== undefined || y !== undefined) {
        transforms.push({ translateX: x ?? 0 });
        transforms.push({ translateY: y ?? 0 });
    }
    if (scale !== undefined) {
        transforms.push({ scale });
    }
    if (rotation !== undefined) {
        transforms.push({ rotate: `${String(rotation)}deg` });
    }

    // Compute styles from semantic props
    const style: ViewStyle = {
        // Spacing
        ...(padding !== undefined && {
            padding: theme.spacing(padding),
        }),
        ...(paddingX !== undefined && {
            paddingHorizontal: theme.spacing(paddingX),
        }),
        ...(paddingY !== undefined && {
            paddingVertical: theme.spacing(paddingY),
        }),
        ...(margin !== undefined && {
            margin: theme.spacing(margin),
        }),

        // Visual
        ...(background !== undefined && {
            backgroundColor: theme.color(background),
        }),
        ...(radius !== undefined && {
            borderRadius: theme.radius(radius),
        }),

        // Flex
        ...(flex !== undefined && {
            flex,
        }),

        // Computed transforms
        ...(transforms.length > 0 && {
            transform: transforms,
        }),

        // Opacity
        ...(opacity !== undefined && {
            opacity,
        }),
    };

    // Map role to RN accessibility role
    const getRNAccessibilityRole = (): 'none' | 'adjustable' | 'summary' | undefined => {
        switch (accessibilityRole) {
            case 'none':
                return 'none';
            case 'group':
            case 'region':
                return 'summary';
            case 'list':
            case 'listitem':
                return undefined; // RN handles differently
            default:
                return undefined;
        }
    };

    return (
        <RNView
            ref={ref}
            style={style}
            accessibilityRole={getRNAccessibilityRole()}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
        >
            {children}
        </RNView>
    );
});

View.displayName = 'View';
