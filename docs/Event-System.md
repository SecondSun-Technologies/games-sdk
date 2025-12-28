# Event System

The event system is how games communicate observations to the platform.

## The Event Contract

```typescript
// emit() guarantees:
// ✅ Returns void
// ✅ Never throws
// ✅ Never blocks
// ✅ Never confirms delivery

emit(event); // That's it. Move on.
```

## Event Categories

### Session Lifecycle

Platform-acknowledged events for session tracking.

#### SESSION_STARTED

```typescript
emit({
  type: 'SESSION_STARTED',
  sessionId: context.sessionId,
});
```

#### SESSION_ENDED

```typescript
emit({
  type: 'SESSION_ENDED',
  sessionId: context.sessionId,
  reason: 'completed', // 'completed' | 'user_exit' | 'timeout'
  totalDurationMs: createDuration(300000),
});
```

#### SESSION_ABORTED

```typescript
emit({
  type: 'SESSION_ABORTED',
  sessionId: context.sessionId,
  reason: 'crash', // 'crash' | 'force_close' | 'platform_termination' | 'network_error'
  durationBeforeAbortMs: createDuration(45000),
});
```

### Progression

Track where the user is in the game.

#### LEVEL_STARTED

```typescript
emit({
  type: 'LEVEL_STARTED',
  levelId: createLevelId('level-1'),
  attemptNumber: 1,
  difficulty: createDifficulty(5),
});
```

#### LEVEL_COMPLETED

```typescript
emit({
  type: 'LEVEL_COMPLETED',
  levelId: createLevelId('level-1'),
  attemptNumber: 1,
  durationMs: createDuration(45000),
  difficulty: createDifficulty(5),
});
```

#### LEVEL_FAILED

```typescript
emit({
  type: 'LEVEL_FAILED',
  levelId: createLevelId('level-1'),
  attemptNumber: 2,
  durationMs: createDuration(30000),
  difficulty: createDifficulty(5),
  failureReason: 'timeout', // optional
});
```

#### CHECKPOINT_REACHED

```typescript
emit({
  type: 'CHECKPOINT_REACHED',
  levelId: createLevelId('level-1'),
  checkpointId: 'checkpoint-3',
  elapsedMs: createDuration(15000),
});
```

### Performance

Multi-dimensional performance metrics. **Never a single "score".**

#### PERFORMANCE_REPORTED

```typescript
emit({
  type: 'PERFORMANCE_REPORTED',
  accuracy: 0.92,        // 0-1, proportion correct
  reactionTimeMs: 380,   // Central tendency
  errorCount: 3,         // Count of mistakes
  hintsUsed: 1,          // Assists used
  streakLength: 5,       // Best streak
  successRate: 0.88,     // 0-1
  itemsCompleted: 10,    // Items done
  levelId: createLevelId('level-1'), // Optional context
});
```

All fields are optional. Emit what's relevant.

### Time

#### ACTIVE_TIME_REPORTED

```typescript
emit({
  type: 'ACTIVE_TIME_REPORTED',
  activeDurationMs: createDuration(280000),
  idleDurationMs: createDuration(20000), // Optional
  pausesCount: 2,                        // Optional
  levelId: createLevelId('level-1'),     // Optional
});
```

### Friction

Games claim difficulty; platform verifies against outcomes.

#### FRICTION_REPORTED

```typescript
emit({
  type: 'FRICTION_REPORTED',
  claimedDifficulty: createDifficulty(7),
  cognitiveLoadType: 'memory', // 'memory' | 'focus' | 'speed' | 'regulation' | 'planning' | 'mixed'
  ruleChangesCount: 2,           // Optional
  simultaneousElementsCount: 4,  // Optional
  levelId: createLevelId('level-1'), // Optional
});
```

### Errors

Failure is informative. Never shame users.

#### ERROR_MADE

```typescript
emit({
  type: 'ERROR_MADE',
  errorType: 'wrong_input', // 'wrong_input' | 'timeout' | 'rule_violation' | etc.
  count: 1,                  // Optional
  levelId: createLevelId('level-1'), // Optional
  context: { expected: 'A', got: 'B' }, // Optional
});
```

#### FAILURE_OCCURRED

```typescript
emit({
  type: 'FAILURE_OCCURRED',
  failureType: 'error_threshold', // 'error_threshold' | 'time_expired' | 'resource_depleted' | 'invalid_state'
  errorCount: 5,    // Optional
  levelId: createLevelId('level-1'), // Optional
});
```

### State Persistence

#### SAVE_GAME_STATE

```typescript
emit({
  type: 'SAVE_GAME_STATE',
  stateBlob: {
    highScore: 1000,
    unlockedLevels: [1, 2, 3],
    settings: { difficulty: 'hard' },
  },
  schemaVersion: 1,
});
```

**Constraints:**
- Max size: ~1MB
- Must be JSON-serializable
- Game owns schema and migration

### User Signals

Voluntary self-reports from users.

#### USER_SIGNAL

```typescript
emit({
  type: 'USER_SIGNAL',
  signalType: 'felt_hard', // 'felt_easy' | 'felt_hard' | 'felt_stressed' | etc.
  value: 0.8,              // Optional, 0-1 intensity
  levelId: createLevelId('level-1'), // Optional
});
```

Signal types: `felt_easy`, `felt_hard`, `felt_stressed`, `felt_calm`, `wants_more`, `wants_stop`, `enjoying`, `frustrated`

### Development

#### DEV_LOG

```typescript
emit({
  type: 'DEV_LOG',
  message: 'Debug info here',
  data: { foo: 'bar' }, // Optional
  level: 'debug',       // 'debug' | 'info' | 'warn' | 'error'
});
```

**Completely stripped in production.**

## Validation Behavior

### Clamping Policy

| Field Type | Behavior |
|------------|----------|
| `accuracy`, `successRate`, `value` | Clamp to [0, 1] |
| `reactionTimeMs`, counts | Clamp to ≥0 |
| IDs, types | Reject if invalid |

### Dev vs Prod

| Mode | Invalid Event | Out-of-Range |
|------|---------------|--------------|
| Development | console.error + drop | console.warn + clamp |
| Production | Silent drop | Silent clamp |

## Event Budget

Guidelines for healthy telemetry:

| Events/Session | Assessment |
|----------------|------------|
| 10-50 | ✅ Healthy |
| 100+ | ⚠️ Too chatty |
| 1-2 | ⚠️ Not enough signal |

## Next Steps

- [[State Management]] - Persistent state
- [[Developer Tooling]] - Event inspector
- [[API Reference]] - Complete reference
