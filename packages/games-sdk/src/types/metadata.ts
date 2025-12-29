/**
 * @fileoverview Game Metadata Schema
 * @module @secondsun/games-sdk/types/metadata
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * PHILOSOPHY: Static, declarative metadata. If it's not declared here,
 * the platform assumes it doesn't exist.
 *
 * Metadata is used by:
 * - Admin UI (displaying game info)
 * - Analytics (categorization, comparison)
 * - Validation (ensuring games are properly configured)
 * - Compatibility checks (versioning, capability matching)
 *
 * This metadata is FROZEN at registration time and cannot be modified at runtime.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { type Capability } from './capabilities.js';

// ═══════════════════════════════════════════════════════════════════════════════
// GAME CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cognitive domain categories that games can address.
 *
 * A game may address multiple categories (e.g., a game could exercise
 * both memory and focus). These categories are used for:
 * - Session scheduling (balancing cognitive load)
 * - Analytics grouping
 * - Personalization recommendations
 *
 * Categories describe WHAT cognitive skills the game exercises,
 * not HOW well it does so (that's derived from player data).
 */
export type GameCategory =
    /**
     * Sustained attention and concentration.
     * Games requiring continuous vigilance or selective attention.
     */
    | 'focus'

    /**
     * Working memory and recall.
     * Games involving pattern memorization, sequence recall, etc.
     */
    | 'memory'

    /**
     * Processing speed and reaction time.
     * Games requiring quick responses to stimuli.
     */
    | 'speed'

    /**
     * Emotional regulation and stress management.
     * Games involving breathing exercises, mindfulness, etc.
     */
    | 'regulation'

    /**
     * Executive function and planning.
     * Games requiring strategy, sequencing, or problem-solving.
     */
    | 'planning';

// ═══════════════════════════════════════════════════════════════════════════════
// GAME METADATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Complete metadata for a game.
 *
 * Every game must declare this metadata upfront. This is not a runtime
 * concern—it's a compile-time contract between the game and the platform.
 *
 * IMMUTABILITY: All properties are readonly. Metadata cannot change
 * after game registration. If a game needs to change metadata, it must
 * release a new version.
 *
 * @example
 * const metadata: GameMetadata = {
 *   id: 'memory-match',
 *   name: 'Memory Match',
 *   version: '1.2.0',
 *   categories: ['memory', 'focus'],
 *   recommendedSessionDurationMs: 300000, // 5 minutes
 *   capabilities: ['animations', 'haptics'],
 *   stateSchemaVersion: 2,
 * };
 */
export interface GameMetadata {
    /**
     * Stable unique identifier for this game.
     *
     * CRITICAL: This ID must NEVER change after initial publication.
     * It's used for:
     * - Progression tracking across sessions
     * - Analytics aggregation
     * - Save state association
     * - License/entitlement management
     *
     * Use a slug-style format: lowercase, hyphens, no special characters.
     * Examples: 'memory-match', 'breathing-circles', 'focus-trainer'
     */
    readonly id: string;

    /**
     * Human-readable display name.
     *
     * Used in admin UI, analytics dashboards, and potentially user-facing
     * interfaces. Can include spaces and proper capitalization.
     * Examples: 'Memory Match', 'Breathing Circles', 'Focus Trainer'
     */
    readonly name: string;

    /**
     * Semantic version of the game code.
     *
     * Follow semver strictly:
     * - MAJOR: Breaking changes to state schema or event emission
     * - MINOR: New features, new event types
     * - PATCH: Bug fixes, performance improvements
     *
     * The platform may use this for:
     * - Compatibility checks
     * - Migration decisions
     * - Rollback capabilities
     */
    readonly version: string;

    /**
     * Cognitive domains this game exercises.
     *
     * At least one category is required. Games often span multiple
     * categories—a memory game might also exercise focus.
     *
     * This is a CLAIM by the game developer. The platform may validate
     * these claims against actual player performance data.
     */
    readonly categories: readonly GameCategory[];

    /**
     * Recommended session length in milliseconds.
     *
     * This helps the platform:
     * - Schedule games appropriately
     * - Set user expectations
     * - Plan cognitive load across a session
     *
     * Note: This is a recommendation, not enforcement. Games may run
     * shorter (user quits early) or longer (user continues playing).
     *
     * @example
     * 5 * 60 * 1000 // 5 minutes = 300000ms
     */
    readonly recommendedSessionDurationMs: number;

