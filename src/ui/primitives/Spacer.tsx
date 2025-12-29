/**
 * @fileoverview Spacer Primitive
 * @module @secondsuntech/games-sdk/ui/primitives/Spacer
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * SPACER PRIMITIVE
 *
 * Semantic spacing component using theme tokens.
 *
 * RULES:
 * - Stateless. No internal state.
 * - Size comes from spacing tokens only.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { CSSProperties, ReactElement } from 'react';
import { useTheme } from '../../theme/context.js';
import type { SpacingToken } from '../../theme/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Spacer component props.
 */
export interface SpacerProps {
    /** Size using spacing token */
    readonly size: SpacingToken;
    /** Direction of spacing (for use in Stack) */
    readonly direction?: 'horizontal' | 'vertical';
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Spacer - Layout spacing component.
 *
 * This is a stateless render component.
 * Provides consistent spacing between elements using theme tokens.
 *
 * @example
 * ```tsx
 * <Stack direction="vertical">
 *   <Text>Above</Text>
 *   <Spacer size="lg" />
 *   <Text>Below</Text>
 * </Stack>
 * ```
 */
export function Spacer({ size, direction = 'vertical' }: SpacerProps): ReactElement {
    const theme = useTheme();
    const spacing = theme.spacing(size);

    const style: CSSProperties = {
        flexShrink: 0,
        ...(direction === 'vertical'
            ? { height: spacing, width: '100%' }
            : { width: spacing, height: '100%' }),
    };

    return <div style={style} aria-hidden="true" />;
}

Spacer.displayName = 'Spacer';
