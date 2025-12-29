/**
 * @fileoverview Game Registration - The Single Entry Point
 * @module @secondsun/games-sdk/core/create-game
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * createGame is the ONLY way to register a game with the platform.
 *
 * A game is:
 * - metadata (static, declarative)
 * - capabilities (what it needs)
 * - render (React component receiving context)
 *
 * A game is NOT:
 * - lifecycle hooks outside this
 * - side-channel APIs
 * - globals
 *
 * If a game needs something not in GameConfig, the SDK is incomplete—not the game.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { ComponentType } from 'react';
import { type GameMetadata, validateMetadata } from '../types/metadata.js';
import { type Capability } from '../types/capabilities.js';
import { type GameContext } from '../types/context.js';
import { type GameEvent } from '../events/event-types.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Props passed to the game's render component.
 *
 * This is the complete interface between the platform and the game.
 * Games receive context (read-only world state) and emit (event emission).
 *
 * @template TState - Type of the game's persisted state (defaults to unknown)
 */
export interface GameRenderProps<TState = unknown> {
    /**
     * Current game context (read-only).
     *
     * This is a discriminated union—check context.state to determine
     * what data is available.
     */
    readonly context: GameContext;

    /**
     * Fire-and-forget event emission.
     *
     * @param event - The event to emit
     * @returns void (never a Promise, never throws)
     */
    readonly emit: (event: GameEvent) => void;

    /**
     * Persisted game state from the previous session.
     *
     * This is the exact blob that was saved via SAVE_GAME_STATE event.
     * May be undefined if no prior state exists.
     *
     * Games are responsible for:
     * - Type-checking this value
     * - Handling schema migrations
     * - Graceful fallback if undefined or invalid
     */
    readonly savedState: TState | undefined;
}

/**
 * Configuration for creating a game.
 *
 * This is what game developers pass to createGame().
 *
 * @template TState - Type of the game's persisted state
 */
export interface GameConfig<TState = unknown> {
    /**
     * Static game metadata.
     * See GameMetadata for required fields.
     */
    readonly metadata: GameMetadata;

    /**
     * Declared capabilities.
     *
     * Must be a subset of (or equal to) metadata.capabilities.
     * Games can only use capabilities they declare.
     */
    readonly capabilities: readonly Capability[];

    /**
     * The game's render component.
     *
     * This is a React component that receives GameRenderProps.
     * It should handle all context states (INITIAL, IN_SESSION, ENDED).
     */
    readonly render: ComponentType<GameRenderProps<TState>>;
}

/**
 * A registered game.
 *
 * This is the frozen, validated output of createGame().
 * The platform uses this to run the game.
 *
 * @template TState - Type of the game's persisted state
 */
export interface GameRegistration<TState = unknown> {
    /** Frozen game metadata */
    readonly metadata: Readonly<GameMetadata>;

    /** Frozen declared capabilities */
    readonly capabilities: readonly Capability[];

    /** The game's render component */
    readonly render: ComponentType<GameRenderProps<TState>>;

    /** SDK version this game was registered with */
    readonly sdkVersion: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SDK VERSION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Current SDK version.
 * This is injected into GameRegistration for compatibility tracking.
 */
export const SDK_VERSION = '0.1.0';

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Thrown when game registration fails.
 */
export class GameRegistrationError extends Error {
    public readonly reason: string;
    public readonly details?: unknown;

    constructor(reason: string, details?: unknown) {
        super(`Game registration failed: ${reason}`);
        this.name = 'GameRegistrationError';
        this.reason = reason;
        this.details = details;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE GAME
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Registers a game with the platform.
 *
 * This is the ONLY way to create a game. The returned registration is
 * frozen and cannot be modified after creation.
 *
 * @template TState - Type of the game's persisted state
 * @param config - Game configuration
 * @returns Frozen game registration
 * @throws {GameRegistrationError} If configuration is invalid
 *
 * @example
 * export default createGame({
 *   metadata: {
 *     id: 'memory-match',
 *     name: 'Memory Match',
 *     version: '1.0.0',
 *     categories: ['memory'],
 *     recommendedSessionDurationMs: 5 * 60 * 1000,
 *     capabilities: ['animations', 'haptics'],
 *     stateSchemaVersion: 1,
 *   },
 *   capabilities: ['animations', 'haptics'],
 *   render: MemoryMatchGame,
 * });
 */
export function createGame<TState = unknown>(
    config: GameConfig<TState>
): GameRegistration<TState> {
    // Validate metadata at registration time
    try {
        validateMetadata(config.metadata);
    } catch (error) {
        throw new GameRegistrationError(
            'Invalid metadata',
            error instanceof Error ? error.message : error
        );
    }

    // Validate capabilities match metadata
    validateCapabilities(config.capabilities, config.metadata.capabilities);

    // Validate render component exists
    if (typeof config.render !== 'function') {
        throw new GameRegistrationError(
            'render must be a React component',
            { provided: typeof config.render }
        );
    }

    // Create frozen registration
    const registration: GameRegistration<TState> = Object.freeze({
        metadata: Object.freeze({ ...config.metadata }),
        capabilities: Object.freeze([...config.capabilities]),
        render: config.render,
        sdkVersion: SDK_VERSION,
    });

    return registration;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates that declared capabilities are consistent with metadata.
 */
function validateCapabilities(
    declared: readonly Capability[],
    metadata: readonly Capability[]
): void {
    // Check for duplicates in declared
    const declaredSet = new Set(declared);
    if (declaredSet.size !== declared.length) {
        throw new GameRegistrationError(
            'Duplicate capabilities declared',
            { declared }
        );
    }

    // Check that all declared are in metadata
    const metadataSet = new Set(metadata);
    for (const cap of declared) {
        if (!metadataSet.has(cap)) {
            throw new GameRegistrationError(
                `Capability '${cap}' declared but not in metadata.capabilities`,
                { declared, metadata }
            );
        }
    }

    // Check that metadata doesn't have capabilities not declared
    // (This is a warning, not an error—games can declare less than metadata)
    for (const cap of metadata) {
        if (!declaredSet.has(cap)) {
            // This is fine—game chose not to use a capability it registered for
            // Could log a development warning here
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Helper type to extract the state type from a GameRegistration.
 */
export type ExtractGameState<T> = T extends GameRegistration<infer S> ? S : never;

/**
 * Helper type to check if a value is a valid GameRegistration.
 */
export function isGameRegistration(value: unknown): value is GameRegistration {
    return (
        typeof value === 'object' &&
        value !== null &&
        'metadata' in value &&
        'capabilities' in value &&
        'render' in value &&
        'sdkVersion' in value
    );
}
