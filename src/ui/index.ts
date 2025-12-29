/**
 * @fileoverview UI Module Public Exports
 * @module @secondsuntech/games-sdk/ui
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * UI PRIMITIVES
 *
 * Games may ONLY render using components from this module (plus React itself).
 * No HTML tags. No divs. No spans.
 *
 * All primitives are:
 * - Stateless render components
 * - Accept semantic props only (no arbitrary styles)
 * - Auto-apply accessibility preferences
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

export { View, type ViewProps } from './primitives/View.js';
export { Text, type TextProps } from './primitives/Text.js';
export { Stack, type StackProps, type StackDirection, type StackAlign, type StackJustify } from './primitives/Stack.js';
export { Spacer, type SpacerProps } from './primitives/Spacer.js';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './primitives/Button.js';
export { ScrollView, type ScrollViewProps } from './primitives/ScrollView.js';

// ─────────────────────────────────────────────────────────────────────────────
// Animation
// ─────────────────────────────────────────────────────────────────────────────

export {
    useMotion,
    useMotionStyle,
    type MotionIntent,
    type MotionStyle,
    type UseMotionResult,
} from './animation/index.js';
