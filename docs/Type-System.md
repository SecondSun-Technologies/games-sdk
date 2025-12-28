# Type System

The Games SDK uses a strict type system with branded types and runtime validation.

## Branded Types

Branded types provide **nominal typing** in TypeScript's structural type system. They prevent accidental misuse of values.

### Why Branded Types?

```typescript
// Without brands - dangerous!
function startLevel(levelId: string, sessionId: string) { ... }

startLevel(sessionId, levelId); // Oops! Compiles but wrong!
```

```typescript
// With brands - safe!
function startLevel(levelId: LevelId, sessionId: SessionId) { ... }

startLevel(sessionId, levelId); // ❌ Type error!
```

### Available Branded Types

| Type | Description | Factory |
|------|-------------|---------|
| `SessionId` | Unique session identifier | `createSessionId(value)` |
| `LevelId` | Stable level identifier | `createLevelId(value)` |
| `Difficulty` | 1-10 difficulty scale | `createDifficulty(value)` |
| `Timestamp` | Milliseconds since epoch | `createTimestamp()` |
| `DurationMs` | Non-negative duration | `createDuration(value)` |

### Creating Branded Types

Factory functions are the **only** way to create branded types:

```typescript
import {
  createSessionId,
  createLevelId,
  createDifficulty,
  createTimestamp,
  createDuration,
} from '@secondsuntech/games-sdk';

// ✅ Correct
const sessionId = createSessionId('sess-abc-123');
const levelId = createLevelId('level-1');
const difficulty = createDifficulty(5);
const timestamp = createTimestamp(); // Current time
const duration = createDuration(5000);

// ❌ FORBIDDEN - Never do this
const badId = 'sess-abc-123' as SessionId;
```

### Validation Errors

Factory functions throw on invalid input:

```typescript
createDifficulty(0);   // ❌ InvalidDifficultyError
createDifficulty(11);  // ❌ InvalidDifficultyError
createDifficulty(5.5); // ❌ InvalidDifficultyError (must be integer)

createDuration(-100);  // ❌ InvalidDurationError
createDuration(5.5);   // ❌ InvalidDurationError (must be integer)

createLevelId('');     // ❌ InvalidLevelIdError
createSessionId('');   // ❌ InvalidSessionIdError
```

### Type Guards

Check validity without throwing:

```typescript
import {
  isValidSessionId,
  isValidLevelId,
  isValidDifficulty,
  isValidDuration,
} from '@secondsuntech/games-sdk';

if (isValidDifficulty(userInput)) {
  const difficulty = createDifficulty(userInput);
}
```

## Metadata Types

### GameMetadata

```typescript
interface GameMetadata {
  readonly id: string;                        // Stable unique identifier
  readonly name: string;                      // Display name
  readonly version: string;                   // Semver version
  readonly categories: readonly GameCategory[];
  readonly recommendedSessionDurationMs: number;
  readonly capabilities: readonly Capability[];
  readonly stateSchemaVersion: number;
}
```

### GameCategory

```typescript
type GameCategory =
  | 'memory'
  | 'focus'
  | 'speed'
  | 'regulation'
  | 'planning'
  | 'flexibility';
```

## Context Types

See [[Game Context]] for full details.

```typescript
type GameContext =
  | InitialContext      // state: 'INITIAL'
  | InSessionContext    // state: 'IN_SESSION'
  | SessionEndedContext // state: 'ENDED'
```

## Best Practices

### 1. Create at Boundaries

```typescript
// ✅ Create branded types at the entry point
function handleLevelSelect(rawLevelId: string) {
  const levelId = createLevelId(rawLevelId);
  startLevel(levelId);
}

// ❌ Don't pass raw strings around
function startLevel(levelId: string) { ... }
```

### 2. Never Cast

```typescript
// ❌ NEVER do this
const sessionId = someString as SessionId;

// ✅ Always use factories
const sessionId = createSessionId(someString);
```

### 3. Let TypeScript Help

```typescript
// TypeScript catches misuse at compile time
emit({
  type: 'LEVEL_COMPLETED',
  levelId: sessionId, // ❌ Type error!
  // ...
});
```

## Next Steps

- [[Event System]] - Event types and validation
- [[Capabilities]] - Capability types
- [[Game Context]] - Context types
