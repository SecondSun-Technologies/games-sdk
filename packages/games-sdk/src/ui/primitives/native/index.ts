/**
 * @fileoverview Native Primitives Entry Point
 * @module @secondsuntech/games-sdk/ui/primitives/native
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * NATIVE PRIMITIVES
 *
 * React Native implementations of SDK primitives.
 * Same semantic props as web, different underlying components.
 *
 * These are resolved via conditional exports when bundled for React Native.
 * ══════════════════════════════════════════════════════════════════════════════
 */

export { View, type ViewProps } from './View.native.js';
export { Text, type TextProps } from './Text.native.js';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button.native.js';
export { Stack, type StackProps, type StackDirection, type StackAlign, type StackJustify } from './Stack.native.js';
export { ScrollView, type ScrollViewProps } from './ScrollView.native.js';
export { Spacer, type SpacerProps } from './Spacer.native.js';
