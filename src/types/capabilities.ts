/**
 * @fileoverview Game Capabilities System
 * @module @secondsun/games-sdk/types/capabilities
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PHILOSOPHY: Capabilities are EXPLICIT, not implicit.
 *
 * A game that didn't declare 'audio' cannot:
 * - Call audio APIs
 * - Fail silently when audio doesn't work
 * - Claim "it works on my machine"
 *
 * The platform may also DENY capabilities at runtime:
 * - User disabled haptics
 * - Device doesn't support sensors
 * - Session is in quiet mode
 *
 * Graceful degradation is REQUIRED, not optional.
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CAPABILITY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Platform capabilities that games can request.
 *
 * Each capability represents a category of platform functionality.
 * Games must declare their required capabilities in metadata;
 * the platform enforces that undeclared capabilities cannot be used.
 *
 * IMPORTANT: Capability strings are IDENTIFIERS, not authority.
 * Declaring a capability in metadata does not grant access—it requests it.
 * The platform may still deny at runtime based on device/user constraints.
 *
 * WHY CAPABILITIES:
 * - No implicit access prevents "works on my machine" bugs
 * - Platform can deny at runtime (user prefs, device limits)
 * - Games must implement graceful degradation
 * - Clear contract between game and platform
 */
export type Capability =
    /**
     * Audio playback and sound effects.
     * Platform may deny if user has muted the app or device.
     */
    | 'audio'

    /**
     * Haptic feedback (vibration).
     * Platform may deny if device doesn't support haptics or user disabled them.
     */
    | 'haptics'

    /**
     * High-precision timers.
     * All games get basic timing; this requests sub-millisecond precision.
     * Platform may deny on low-power mode.
     */
    | 'timers'

    /**
     * Device sensors (accelerometer, gyroscope).
     * Platform may deny if sensors unavailable or user denied permission.
     */
    | 'sensors'

    /**
     * High-performance animations (requestAnimationFrame guarantees).
     * Platform may deny on low-end devices to preserve battery.
     */
    | 'animations';

/**
 * Result of requesting a capability at runtime.
 *
 * Even if a capability is declared, the platform may deny it at runtime
 * based on device capabilities, user preferences, or session mode.
 *
 * @template TApi - The API type for this capability
 */
export interface CapabilityResult<TApi> {
    /**
     * Whether the capability is currently available.
     * If false, the API will be a no-op wrapper that silently does nothing.
     */
    readonly isAvailable: boolean;

    /**
     * The capability API. If isAvailable is false, all methods are no-ops.
     * Games should check isAvailable to provide alternative UX, but
     * calling the API when unavailable won't throw.
     */
    readonly api: TApi;

    /**
     * Human-readable reason if the capability is unavailable.
     * Useful for debugging and for providing user feedback.
     * Only present when isAvailable is false.
     */
    readonly unavailableReason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAPABILITY APIs
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Audio capability API.
 *
 * Provides controlled access to audio playback. The platform manages
 * audio focus, interruptions, and volume policies.
 */
export interface AudioCapabilityApi {
    /**
     * Play a sound effect by ID. Sound effects must be registered with the game.
     * @param soundId - Identifier of the registered sound effect
     * @param options - Optional playback options
     */
    playSound(soundId: string, options?: AudioPlayOptions): void;

    /**
     * Stop a currently playing sound.
     * @param soundId - Identifier of the sound to stop
     */
    stopSound(soundId: string): void;

    /**
     * Stop all sounds for this game.
     */
    stopAllSounds(): void;
}

/**
 * Options for audio playback.
 */
export interface AudioPlayOptions {
    /** Volume from 0 (silent) to 1 (full). Default 1. */
    readonly volume?: number;
    /** Whether to loop the sound. Default false. */
    readonly loop?: boolean;
}

/**
 * Haptics capability API.
 *
 * Provides controlled access to haptic feedback. The platform manages
 * haptic intensity based on user preferences.
 */
export interface HapticsCapabilityApi {
    /**
     * Trigger a haptic feedback pattern.
     * @param pattern - The haptic pattern to play
     */
    trigger(pattern: HapticPattern): void;
}

/**
 * Predefined haptic patterns.
 *
 * We provide semantic patterns rather than raw vibration controls.
 * This allows the platform to adapt to different devices and user preferences.
 */
export type HapticPattern =
    /** Light tap, good for button presses */
    | 'light'
    /** Medium impact, good for confirmations */
    | 'medium'
    /** Heavy impact, good for errors or important moments */
    | 'heavy'
    /** Success notification pattern */
    | 'success'
    /** Error notification pattern */
    | 'error'
    /** Selection change feedback */
    | 'selection';

/**
 * High-precision timers capability API.
 */
export interface TimersCapabilityApi {
    /**
     * Get high-precision current time.
     * Uses performance.now() or equivalent for sub-millisecond accuracy.
     * @returns Current time in milliseconds with decimal precision
     */
    now(): number;

