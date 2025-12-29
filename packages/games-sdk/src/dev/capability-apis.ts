/**
 * @fileoverview Capability API Factories for Development
 * @module @secondsun/games-sdk/dev/capability-apis
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * Development implementations of capability APIs.
 *
 * In production, these are provided by the platform.
 * For development, we provide mock implementations.
 *
 * DEV-ONLY: These are completely removed in production builds.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type {
    Capability,
    CapabilityApiMap,
    AudioCapabilityApi,
    HapticsCapabilityApi,
    TimersCapabilityApi,
    SensorsCapabilityApi,
    AnimationsCapabilityApi,
} from '../types/capabilities.js';
import type { CapabilityApiFactory } from '../core/capability-guard.js';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK API IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a mock audio API for development.
 * Logs all audio operations to console.
 */
function createMockAudioApi(): AudioCapabilityApi {
    return {
        playSound(soundId, options): void {
            console.log(`%c[Audio] Play: ${soundId}`, 'color: #9C27B0', options);
        },
        stopSound(soundId): void {
            console.log(`%c[Audio] Stop: ${soundId}`, 'color: #9C27B0');
        },
        stopAllSounds(): void {
            console.log('%c[Audio] Stop All', 'color: #9C27B0');
        },
    };
}

/**
 * Creates a mock haptics API for development.
 * Uses navigator.vibrate if available, logs otherwise.
 */
function createMockHapticsApi(): HapticsCapabilityApi {
    return {
        trigger(pattern): void {
            console.log(`%c[Haptics] Trigger: ${pattern}`, 'color: #FF9800');
            // Try real vibration if available
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                switch (pattern) {
                    case 'light':
                        navigator.vibrate(10);
                        break;
                    case 'medium':
                        navigator.vibrate(25);
                        break;
                    case 'heavy':
                        navigator.vibrate(50);
                        break;
                    case 'success':
                        navigator.vibrate([10, 50, 10]);
                        break;
                    case 'error':
                        navigator.vibrate([50, 50, 50]);
                        break;
                    case 'selection':
                        navigator.vibrate(5);
                        break;
                }
            }
        },
    };
}

/**
 * Creates a mock timers API for development.
 * Uses real browser timers.
 */
function createMockTimersApi(): TimersCapabilityApi {
    return {
        now(): number {
            return typeof performance !== 'undefined' ? performance.now() : Date.now();
        },
        setTimeout(callback, delayMs): number {
            return window.setTimeout(callback, delayMs);
        },
        clearTimeout(timerId): void {
            window.clearTimeout(timerId);
        },
    };
}

/**
 * Creates a mock sensors API for development.
 * Uses real device motion events if available.
 */
function createMockSensorsApi(): SensorsCapabilityApi {
    return {
        onAccelerometer(callback): () => void {
            if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
                console.warn('[Sensors] Accelerometer not available in this environment');
                return (): void => {
                    // Cleanup function (nothing to clean up)
                };
            }

            const handler = (event: DeviceMotionEvent): void => {
                if (event.accelerationIncludingGravity !== null) {
                    callback({
                        x: event.accelerationIncludingGravity.x ?? 0,
                        y: event.accelerationIncludingGravity.y ?? 0,
                        z: event.accelerationIncludingGravity.z ?? 0,
                        timestamp: Date.now(),
                    });
                }
            };

            window.addEventListener('devicemotion', handler);
            return (): void => {
                window.removeEventListener('devicemotion', handler);
            };
        },
        onGyroscope(callback): () => void {
            if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
                console.warn('[Sensors] Gyroscope not available in this environment');
                return (): void => {
                    // Cleanup function (nothing to clean up)
                };
            }

            const handler = (event: DeviceOrientationEvent): void => {
                callback({
                    alpha: event.alpha ?? 0,
                    beta: event.beta ?? 0,
                    gamma: event.gamma ?? 0,
                    timestamp: Date.now(),
                });
            };

            window.addEventListener('deviceorientation', handler);
            return (): void => {
                window.removeEventListener('deviceorientation', handler);
            };
        },
    };
}

/**
 * Creates a mock animations API for development.
 * Uses real requestAnimationFrame.
 */
function createMockAnimationsApi(): AnimationsCapabilityApi {
    return {
        requestAnimationFrame(callback): number {
            return window.requestAnimationFrame(callback);
        },
        cancelAnimationFrame(frameId): void {
            window.cancelAnimationFrame(frameId);
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// NO-OP API IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a no-op audio API (for denied capabilities).
 */
function createNoOpAudioApi(): AudioCapabilityApi {
    return {
        playSound(): void {
            // No-op: capability denied
        },
        stopSound(): void {
            // No-op: capability denied
        },
        stopAllSounds(): void {
            // No-op: capability denied
        },
    };
}

/**
 * Creates a no-op haptics API.
 */
function createNoOpHapticsApi(): HapticsCapabilityApi {
    return {
        trigger(): void {
            // No-op: capability denied
        },
    };
}

/**
 * Creates a no-op timers API.
 */
function createNoOpTimersApi(): TimersCapabilityApi {
    return {
        now(): number {
            return Date.now();
        },
        setTimeout(): number {
            return 0;
        },
        clearTimeout(): void {
            // No-op: capability denied
        },
    };
}

/**
 * Creates a no-op sensors API.
 */
function createNoOpSensorsApi(): SensorsCapabilityApi {
    return {
        onAccelerometer(): () => void {
            return (): void => {
                // No-op unsubscribe
            };
        },
        onGyroscope(): () => void {
            return (): void => {
                // No-op unsubscribe
            };
        },
    };
}

/**
 * Creates a no-op animations API.
 */
function createNoOpAnimationsApi(): AnimationsCapabilityApi {
    return {
        requestAnimationFrame(): number {
            return 0;
        },
        cancelAnimationFrame(): void {
            // No-op: capability denied
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates mock capability APIs for development.
 * Uses real browser APIs where available, logs otherwise.
 */
export const createMockCapabilityApi: CapabilityApiFactory = <T extends Capability>(
    capability: T
): CapabilityApiMap[T] => {
    switch (capability) {
        case 'audio':
            return createMockAudioApi() as CapabilityApiMap[T];
        case 'haptics':
            return createMockHapticsApi() as CapabilityApiMap[T];
        case 'timers':
            return createMockTimersApi() as CapabilityApiMap[T];
        case 'sensors':
            return createMockSensorsApi() as CapabilityApiMap[T];
        case 'animations':
            return createMockAnimationsApi() as CapabilityApiMap[T];
        default: {
            // Exhaustive check
            const _exhaustive: never = capability;
            throw new Error(`Unknown capability: ${String(_exhaustive)}`);
        }
    }
};

/**
 * Creates no-op capability APIs (for denied capabilities).
 */
export const createNoOpCapabilityApi: CapabilityApiFactory = <T extends Capability>(
    capability: T
): CapabilityApiMap[T] => {
    switch (capability) {
        case 'audio':
            return createNoOpAudioApi() as CapabilityApiMap[T];
        case 'haptics':
            return createNoOpHapticsApi() as CapabilityApiMap[T];
        case 'timers':
            return createNoOpTimersApi() as CapabilityApiMap[T];
        case 'sensors':
            return createNoOpSensorsApi() as CapabilityApiMap[T];
        case 'animations':
            return createNoOpAnimationsApi() as CapabilityApiMap[T];
        default: {
            const _exhaustive: never = capability;
            throw new Error(`Unknown capability: ${String(_exhaustive)}`);
        }
    }
};
