/**
 * @fileoverview Button Primitive
 * @module @secondsuntech/games-sdk/ui/primitives/Button
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * BUTTON PRIMITIVE
 *
 * Primary interaction element. Replaces <button>.
 *
 * RULES:
 * - Stateless (except trivial focus/press states).
 * - Semantic props only. No style objects, no classNames.
 * - Automatic hit target scaling via AccessibilityPrefs.largerTouchTargets.
 * - Semantic variants only (primary, secondary, danger).
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { forwardRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { useTheme } from '../../theme/context.js';

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
 * Button - Primary interaction element.
 *
 * Stateless render component (only trivial press state for feedback).
 * Hit target automatically scales with AccessibilityPrefs.largerTouchTargets.
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
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
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

    // Trivial press state for visual feedback (allowed per rules)
    const [isPressed, setIsPressed] = useState(false);

    const handleMouseDown = useCallback(() => {
        if (!disabled) setIsPressed(true);
    }, [disabled]);

    const handleMouseUp = useCallback(() => {
        setIsPressed(false);
    }, []);

    const handleClick = useCallback(() => {
        if (!disabled) onPress();
    }, [disabled, onPress]);

    // Get size config
    const sizeConfig = SIZE_CONFIG[size];

    // Get colors based on variant
    const getColors = (): { bg: string; text: string; hoverBg: string } => {
        switch (variant) {
            case 'primary':
                return {
                    bg: theme.color('primary'),
                    text: '#FFFFFF',
                    hoverBg: theme.color('primary'),
                };
            case 'secondary':
                return {
                    bg: 'transparent',
                    text: theme.color('primary'),
                    hoverBg: theme.color('surface'),
                };
            case 'danger':
                return {
                    bg: theme.color('danger'),
                    text: '#FFFFFF',
                    hoverBg: theme.color('danger'),
                };
        }
    };

    const colors = getColors();

    // Ensure minimum hit target for accessibility
    const minHeight = Math.max(
        sizeConfig.paddingY * 2 + sizeConfig.fontSize,
        theme.minHitTarget
    );

    const style: CSSProperties = {
        // Reset
        border: variant === 'secondary' ? `1px solid ${theme.color('border')}` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        outline: 'none',

        // Layout
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        paddingLeft: sizeConfig.paddingX,
        paddingRight: sizeConfig.paddingX,
        paddingTop: sizeConfig.paddingY,
        paddingBottom: sizeConfig.paddingY,
        boxSizing: 'border-box',

        // Visual
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: sizeConfig.fontSize * theme.accessibility.fontScale,
        fontWeight: 500,
        borderRadius: theme.radius('md'),

        // States
        opacity: disabled ? 0.5 : isPressed ? 0.8 : 1,
        transform: isPressed && !theme.reduceMotion ? 'scale(0.98)' : undefined,
        transition: theme.reduceMotion ? 'none' : 'transform 0.1s, opacity 0.1s',

        // Full width
        ...(fullWidth && { width: '100%' }),
    };

    const label = accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

    return (
        <button
            ref={ref}
            type="button"
            style={style}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            disabled={disabled}
            aria-label={label}
            aria-disabled={disabled}
            title={accessibilityHint}
            data-testid={testID}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';
