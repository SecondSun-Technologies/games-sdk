/**
 * @fileoverview Capability Guard - Explicit Access Control
 * @module @secondsun/games-sdk/core/capability-guard
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * Capabilities are EXPLICIT, not implicit.
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
 *
 * ARCHITECTURE NOTE:
 * This file defines POLICY (declaration checking, permission gating).
 * MECHANICS (actual API implementations) are provided by the platform layer
 * via the CapabilityApiFactory. The SDK never implements audio/haptics/etc.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
    type Capability,
    type CapabilityResult,
    type CapabilityApiMap,
    CapabilityNotDeclaredError,
} from '../types/capabilities.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM-PROVIDED FACTORIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Factory function that creates capability APIs.
 * The PLATFORM provides this—the SDK only defines the interface contract.
 *
 * @template T - The capability type
 * @param capability - Which capability to create an API for
 * @returns The API implementation for that capability
 */
export type CapabilityApiFactory = <T extends Capability>(
    capability: T
) => CapabilityApiMap[T];

/**
 * Callback to check if a capability is granted at runtime.
 * The platform provides this to the SDK.
 */
export type RuntimePermissionChecker = (capability: Capability) => {
    granted: boolean;
    reason?: string;
};

/**
 * Default permission checker (allows everything).
 * Used in development/testing.
 */
const defaultPermissionChecker: RuntimePermissionChecker = () => ({
    granted: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// CAPABILITY GUARD CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration for creating a capability guard.
 */
export interface CapabilityGuardConfig {
    /** Capabilities the game declared in metadata */
    readonly declaredCapabilities: readonly Capability[];

    /** Platform-provided permission checker */
    readonly checkPermission?: RuntimePermissionChecker;

    /** Platform-provided API factory (creates real implementations) */
    readonly apiFactory: CapabilityApiFactory;

    /** Platform-provided no-op API factory (for denied capabilities) */
    readonly noOpApiFactory: CapabilityApiFactory;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAPABILITY GUARD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a capability guard for a game.
 *
 * The guard enforces two levels of access control:
 * 1. Declaration check: Game must have declared the capability
 * 2. Runtime check: Platform may still deny at runtime
 *
 * @param config - Guard configuration including platform-provided factories
 * @returns Capability access function
 */
export function createCapabilityGuard(config: CapabilityGuardConfig): CapabilityGuard {
    const {
        declaredCapabilities,
        checkPermission = defaultPermissionChecker,
        apiFactory,
        noOpApiFactory,
    } = config;

    const declaredSet = new Set(declaredCapabilities);

    /**
     * Request access to a capability.
     *
     * NOTE: This is NOT a React hook despite the naming convention.
     * It does not participate in React's render lifecycle.
     * Named "getCapability" to avoid React Rules-of-Hooks confusion.
     *
     * @param capability - The capability to access
     * @returns CapabilityResult with API and availability status
     * @throws {CapabilityNotDeclaredError} If capability wasn't declared
     */
    function getCapability<T extends Capability>(
        capability: T
    ): CapabilityResult<CapabilityApiMap[T]> {
        // Step 1: Check if declared
        if (!declaredSet.has(capability)) {
            throw new CapabilityNotDeclaredError(capability);
        }

        // Step 2: Check runtime permission
        const permissionResult = checkPermission(capability);

        if (permissionResult.granted) {
            // Wrap apiFactory call - platform misconfiguration shouldn't crash the game
            try {
                return {
                    isAvailable: true,
                    api: apiFactory(capability),
                };
            } catch (error) {
                // Platform factory threw - degrade gracefully
                console.error(
                    `[SDK] apiFactory threw for capability '${capability}':`,
                    error instanceof Error ? error.message : String(error)
                );
                // Fall through to no-op
            }
        }

        // Return unavailable result - either permission denied or factory error
        let noOpApi: CapabilityApiMap[T];
        try {
            noOpApi = noOpApiFactory(capability);
        } catch (error) {
            // Even no-op factory failed - this is a critical SDK bug
            console.error(
                `[SDK] noOpApiFactory threw for capability '${capability}':`,
                error instanceof Error ? error.message : String(error)
            );
            throw new Error(`SDK internal error: cannot create no-op API for '${capability}'`);
        }

        const result: CapabilityResult<CapabilityApiMap[T]> = {
            isAvailable: false,
            api: noOpApi,
        };

        // Add reason (from permission check or 'internal_error' if factory failed)
        const reason = permissionResult.reason ?? 'internal_error';
        return {
            ...result,
            unavailableReason: reason,
        };
    }

    return { getCapability };
}

/**
 * The capability guard interface exposed to games.
 */
export interface CapabilityGuard {
    /**
     * Request access to a capability.
     *
     * NOTE: This is NOT a React hook. It does not need to follow
     * React's Rules of Hooks. Call it conditionally, in loops,
     * wherever you need it.
     *
     * @template T - The capability type
     * @param capability - The capability to access
     * @returns Result with API and availability
     * @throws {CapabilityNotDeclaredError} If not declared
     */
    getCapability<T extends Capability>(
        capability: T
    ): CapabilityResult<CapabilityApiMap[T]>;
}
