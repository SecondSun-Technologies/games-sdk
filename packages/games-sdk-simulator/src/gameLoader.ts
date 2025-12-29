/**
 * Game Loader
 *
 * Accepts GameRegistration from external sources.
 */

import type { GameRegistration } from '@secondsuntech/games-sdk';

// Store for loaded game
let loadedGame: GameRegistration | null = null;

/**
 * Load a game into the simulator.
 */
export function loadGame(game: GameRegistration): void {
    loadedGame = game;
}

/**
 * Get the currently loaded game.
 */
export function getLoadedGame(): GameRegistration | null {
    return loadedGame;
}

/**
 * Clear the loaded game.
 */
export function clearGame(): void {
    loadedGame = null;
}

// Expose for external game loading via console
declare global {
    interface Window {
        simulatorLoadGame: typeof loadGame;
    }
}

if (typeof window !== 'undefined') {
    window.simulatorLoadGame = loadGame;
}
