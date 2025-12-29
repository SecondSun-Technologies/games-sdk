/**
 * @fileoverview Motion Abstraction
 * @module @secondsuntech/games-sdk/ui/animation/motion
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * MOTION SYSTEM
 *
 * Intent-based motion styles, NOT animation engines.
 *
 * The SDK does NOT provide:
 * - Timelines
 * - Easing libraries
 * - Spring engines
 * - Choreography systems
 *
 * Instead, games compute animation values themselves, SDK applies them.
 * This module provides semantic motion intent that respects reduceMotion.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { useMemo } from 'react';
import { useTheme } from '../../theme/context.js';

// ═══════════════════════════════════════════════════════════════════════════════
// MOTION INTENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Semantic motion intents.
 * Games request intent, SDK resolves to appropriate motion.
 */
export type MotionIntent =
    | 'appear'
    | 'disappear'
    | 'emphasize'
    | 'feedback-success'
    | 'feedback-error'
    | 'press'
    | 'hover';

// ═══════════════════════════════════════════════════════════════════════════════
// MOTION STYLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Motion style properties that can be applied to primitives.
 */
export interface MotionStyle {
    /** Opacity value */
    readonly opacity?: number;
    /** Transform string */
    readonly transform?: string;
    /** Transition CSS */
    readonly transition?: string;
}

/**
 * Motion configuration for an intent.
 */
interface MotionConfig {
    readonly active: MotionStyle;
    readonly idle: MotionStyle;
    readonly transition: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOTION PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

const MOTION_CONFIGS: Record<MotionIntent, MotionConfig> = {
    appear: {
        idle: { opacity: 0, transform: 'translateY(8px)' },
        active: { opacity: 1, transform: 'translateY(0)' },
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
    },
    disappear: {
        idle: { opacity: 1, transform: 'translateY(0)' },
        active: { opacity: 0, transform: 'translateY(-8px)' },
        transition: 'opacity 0.15s ease-in, transform 0.15s ease-in',
    },
    emphasize: {
        idle: { transform: 'scale(1)' },
        active: { transform: 'scale(1.05)' },
        transition: 'transform 0.15s ease-out',
    },
    'feedback-success': {
        idle: { transform: 'scale(1)' },
        active: { transform: 'scale(1.1)' },
        transition: 'transform 0.1s ease-out',
    },
    'feedback-error': {
        idle: { transform: 'translateX(0)' },
        active: { transform: 'translateX(-4px)' },
        transition: 'transform 0.05s ease-in-out',
    },
    press: {
        idle: { transform: 'scale(1)' },
        active: { transform: 'scale(0.95)' },
        transition: 'transform 0.1s ease-out',
    },
    hover: {
        idle: { transform: 'scale(1)' },
        active: { transform: 'scale(1.02)' },
        transition: 'transform 0.15s ease-out',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// NO-MOTION FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

const NO_MOTION: MotionStyle = {
    opacity: 1,
    transform: 'none',
    transition: 'none',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Result from useMotion hook.
 */
export interface UseMotionResult {
    /** Style to apply when motion is idle */
    readonly idleStyle: MotionStyle;
    /** Style to apply when motion is active */
    readonly activeStyle: MotionStyle;
    /** Whether motion is enabled (respects reduceMotion) */
    readonly motionEnabled: boolean;
}

/**
 * Get motion styles for a given intent.
 *
 * Respects AccessibilityPrefs.reduceMotion automatically.
 * When reduceMotion is true, returns static styles (no animation).
 *
 * @example
 * ```tsx
 * function Card({ isVisible }: { isVisible: boolean }) {
 *   const { idleStyle, activeStyle, motionEnabled } = useMotion('appear');
 *
 *   return (
 *     <View style={isVisible ? activeStyle : idleStyle}>
 *       <Text>Content</Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * @param intent - The semantic motion intent
 * @returns Motion styles and enabled flag
 */
export function useMotion(intent: MotionIntent): UseMotionResult {
    const theme = useTheme();

    return useMemo(() => {
        // If reduceMotion is enabled, return static styles
        if (theme.reduceMotion) {
            return {
                idleStyle: NO_MOTION,
                activeStyle: NO_MOTION,
                motionEnabled: false,
            };
        }

        const config = MOTION_CONFIGS[intent];

        return {
            idleStyle: {
                ...config.idle,
                transition: config.transition,
            },
            activeStyle: {
                ...config.active,
                transition: config.transition,
            },
            motionEnabled: true,
        };
    }, [intent, theme.reduceMotion]);
}

/**
 * Get a simple motion style based on active state.
 *
 * Convenience wrapper around useMotion that returns a single style object.
 *
 * @example
 * ```tsx
 * function AnimatedView({ visible }: { visible: boolean }) {
 *   const style = useMotionStyle('appear', visible);
 *   return <View style={style}><Text>Hello</Text></View>;
 * }
 * ```
 */
export function useMotionStyle(intent: MotionIntent, isActive: boolean): MotionStyle {
    const { idleStyle, activeStyle } = useMotion(intent);
    return isActive ? activeStyle : idleStyle;
}
