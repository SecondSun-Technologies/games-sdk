/**
 * @fileoverview State Management Hooks
 * @module @secondsun/games-sdk/state
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * GAME STATE MODEL
 *
 * There are TWO kinds of state in a game:
 *
 * 1. EPHEMERAL UI STATE
 *    - Managed with React hooks (useState, useReducer, etc.)
 *    - Lives only during the session
 *    - Lost on session end
 *    - No platform visibility
 *    - Games have COMPLETE FREEDOM here
 *
 * 2. PERSISTENT GAME STATE
 *    - Opaque JSON blob stored by platform
 *    - Saved via SAVE_GAME_STATE event
 *    - Returned verbatim next session via context.savedGameState
 *    - SDK never interprets this blob
 *    - Game owns schema and migration
 *
 * This file provides helpers for both.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useReducer, useRef, useCallback, useMemo } from 'react';
import { type GameEvent } from '../events/event-types.js';

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORT REACT HOOKS (Ephemeral State)
// Games use standard React hooks for ephemeral state.
// We re-export for convenience and to document intent.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Standard React useState for ephemeral UI state.
 *
 * Use this for:
 * - Current card being shown
 * - Animation progress
 * - Selection state
 * - Temporary calculations
 *
 * This state is COMPLETELY EPHEMERAL:
 * - Lost on session end
 * - No persistence
 * - No platform visibility
 */
export { useState, useReducer, useRef, useCallback, useMemo };

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENT STATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a function to save game state.
 *
 * This is a convenience wrapper that emits the SAVE_GAME_STATE event
 * with the provided state blob.
 *
 * @template TState - The type of your game's state
 * @param emit - The emit function from GameRenderProps
 * @param schemaVersion - The current schema version (from metadata)
 * @returns A function that saves state
 *
 * @example
 * function MyGame({ emit, context }: GameRenderProps<MyState>) {
 *   const saveState = useSaveGameState<MyState>(emit, 1);
 *
 *   const handleLevelComplete = () => {
 *     saveState({ highScore: 100, unlockedLevels: [1, 2, 3] });
 *   };
 * }
 */
export function useSaveGameState(
    emit: (event: GameEvent) => void,
    schemaVersion: number
): (state: unknown) => void {
    return useCallback(
        (state: unknown) => {
            emit({
                type: 'SAVE_GAME_STATE',
                stateBlob: state,
                schemaVersion,
            });
        },
        [emit, schemaVersion]
    );
}

/**
 * Hook to manage saved state with initial value fallback.
 *
 * Provides a convenient API for accessing saved state with type safety
 * and a fallback for first-time players.
 *
 * @template TState - The type of your game's state
 * @param savedState - The saved state from context (may be undefined)
 * @param defaultState - Default state for new players
 * @param validator - Optional validation function for schema migration
 * @returns The validated state (saved or default)
 *
 * @example
 * function MyGame({ savedState }: GameRenderProps<MyState>) {
 *   const state = useGameState(savedState, { highScore: 0, level: 1 });
 *   // state is always valid MyState
 * }
 */
export function useGameState<TState>(
    savedState: TState | undefined,
    defaultState: TState,
    validator?: (state: unknown) => state is TState
): TState {
    return useMemo(() => {
        // No saved state - use default
        if (savedState === undefined) {
            return defaultState;
        }

        // If validator provided, use it
        if (validator !== undefined) {
            if (validator(savedState)) {
                return savedState;
            } else {
                // Validation failed - use default (state migration needed)
                return defaultState;
            }
        }

        // No validator - trust the saved state
        // (Not recommended for production - always validate!)
        return savedState;
    }, [savedState, defaultState, validator]);
}

/**
 * Hook for managing state with auto-save on changes.
 *
 * Combines local state management with automatic persistence.
 * Useful for games that want to save frequently.
 *
 * @template TState - The type of your game's state
 * @param emit - The emit function from GameRenderProps
 * @param schemaVersion - The current schema version
 * @param initialState - Initial state (from context.savedGameState or default)
 * @returns Tuple of [state, setState] similar to useState
 *
 * @example
 * function MyGame({ emit, savedState }: GameRenderProps<MyState>) {
 *   const [state, setState] = useAutoSaveState(
 *     emit,
 *     1,
 *     savedState ?? { score: 0 }
 *   );
 *
 *   // Every setState also saves to platform
 *   const handleScore = () => setState(s => ({ ...s, score: s.score + 10 }));
 * }
 */
export function useAutoSaveState<TState>(
    emit: (event: GameEvent) => void,
    schemaVersion: number,
    initialState: TState
): [TState, (updater: TState | ((prev: TState) => TState)) => void] {
    const [state, setStateInternal] = useState(initialState);
    const saveState = useSaveGameState(emit, schemaVersion);

    const setState = useCallback(
        (updater: TState | ((prev: TState) => TState)) => {
            setStateInternal((prev) => {
                const next = typeof updater === 'function'
                    ? (updater as (prev: TState) => TState)(prev)
                    : updater;

                // Auto-save on every change
                saveState(next);

                return next;
            });
        },
        [saveState]
    );

    return [state, setState];
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MIGRATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Helper to create a state migrator.
 *
 * State migration is the game's responsibility. This helper provides
 * a pattern for handling schema version upgrades.
 *
 * @template TState - The target state type
 * @param migrations - Map of version to migration function
 * @returns A function that migrates state to the latest version
 *
 * @example
 * const migrate = createStateMigrator<MyState>({
 *   1: (old) => ({ ...old, newField: 'default' }),
 *   2: (old) => ({ ...old, renamedField: old.oldField }),
 * });
 *
 * const state = migrate(savedState, savedSchemaVersion); // Always latest
 */
export function createStateMigrator(
    migrations: Record<number, (state: unknown) => unknown>
): (state: unknown, fromVersion: number, toVersion: number) => unknown {
    return (state: unknown, fromVersion: number, toVersion: number): unknown => {
        let current = state;
        let version = fromVersion;

        while (version < toVersion) {
            const nextVersion = version + 1;
            const migration = migrations[nextVersion];

            if (migration === undefined) {
                throw new Error(
                    `Missing migration from version ${String(version)} to ${String(nextVersion)}`
                );
            }

            current = migration(current);
            version = nextVersion;
        }

        return current;
    };
}
