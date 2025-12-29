/**
 * Device Profiles
 *
 * Static device configurations for testing.
 */

import type { PlatformKind, Viewport, SafeAreaInsets } from '@secondsuntech/games-sdk/platform';
import type { AccessibilityPrefs, ThemeMode } from '@secondsuntech/games-sdk';
import type { Capability } from '@secondsuntech/games-sdk';

export interface DeviceProfile {
    id: string;
    label: string;
    platform: PlatformKind;
    viewport: Viewport;
    safeAreaInsets: SafeAreaInsets;
    defaults: {
        accessibilityPrefs: AccessibilityPrefs;
        capabilities: Record<Capability, boolean>;
        themeMode: ThemeMode;
    };
}

const DEFAULT_ACCESSIBILITY: AccessibilityPrefs = {
    reduceMotion: false,
    highContrast: false,
    fontScale: 1.0,
    screenReaderActive: false,
    largerTouchTargets: false,
    colorBlindMode: 'none',
};

const DEFAULT_CAPABILITIES: Record<Capability, boolean> = {
    audio: true,
    haptics: true,
    timers: true,
    sensors: true,
    animations: true,
};

export const DEVICE_PROFILES: DeviceProfile[] = [
    {
        id: 'iphone-14-pro',
        label: 'iPhone 14 Pro',
        platform: 'ios',
        viewport: { width: 393, height: 852, pixelRatio: 3 },
        safeAreaInsets: { top: 59, right: 0, bottom: 34, left: 0 },
        defaults: {
            accessibilityPrefs: DEFAULT_ACCESSIBILITY,
            capabilities: DEFAULT_CAPABILITIES,
            themeMode: 'dark',
        },
    },
    {
        id: 'iphone-se',
        label: 'iPhone SE',
        platform: 'ios',
        viewport: { width: 375, height: 667, pixelRatio: 2 },
        safeAreaInsets: { top: 20, right: 0, bottom: 0, left: 0 },
        defaults: {
            accessibilityPrefs: DEFAULT_ACCESSIBILITY,
            capabilities: DEFAULT_CAPABILITIES,
            themeMode: 'light',
        },
    },
    {
        id: 'pixel-7',
        label: 'Pixel 7',
        platform: 'android',
        viewport: { width: 412, height: 915, pixelRatio: 2.625 },
        safeAreaInsets: { top: 24, right: 0, bottom: 0, left: 0 },
        defaults: {
            accessibilityPrefs: DEFAULT_ACCESSIBILITY,
            capabilities: DEFAULT_CAPABILITIES,
            themeMode: 'dark',
        },
    },
    {
        id: 'ipad-mini',
        label: 'iPad Mini',
        platform: 'ios',
        viewport: { width: 744, height: 1133, pixelRatio: 2 },
        safeAreaInsets: { top: 24, right: 0, bottom: 20, left: 0 },
        defaults: {
            accessibilityPrefs: DEFAULT_ACCESSIBILITY,
            capabilities: DEFAULT_CAPABILITIES,
            themeMode: 'light',
        },
    },
    {
        id: 'web-responsive',
        label: 'Web Browser',
        platform: 'web',
        viewport: { width: 390, height: 700, pixelRatio: 2 },
        safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        defaults: {
            accessibilityPrefs: DEFAULT_ACCESSIBILITY,
            capabilities: DEFAULT_CAPABILITIES,
            themeMode: 'dark',
        },
    },
];

export function getProfileById(id: string): DeviceProfile | undefined {
    return DEVICE_PROFILES.find((p) => p.id === id);
}
