# API Reference

Complete API documentation for the Games SDK.

## Core

### createGame

Register a game with the platform.

```typescript
function createGame<TState = unknown>(
  config: GameConfig<TState>
): GameRegistration<TState>
```

**Config:**
```typescript
interface GameConfig<TState> {
  metadata: GameMetadata;
  capabilities: readonly Capability[];
  render: (props: GameRenderProps<TState>) => ReactElement;
}
```

**Example:**
```typescript
const game = createGame({
  metadata: { ... },
  capabilities: ['audio'],
  render: MyGameComponent,
});
```

---

### createCapabilityGuard

Create a capability guard for requesting platform features.

```typescript
function createCapabilityGuard(
  config: CapabilityGuardConfig
): CapabilityGuard
```

**Config:**
```typescript
interface CapabilityGuardConfig {
  declaredCapabilities: readonly Capability[];
  apiFactory: CapabilityApiFactory;
  noOpApiFactory: CapabilityApiFactory;
  checkPermission?: (cap: Capability) => PermissionResult;
}
```

**Returns:**
```typescript
interface CapabilityGuard {
  getCapability<T extends Capability>(cap: T): CapabilityResult<CapabilityApiMap[T]>;
}
```

---

## Branded Type Factories

### createSessionId
```typescript
function createSessionId(value: string): SessionId
```

### createLevelId
```typescript
function createLevelId(value: string): LevelId
```

### createDifficulty
```typescript
function createDifficulty(value: number): Difficulty
// value must be integer 1-10
```

### createTimestamp
```typescript
function createTimestamp(ms?: number): Timestamp
// defaults to Date.now()
```

### createDuration
```typescript
function createDuration(ms: number): DurationMs
// ms must be non-negative integer
```

---

## Type Guards

### isValidSessionId
```typescript
function isValidSessionId(value: unknown): value is string
```

### isValidLevelId
```typescript
function isValidLevelId(value: unknown): value is string
```

### isValidDifficulty
```typescript
function isValidDifficulty(value: unknown): value is number
```

### isValidDuration
```typescript
function isValidDuration(value: unknown): value is number
```

---

## State Hooks

### useSaveGameState
```typescript
function useSaveGameState(
  emit: (event: GameEvent) => void,
  schemaVersion: number
): (state: unknown) => void
```

### useGameState
```typescript
function useGameState<TState>(
  savedState: TState | undefined,
  defaultState: TState,
  validator?: (state: unknown) => state is TState
): TState
```

### useAutoSaveState
```typescript
function useAutoSaveState<TState>(
  emit: (event: GameEvent) => void,
  schemaVersion: number,
  initialState: TState
): [TState, (updater: TState | ((prev: TState) => TState)) => void]
```

### createStateMigrator
```typescript
function createStateMigrator(
  migrations: Record<number, (state: unknown) => unknown>
): (state: unknown, fromVersion: number, toVersion: number) => unknown
```

---

## Event Types

### Session Events
- `SESSION_STARTED`
- `SESSION_ENDED`
- `SESSION_ABORTED`

### Progression Events
- `LEVEL_STARTED`
- `LEVEL_COMPLETED`
- `LEVEL_FAILED`
- `CHECKPOINT_REACHED`

### Performance Events
- `PERFORMANCE_REPORTED`

### Time Events
- `ACTIVE_TIME_REPORTED`

### Friction Events
- `FRICTION_REPORTED`

### Error Events
- `ERROR_MADE`
- `FAILURE_OCCURRED`

### State Events
- `SAVE_GAME_STATE`

### User Events
- `USER_SIGNAL`

### Dev Events
- `DEV_LOG` (stripped in production)

---

## Dev Tooling

### createDevHarness
```typescript
function createDevHarness(config: DevHarnessConfig): DevHarness
```

### createEventInspector
```typescript
function createEventInspector(): EventInspector
```

### Mock Context Generators
```typescript
function createMockInitialContext(metadata, options?): InitialContext
function createMockInSessionContext(metadata, options?): InSessionContext
function createMockSessionEndedContext(metadata, options?): SessionEndedContext
function createMockContext(state, metadata, options?): GameContext
```

### Mock Capability APIs
```typescript
const createMockCapabilityApi: CapabilityApiFactory
const createNoOpCapabilityApi: CapabilityApiFactory
```

---

## Capability APIs

### AudioCapabilityApi
```typescript
interface AudioCapabilityApi {
  playSound(soundId: string, options?: AudioPlayOptions): void;
  stopSound(soundId: string): void;
  stopAllSounds(): void;
}
```

### HapticsCapabilityApi
```typescript
interface HapticsCapabilityApi {
  trigger(pattern: HapticPattern): void;
}
```

### TimersCapabilityApi
```typescript
interface TimersCapabilityApi {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): number;
  clearTimeout(timerId: number): void;
}
```

### SensorsCapabilityApi
```typescript
interface SensorsCapabilityApi {
  onAccelerometer(callback: (data: AccelerometerData) => void): () => void;
  onGyroscope(callback: (data: GyroscopeData) => void): () => void;
}
```

### AnimationsCapabilityApi
```typescript
interface AnimationsCapabilityApi {
  requestAnimationFrame(callback: (timestamp: number) => void): number;
  cancelAnimationFrame(frameId: number): void;
}
```

---

## Error Classes

### BrandedTypeError
Base class for branded type validation errors.

### InvalidDifficultyError
Thrown when difficulty is not 1-10 integer.

### InvalidDurationError
Thrown when duration is not non-negative integer.

### InvalidSessionIdError
Thrown when session ID is empty.

### InvalidLevelIdError
Thrown when level ID is empty.

### CapabilityNotDeclaredError
Thrown when requesting undeclared capability.

### CapabilityDeniedError
Thrown when capability check fails (check `isAvailable` instead).
