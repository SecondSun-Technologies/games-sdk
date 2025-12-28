# State Management

The SDK provides two types of state management.

## Two Types of State

| Type | Managed By | Lifecycle | Platform Visibility |
|------|------------|-----------|---------------------|
| **Ephemeral** | React hooks | Current session only | None |
| **Persistent** | SDK events | Across sessions | Opaque blob |

## Ephemeral State

For UI state that only matters during the current session.

```typescript
import { useState, useReducer, useRef, useCallback, useMemo } from '@secondsuntech/games-sdk';

function MyGame() {
  // Current card shown
  const [currentCard, setCurrentCard] = useState(0);
  
  // Animation progress
  const [progress, setProgress] = useState(0);
  
  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  
  // All of this is LOST on session end - that's fine
}
```

**Use for:**
- Current UI state
- Animation timers
- Selection/hover states
- Temporary calculations

**Do NOT use for:**
- High scores
- Unlocked content
- User preferences that should persist

## Persistent State

For state that should survive across sessions.

### Basic Pattern

```typescript
import { useSaveGameState, useGameState } from '@secondsuntech/games-sdk';
import type { GameRenderProps } from '@secondsuntech/games-sdk';

interface MyGameState {
  highScore: number;
  unlockedLevels: number[];
  settings: { difficulty: 'easy' | 'hard' };
}

function MyGame({ emit, context }: GameRenderProps<MyGameState>) {
  // Load saved state with fallback for first-time players
  const state = useGameState(
    context.savedGameState,
    { highScore: 0, unlockedLevels: [1], settings: { difficulty: 'easy' } }
  );
  
  // Create save function
  const saveState = useSaveGameState(emit, 1); // schemaVersion: 1
  
  const handleLevelComplete = (score: number) => {
    if (score > state.highScore) {
      saveState({
        ...state,
        highScore: score,
      });
    }
  };
}
```

### Auto-Save Pattern

```typescript
import { useAutoSaveState } from '@secondsuntech/games-sdk';

function MyGame({ emit, context }: GameRenderProps<MyGameState>) {
  // State automatically saved on every change
  const [state, setState] = useAutoSaveState(
    emit,
    1, // schemaVersion
    context.savedGameState ?? { score: 0 }
  );
  
  // Every setState also triggers a save
  const handleScore = () => {
    setState(s => ({ ...s, score: s.score + 10 }));
    // SAVE_GAME_STATE event emitted automatically
  };
}
```

### Manual Validation

```typescript
import { useGameState } from '@secondsuntech/games-sdk';

// Type guard for state validation
function isMyGameState(state: unknown): state is MyGameState {
  if (typeof state !== 'object' || state === null) return false;
  const s = state as Record<string, unknown>;
  return typeof s.highScore === 'number' && Array.isArray(s.unlockedLevels);
}

function MyGame({ context }: GameRenderProps<MyGameState>) {
  // Validate saved state with type guard
  const state = useGameState(
    context.savedGameState,
    { highScore: 0, unlockedLevels: [1] },
    isMyGameState // Validator
  );
}
```

## State Migration

Games own schema and migration.

```typescript
import { createStateMigrator } from '@secondsuntech/games-sdk';

// Define migrations
const migrate = createStateMigrator({
  // Version 1 → 2: Add settings field
  2: (old: unknown) => ({
    ...(old as { highScore: number }),
    settings: { difficulty: 'easy' },
  }),
  // Version 2 → 3: Rename field
  3: (old: unknown) => {
    const { oldField, ...rest } = old as { oldField: string };
    return { ...rest, newField: oldField };
  },
});

// Use in game
const currentVersion = 3;
const state = migrate(context.savedGameState, savedSchemaVersion, currentVersion);
```

## Size Limits

- Max state blob size: **~1MB**
- Must be JSON-serializable
- Large save events may be dropped

## Best Practices

### 1. Keep It Small

```typescript
// ✅ Good - minimal data
saveState({ highScore: 1000, unlockedLevels: [1, 2, 3] });

// ❌ Bad - too much data
saveState({ 
  allMoveHistory: [...hugeArray], 
  replayData: [...moreHugeData] 
});
```

### 2. Save at Logical Points

```typescript
// ✅ Save on significant events
handleLevelComplete() { saveState(...); }
handleUnlock() { saveState(...); }

// ❌ Don't save every frame
onAnimationFrame() { saveState(...); } // Too much!
```

### 3. Always Provide Defaults

```typescript
// ✅ Handle missing/invalid state
const state = useGameState(
  context.savedGameState,
  defaultState,  // Always have a fallback
  validateState  // And validate
);
```

## Next Steps

- [[Game Context]] - Context types and lifecycle
- [[Developer Tooling]] - Testing state locally
- [[Best Practices]] - More patterns