    /**
     * Schedule a callback with high precision.
     * @param callback - Function to call
     * @param delayMs - Delay in milliseconds
     * @returns Timer ID for cancellation
     */
    setTimeout(callback: () => void, delayMs: number): number;

    /**
     * Cancel a scheduled timer.
     * @param timerId - Timer ID returned from setTimeout
     */
    clearTimeout(timerId: number): void;
}

/**
 * Device sensors capability API.
 */
export interface SensorsCapabilityApi {
    /**
     * Subscribe to accelerometer data.
     *
     * NOTE: Callbacks may be throttled or sampled by the platform based on
     * device capabilities, battery state, and performance constraints.
     * Do not assume real-time physics accuracy—these are wellness games,
     * not flight controllers.
     *
     * @param callback - Called with acceleration data
     * @returns Unsubscribe function
     */
    onAccelerometer(
        callback: (data: AccelerometerData) => void
    ): () => void;

    /**
     * Subscribe to gyroscope data.
     *
     * NOTE: Callbacks may be throttled or sampled by the platform.
     * See onAccelerometer for details.
     *
     * @param callback - Called with rotation data
     * @returns Unsubscribe function
     */
    onGyroscope(
        callback: (data: GyroscopeData) => void
    ): () => void;
}

/**
 * Accelerometer reading.
 */
export interface AccelerometerData {
    /** Acceleration along X axis in m/s² */
    readonly x: number;
    /** Acceleration along Y axis in m/s² */
    readonly y: number;
    /** Acceleration along Z axis in m/s² */
    readonly z: number;
    /** Timestamp of the reading */
    readonly timestamp: number;
}

/**
 * Gyroscope reading.
 */
export interface GyroscopeData {
    /** Rotation rate around X axis in rad/s */
    readonly alpha: number;
    /** Rotation rate around Y axis in rad/s */
    readonly beta: number;
    /** Rotation rate around Z axis in rad/s */
    readonly gamma: number;
    /** Timestamp of the reading */
    readonly timestamp: number;
}

/**
 * Animations capability API.
 */
export interface AnimationsCapabilityApi {
    /**
     * Request an animation frame with guaranteed timing.
     * @param callback - Called with the frame timestamp
     * @returns Frame ID for cancellation
     */
    requestAnimationFrame(callback: (timestamp: number) => void): number;

    /**
     * Cancel a requested animation frame.
     * @param frameId - Frame ID returned from requestAnimationFrame
     */
    cancelAnimationFrame(frameId: number): void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAPABILITY ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Thrown when a game attempts to use a capability it didn't declare.
 */
export class CapabilityNotDeclaredError extends Error {
    public readonly capability: Capability;

    constructor(capability: Capability) {
        super(
            `Capability '${capability}' was not declared in game metadata. ` +
            `Add it to the capabilities array to use this feature.`
        );
        this.name = 'CapabilityNotDeclaredError';
        this.capability = capability;
    }
}

/**
 * Thrown when a capability is declared but denied at runtime.
 *
 * THIS ERROR INDICATES A LOGIC BUG.
 * Games must check `isAvailable` before using capabilities that may be denied.
 * If you're catching this error, your code is wrong—capability denial is
 * expected and should be handled via the isAvailable check, not exceptions.
 *
 * Exceptions imply recoverability; capability denial is expected, not exceptional.
 * Denial should be boring—check availability, handle gracefully, move on.
 */
export class CapabilityDeniedError extends Error {
    public readonly capability: Capability;
    public readonly reason: string;

    constructor(capability: Capability, reason: string) {
        super(
            `Capability '${capability}' was denied: ${reason}. ` +
            `This is a logic bug—check isAvailable before using capabilities.`
        );
        this.name = 'CapabilityDeniedError';
        this.capability = capability;
        this.reason = reason;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Maps capability names to their API types.
 *
 * INTERNAL WIRING: This map exists for type safety, not for dynamic
 * capability access. Do not reflect over this or build clever abstractions
 * on top of it—use the explicit useCapability() function instead.
 *
 * @internal
 */
export interface CapabilityApiMap {
    audio: AudioCapabilityApi;
    haptics: HapticsCapabilityApi;
    timers: TimersCapabilityApi;
    sensors: SensorsCapabilityApi;
    animations: AnimationsCapabilityApi;
}
