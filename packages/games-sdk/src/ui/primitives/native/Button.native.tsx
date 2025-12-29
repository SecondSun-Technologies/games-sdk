/**
 * @fileoverview Button Primitive (React Native)
 * @module @secondsuntech/games-sdk/ui/primitives/native/Button
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * BUTTON PRIMITIVE - REACT NATIVE
 *
 * Primary interaction element. Uses RN Pressable instead of button.
 *
 * RULES:
 * - Stateless (except trivial focus/press states).
 * - Semantic props only. No style objects, no classNames.
 * - Automatic hit target scaling via AccessibilityPrefs.largerTouchTargets.
 * - Semantic variants only (primary, secondary, danger).
 * - NO INTERNAL HAPTICS - violates capability model.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef, useCallback, type ReactNode } from 'react';
import { Pressable, Text, type ViewStyle, type TextStyle, type View } from 'react-native';
import { useTheme } from '../../../theme/context.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Button variant.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * Button size.
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component props.
 * All props are semantic. No arbitrary styles allowed.
 */
export interface ButtonProps {
    /** Button label */
    readonly children: string | ReactNode;
    /** Press handler */
    readonly onPress: () => void;

    // ─────────────────────────────────────────────────────────────────────────────
    // Semantic styling
    // ─────────────────────────────────────────────────────────────────────────────

    /** Button variant */
    readonly variant?: ButtonVariant;
    /** Button size */
    readonly size?: ButtonSize;
    /** Whether button is disabled */
    readonly disabled?: boolean;
    /** Whether button fills available width */
    readonly fullWidth?: boolean;

    // ─────────────────────────────────────────────────────────────────────────────
    // Accessibility
    // ─────────────────────────────────────────────────────────────────────────────

    /** Accessible label (defaults to children if string) */
    readonly accessibilityLabel?: string;
    /** Accessibility hint for screen readers */
    readonly accessibilityHint?: string;
    /** Test ID for testing */
    readonly testID?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIZE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface SizeConfig {
    paddingX: number;
    paddingY: number;
    fontSize: number;
}

const SIZE_CONFIG: Record<ButtonSize, SizeConfig> = {
    sm: { paddingX: 12, paddingY: 6, fontSize: 14 },
    md: { paddingX: 16, paddingY: 10, fontSize: 16 },
    lg: { paddingX: 24, paddingY: 14, fontSize: 18 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Button - Primary interaction element (React Native).
 *
 * Stateless render component (only trivial press state for feedback).
 * Hit target automatically scales with AccessibilityPrefs.largerTouchTargets.
 *
 * NOTE: No haptic feedback is triggered internally. That would violate
 * the capability model. Haptics must go through the capability system.
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button onPress={handleSubmit}>Submit</Button>
 *
 * // Danger button
 * <Button variant="danger" onPress={handleDelete}>Delete</Button>
 *
 * // Full width, large
 * <Button size="lg" fullWidth onPress={handleContinue}>Continue</Button>
 * ```
 */
export const Button = forwardRef<View, ButtonProps>(function Button(
    {
        children,
        onPress,
        variant = 'primary',
        size = 'md',
        disabled = false,
        fullWidth = false,
        accessibilityLabel,
        accessibilityHint,
        testID,
    },
    ref
) {
    const theme = useTheme();

    const handlePress = useCallback(() => {
        if (!disabled) {
            onPress();
        }
    }, [disabled, onPress]);

    // Get size config
    const sizeConfig = SIZE_CONFIG[size];

    // Get colors based on variant
    const getColors = (): { bg: string; text: string; border: string | undefined } => {
        switch (variant) {
            case 'primary':
                return {
                    bg: theme.color('primary'),
                    text: '#FFFFFF',
                    border: undefined,
                };
            case 'secondary':
                return {
                    bg: 'transparent',
                    text: theme.color('primary'),
                    border: theme.color('border'),
                };
            case 'danger':
                return {
                    bg: theme.color('danger'),
                    text: '#FFFFFF',
                    border: undefined,
                };
        }
    };

    const colors = getColors();

    // Ensure minimum hit target for accessibility
    const minHeight = Math.max(
        sizeConfig.paddingY * 2 + sizeConfig.fontSize,
        theme.minHitTarget
    );

    const containerStyle: ViewStyle = {
        // Layout
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        paddingHorizontal: sizeConfig.paddingX,
        paddingVertical: sizeConfig.paddingY,

        // Visual
        backgroundColor: colors.bg,
        borderRadius: theme.radius('md'),

        // Border for secondary
        ...(colors.border !== undefined && {
            borderWidth: 1,
            borderColor: colors.border,
        }),

        // Full width
        ...(fullWidth && { width: '100%' }),

        // Disabled
        ...(disabled && { opacity: 0.5 }),
    };

    const textStyle: TextStyle = {
        color: colors.text,
        fontSize: sizeConfig.fontSize * theme.accessibility.fontScale,
        fontWeight: '500',
    };

    const label = accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

    return (
        <Pressable
            ref={ref}
            style={({ pressed }: { pressed: boolean }) => [
                containerStyle,
                // Visual press feedback only - NO HAPTICS
                pressed && !theme.reduceMotion && !disabled
                    ? { opacity: 0.8, transform: [{ scale: 0.98 }] }
                    : undefined,
            ]}
            onPress={handlePress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled }}
            testID={testID}
        >
            {typeof children === 'string' ? (
                <Text style={textStyle}>{children}</Text>
            ) : (
                children
            )}
        </Pressable>
    );
});

Button.displayName = 'Button';
