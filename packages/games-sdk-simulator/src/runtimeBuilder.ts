/**
 * Runtime Builder
 *
 * Constructs PlatformRuntime from device profile + UI toggles.
 */

import type { PlatformRuntime } from '@secondsuntech/games-sdk/platform';
import type { AccessibilityPrefs, ThemeMode } from '@secondsuntech/games-sdk';
import type { Capability } from '@secondsuntech/games-sdk';
import type { DeviceProfile } from './deviceProfiles';

export interface RuntimeOverrides {
    accessibilityPrefs?: Partial<AccessibilityPrefs>;
    themeMode?: ThemeMode;
    capabilities?: Partial<Record<Capability, boolean>>;
}

export function buildRuntime(
    profile: DeviceProfile,
    overrides: RuntimeOverrides = {}
): PlatformRuntime {
    const accessibilityPrefs: AccessibilityPrefs = {
        ...profile.defaults.accessibilityPrefs,
        ...overrides.accessibilityPrefs,
    };

    const themeMode = overrides.themeMode ?? profile.defaults.themeMode;

    const capabilities: Record<Capability, boolean> = {
        ...profile.defaults.capabilities,
        ...overrides.capabilities,
    };

    return {
        platform: profile.platform,
        viewport: profile.viewport,
        safeAreaInsets: profile.safeAreaInsets,
        accessibilityPrefs,
        themeMode,
        checkRuntimePermission: (capability: Capability) => {
            const granted = capabilities[capability];
            return {
                granted,
                reason: granted ? undefined : `Capability ${capability} denied by simulator`,
            };
        },
        nowMs: () => Date.now(),
        log: (level: 'debug' | 'info' | 'warn' | 'error', msg: string, data?: unknown): void => {
            const prefix = `[Simulator ${level.toUpperCase()}]`;
            if (data !== undefined) {
                console.warn(prefix, msg, data);
            } else {
                console.warn(prefix, msg);
            }
        },
    };
}
