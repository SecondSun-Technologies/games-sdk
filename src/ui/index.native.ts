/**
 * @fileoverview UI Package Entry Point (React Native)
 * @module @secondsuntech/games-sdk/ui (native)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * UI PACKAGE - REACT NATIVE
 *
 * Native-specific UI exports. Resolved via conditional exports.
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PRIMITIVES (Native)
// ═══════════════════════════════════════════════════════════════════════════════

export {
    View,
    type ViewProps,
    Text,
    type TextProps,
    Button,
    type ButtonProps,
    type ButtonVariant,
    type ButtonSize,
    Stack,
    type StackProps,
    type StackDirection,
    type StackAlign,
    type StackJustify,
    ScrollView,
    type ScrollViewProps,
    Spacer,
    type SpacerProps,
} from './primitives/native/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION (Shared - works on both platforms)
// ═══════════════════════════════════════════════════════════════════════════════

export {
    type MotionIntent,
    type MotionStyle,
    type UseMotionResult,
    useMotion,
    useMotionStyle,
} from './animation/index.js';