    /**
     * Platform capabilities this game requires.
     *
     * Games can only use capabilities they declare. If a game tries to
     * access audio without declaring it, the SDK will throw.
     *
     * The platform may also deny declared capabilities at runtime based on:
     * - Device capabilities
     * - User preferences
     * - Session mode (e.g., quiet mode)
     *
     * Games must handle graceful degradation for any capability that
     * might be denied.
     */
    readonly capabilities: readonly Capability[];

    /**
     * Version of the persisted state schema.
     *
     * Increment this when the structure of savedGameState changes in a way
     * that isn't backward-compatible. The game is responsible for:
     * - Detecting old schema versions
     * - Migrating or discarding old state
     *
     * The platform stores this version alongside the state blob and
     * provides it back on session restore.
     *
     * @example
     * // V1: { highScore: number }
     * // V2: { highScores: number[] }  // Breaking change: increment version
     */
    readonly stateSchemaVersion: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validation error for game metadata.
 */
export class InvalidMetadataError extends Error {
    public readonly field: string;
    public readonly reason: string;

    constructor(field: string, reason: string) {
        super(`Invalid metadata.${field}: ${reason}`);
        this.name = 'InvalidMetadataError';
        this.field = field;
        this.reason = reason;
    }
}

/**
 * Valid game categories for runtime validation.
 */
const VALID_CATEGORIES: readonly GameCategory[] = [
    'focus',
    'memory',
    'speed',
    'regulation',
    'planning',
] as const;

/**
 * Valid capabilities for runtime validation.
 */
const VALID_CAPABILITIES: readonly Capability[] = [
    'audio',
    'haptics',
    'timers',
    'sensors',
    'animations',
] as const;

/**
 * Validates game metadata at registration time.
 *
 * This runs when createGame() is called to catch configuration errors
 * as early as possible. All validation is strict—any issue throws.
 *
 * @param metadata - The metadata to validate
 * @throws {InvalidMetadataError} If any field is invalid
 */
export function validateMetadata(metadata: unknown): asserts metadata is GameMetadata {
    if (typeof metadata !== 'object' || metadata === null) {
        throw new InvalidMetadataError('root', 'Metadata must be an object');
    }

    const m = metadata as Record<string, unknown>;

    // Validate id
    if (typeof m['id'] !== 'string' || m['id'].length === 0) {
        throw new InvalidMetadataError('id', 'Must be a non-empty string');
    }
    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(m['id']) && m['id'].length > 1) {
        throw new InvalidMetadataError(
            'id',
            'Must be lowercase alphanumeric with hyphens, starting with a letter'
        );
    }

    // Validate name
    if (typeof m['name'] !== 'string' || m['name'].length === 0) {
        throw new InvalidMetadataError('name', 'Must be a non-empty string');
    }

    // Validate version (semver format)
    if (typeof m['version'] !== 'string') {
        throw new InvalidMetadataError('version', 'Must be a string');
    }
    if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(m['version'])) {
        throw new InvalidMetadataError(
            'version',
            'Must be valid semver format (e.g., 1.0.0 or 1.0.0-beta.1)'
        );
    }

    // Validate categories
    if (!Array.isArray(m['categories']) || m['categories'].length === 0) {
        throw new InvalidMetadataError('categories', 'Must be a non-empty array');
    }
    for (const category of m['categories']) {
        if (!VALID_CATEGORIES.includes(category as GameCategory)) {
            throw new InvalidMetadataError(
                'categories',
                `Invalid category: ${String(category)}. Valid: ${VALID_CATEGORIES.join(', ')}`
            );
        }
    }

    // Validate recommendedSessionDurationMs
    if (
        typeof m['recommendedSessionDurationMs'] !== 'number' ||
        !Number.isInteger(m['recommendedSessionDurationMs']) ||
        m['recommendedSessionDurationMs'] <= 0
    ) {
        throw new InvalidMetadataError(
            'recommendedSessionDurationMs',
            'Must be a positive integer (milliseconds)'
        );
    }

    // Validate capabilities
    if (!Array.isArray(m['capabilities'])) {
        throw new InvalidMetadataError('capabilities', 'Must be an array');
    }
    for (const capability of m['capabilities']) {
        if (!VALID_CAPABILITIES.includes(capability as Capability)) {
            throw new InvalidMetadataError(
                'capabilities',
                `Invalid capability: ${String(capability)}. Valid: ${VALID_CAPABILITIES.join(', ')}`
            );
        }
    }

    // Validate stateSchemaVersion
    if (
        typeof m['stateSchemaVersion'] !== 'number' ||
        !Number.isInteger(m['stateSchemaVersion']) ||
        m['stateSchemaVersion'] < 1
    ) {
        throw new InvalidMetadataError(
            'stateSchemaVersion',
            'Must be a positive integer >= 1'
        );
    }
}
