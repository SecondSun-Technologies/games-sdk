/**
 * @fileoverview SecondSun Games SDK - Main Entry Point
 * @module @secondsun/games-sdk
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * GAMES SDK
 *
 * A game platform SDK where games are unprivileged, stateless React modules that:
 * - Receive structured, read-only context
 * - Manage their own ephemeral UI state
 * - Emit structured events describing what happened
 *
 * The platform owns:
 * - Persistence
 * - Rewards
 * - Analytics
 * - Safety
 * - Authority
 *
 * If a game wants something the SDK doesn't expose, the SDK is incomplete.
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE - Game Registration
// ═══════════════════════════════════════════════════════════════════════════════

export {
    createGame,
    type GameConfig,
    type GameRegistration,
    type GameRenderProps,
    GameRegistrationError,
    SDK_VERSION,
    isGameRegistration,
    type ExtractGameState,
} from './core/create-game.js';

export {
    createCapabilityGuard,
    type CapabilityGuard,
    type CapabilityGuardConfig,
    type CapabilityApiFactory,
    type RuntimePermissionChecker,
} from './core/capability-guard.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES - Core Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

// Branded types
export {
    type Brand,
    type SessionId,
    type LevelId,
    type Difficulty,
    type Timestamp,
    type DurationMs,
    // Validators (the ONLY way to create branded types)
    createDifficulty,
    createSessionId,
    createLevelId,
    createTimestamp,
    createDuration,
    // Type guards
    isValidDifficulty,
    isValidSessionId,
    isValidLevelId,
    isValidTimestamp,
    isValidDuration,
    // Errors
    BrandedTypeError,
    InvalidDifficultyError,
    InvalidSessionIdError,
    InvalidLevelIdError,
    InvalidTimestampError,
    InvalidDurationError,
} from './types/branded.js';

// Capabilities
export {
    type Capability,
    type CapabilityResult,
    type CapabilityApiMap,
    type AudioCapabilityApi,
    type AudioPlayOptions,
    type HapticsCapabilityApi,
    type HapticPattern,
    type TimersCapabilityApi,
    type SensorsCapabilityApi,
    type AccelerometerData,
    type GyroscopeData,
    type AnimationsCapabilityApi,
    CapabilityNotDeclaredError,
    CapabilityDeniedError,
} from './types/capabilities.js';

// Metadata
export {
    type GameMetadata,
    type GameCategory,
    validateMetadata,
    InvalidMetadataError,
} from './types/metadata.js';

// Context
export {
    type GameContext,
    type InitialContext,
    type InSessionContext,
    type SessionEndedContext,
    type ProgressionSnapshot,
    type AccessibilityPrefs,
    type ColorBlindMode,
    type ThemeMode,
    type OrgConfig,
    type SessionSummary,
    isInitialContext,
    isInSessionContext,
    isSessionEndedContext,
    assertInSession,
} from './types/context.js';

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS - Event System
// ═══════════════════════════════════════════════════════════════════════════════

export {
    // Main event union
    type GameEvent,
    type EmittedEvent,

    // Session events
    type SessionStartedEvent,
    type SessionEndedEvent,
    type SessionAbortedEvent,
    type SessionEndReason,
    type SessionAbortReason,

    // Progression events
    type LevelStartedEvent,
    type LevelCompletedEvent,
    type LevelFailedEvent,
    type CheckpointReachedEvent,
    type LevelFailureReason,

    // Performance events
    type PerformanceReportedEvent,

    // Time events
    type ActiveTimeReportedEvent,

    // Friction events
    type FrictionReportedEvent,
    type CognitiveLoadType,

    // Error events
    type ErrorMadeEvent,
    type FailureOccurredEvent,
    type ErrorType,
    type FailureType,

    // State events
    type SaveGameStateEvent,

    // User signals
    type UserSignalEvent,
    type UserSignalType,

    // Dev events
    type DevLogEvent,

    // Utility
    assertNever,
} from './events/event-types.js';

export {
    type EventEmitter,
    type InternalEventEmitter,
    type EventHandler,
    type EventEmitterConfig,
    createEventEmitter,
    createEmitFunction,
} from './events/event-emitter.js';

export {
    type ValidationMode,
    type ValidationResult,
    validateEvent,
    UnknownEventTypeError,
    EventValidationError,
} from './events/event-validators.js';

// ═══════════════════════════════════════════════════════════════════════════════
// STATE - State Management
// ═══════════════════════════════════════════════════════════════════════════════

export {
    // Re-exported React hooks for ephemeral state
    useState,
    useReducer,
    useRef,
    useCallback,
    useMemo,
    // Persistent state helpers
    useSaveGameState,
    useGameState,
    useAutoSaveState,
    createStateMigrator,
} from './state/index.js';
