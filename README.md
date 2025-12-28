# @secondsuntech/games-sdk

> **The official SDK for building cognitive wellness games on the SecondSun platform.**

Games are unprivileged, stateless React modules. They emit facts, not decisions. The platform owns authority.

[![CI](https://github.com/SecondSun-Technologies/games-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/SecondSun-Technologies/games-sdk/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 📚 Documentation

**[Full Wiki Documentation →](https://github.com/SecondSun-Technologies/games-sdk/wiki)**

---

## 🎯 Philosophy

```
Games do not log conclusions—they log observations.

NOT: "user improved", "this was hard", "award points"
BUT: what happened, when it happened, under what conditions, how long it took

You interpret. The game reports facts.
```

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Games are Unprivileged** | No direct data access, no persistence, no authority |
| **Platform Owns Truth** | Session lifecycle, scores, rewards—all platform-controlled |
| **Emit Facts, Not Decisions** | Games report observations; platform derives conclusions |
| **Explicit Capabilities** | Undeclared capabilities cannot be used |
| **Graceful Degradation** | Capabilities may be denied at runtime; handle it |
| **Fire-and-Forget Events** | `emit()` never throws, never blocks, never returns confirmation |

---

## 📦 Installation

```bash
npm install @secondsuntech/games-sdk
```

**Peer Dependencies:**
```bash
npm install react@^18.0.0
```

---

## 🚀 Quick Start

### 1. Define Your Game

```typescript
import { createGame, type GameRenderProps } from '@secondsuntech/games-sdk';

// Your game component
function MyGame({ context, emit }: GameRenderProps) {
  const handleCorrect = () => {
    emit({
      type: 'PERFORMANCE_REPORTED',
      accuracy: 0.95,
      reactionTimeMs: 342,
    });
  };

  return (
    <div>
      <h1>My Cognitive Game</h1>
      <button onClick={handleCorrect}>Correct!</button>
    </div>
  );
}

// Register the game
export const game = createGame({
  metadata: {
    id: 'com.example.my-game',
    name: 'My Cognitive Game',
    version: '1.0.0',
    categories: ['memory', 'focus'],
    recommendedSessionDurationMs: 300000, // 5 minutes
    capabilities: ['audio', 'haptics'],
    stateSchemaVersion: 1,
  },
  capabilities: ['audio', 'haptics'],
  render: MyGame,
});
```

### 2. Use Capabilities

```typescript
import { createCapabilityGuard } from '@secondsuntech/games-sdk';

// Capabilities are requested, not assumed
const { getCapability } = createCapabilityGuard({
  declaredCapabilities: ['audio', 'haptics'],
  apiFactory: platformApiFactory,       // Provided by platform
  noOpApiFactory: platformNoOpFactory,  // Provided by platform
});

// Check availability before use
const audio = getCapability('audio');
if (audio.isAvailable) {
  audio.api.playSound('success');
} else {
  console.log('Audio unavailable:', audio.unavailableReason);
}
```

### 3. Emit Events

```typescript
// Session lifecycle (platform-acknowledged)
emit({ type: 'SESSION_STARTED', sessionId });

// Progression
emit({
  type: 'LEVEL_COMPLETED',
  levelId: createLevelId('level-1'),
  attemptNumber: 1,
  durationMs: createDuration(45000),
  difficulty: createDifficulty(5),
});

// Performance (multi-dimensional, never a single "score")
emit({
  type: 'PERFORMANCE_REPORTED',
  accuracy: 0.92,          // 0-1, clamped if out of range
  reactionTimeMs: 380,
  errorCount: 2,
  streakLength: 5,
});

// State persistence
emit({
  type: 'SAVE_GAME_STATE',
  stateBlob: { highScore: 1000, unlockedLevels: [1, 2, 3] },
  schemaVersion: 1,
});
```

---

## 🔒 Type System

### Branded Types

All identifiers use **branded types** for compile-time safety:

```typescript
import {
  createSessionId,
  createLevelId,
  createDifficulty,
  createTimestamp,
  createDuration,
} from '@secondsuntech/games-sdk';

// These are the ONLY way to create branded types
const sessionId = createSessionId('sess-123');     // SessionId
const levelId = createLevelId('level-1');          // LevelId
const difficulty = createDifficulty(5);            // Difficulty (1-10)
const timestamp = createTimestamp();               // Timestamp (now)
const duration = createDuration(5000);             // DurationMs (non-negative integer)
```

**Direct casting is forbidden.** Factory functions validate at runtime.

### Game Context

Context is a discriminated union representing lifecycle states:

```typescript
type GameContext =
  | InitialContext      // state: 'INITIAL' - pre-session
  | InSessionContext    // state: 'IN_SESSION' - active play
  | SessionEndedContext // state: 'ENDED' - results

// Use exhaustive switch
switch (context.state) {
  case 'INITIAL':
    return <StartScreen />;
  case 'IN_SESSION':
    return <GamePlay session={context.sessionId} />;
  case 'ENDED':
    return <Results summary={context.sessionSummary} />;
}
```

---

## 📡 Event System

### Event Categories

| Category | Events | Purpose |
|----------|--------|---------|
| **Session** | `SESSION_STARTED`, `SESSION_ENDED`, `SESSION_ABORTED` | Lifecycle acknowledgments |
| **Progression** | `LEVEL_STARTED`, `LEVEL_COMPLETED`, `LEVEL_FAILED`, `CHECKPOINT_REACHED` | Where user is |
| **Performance** | `PERFORMANCE_REPORTED` | Multi-dimensional metrics |
| **Time** | `ACTIVE_TIME_REPORTED` | Engagement tracking |
| **Friction** | `FRICTION_REPORTED` | Difficulty claims (platform verifies) |
| **Errors** | `ERROR_MADE`, `FAILURE_OCCURRED` | Failure tracking |
| **State** | `SAVE_GAME_STATE` | Persistence requests |
| **User** | `USER_SIGNAL` | Voluntary self-reports |
| **Dev** | `DEV_LOG` | Development logging (stripped in prod) |

### Validation Behavior

| Mode | Invalid Event | Out-of-Range Value |
|------|---------------|-------------------|
| **Development** | Console error + drop | Console warn + clamp |
| **Production** | Silent drop | Silent clamp |

### The `emit()` Contract

```typescript
// emit() is FIRE-AND-FORGET
// ✅ Returns void
// ✅ Never throws
// ✅ Never blocks
// ❌ Never confirms delivery
// ❌ Never returns a Promise

emit(event); // That's it. Move on.
```

---

## ⚡ Capabilities

### Available Capabilities

| Capability | API | Description |
|------------|-----|-------------|
| `audio` | `playSound()`, `stopSound()`, `stopAllSounds()` | Sound effects |
| `haptics` | `trigger(pattern)` | Vibration feedback |
| `timers` | `now()`, `setTimeout()`, `clearTimeout()` | High-precision timing |
| `sensors` | `onAccelerometer()`, `onGyroscope()` | Device motion |
| `animations` | `requestAnimationFrame()`, `cancelAnimationFrame()` | Smooth animations |

### Declaration is Not Authority

```typescript
// Declaring a capability REQUESTS it, doesn't GRANT it
metadata: {
  capabilities: ['audio', 'haptics'], // Request
}

// Platform may still deny at runtime
const haptics = getCapability('haptics');
if (!haptics.isAvailable) {
  // User disabled haptics, device doesn't support, etc.
  // Your game MUST handle this gracefully
}
```

---

## 💾 State Management

### Two Types of State

| Type | Managed By | Lifecycle | Platform Visibility |
|------|------------|-----------|---------------------|
| **Ephemeral** | React hooks | Current session only | None |
| **Persistent** | SDK events | Across sessions | Opaque blob |

### Ephemeral State (React Hooks)

```typescript
import { useState, useReducer } from '@secondsuntech/games-sdk';

function MyGame() {
  const [currentCard, setCurrentCard] = useState(0);
  // Lost on session end - that's fine
}
```

### Persistent State

```typescript
import { useSaveGameState, useGameState } from '@secondsuntech/games-sdk';

function MyGame({ emit, context }: GameRenderProps<MyState>) {
  // Load saved state with fallback
  const state = useGameState(context.savedGameState, { highScore: 0 });
  
  // Save state (emits SAVE_GAME_STATE event)
  const saveState = useSaveGameState(emit, 1);
  
  const handleNewHighScore = (score: number) => {
    saveState({ highScore: score });
  };
}
```

---

## 🛠 Developer Tooling

### Dev Harness

```typescript
import { createDevHarness } from '@secondsuntech/games-sdk/dev';

const harness = createDevHarness({
  metadata: myGameMetadata,
  logEvents: true,
});

// Use in development
render(
  <MyGame
    context={harness.context}
    emit={harness.emit}
  />
);

// Inspect events
console.log(harness.inspector.getStats());
console.log(harness.inspector.getHistory());
```

### Mock Context

```typescript
import {
  createMockInSessionContext,
  createMockInitialContext,
} from '@secondsuntech/games-sdk/dev';

// Test different states
const inSession = createMockInSessionContext(metadata, {
  savedGameState: { level: 5 },
  progression: { currentLevel: 10 },
});
```

### Event Inspector

```typescript
import { createEventInspector } from '@secondsuntech/games-sdk/dev';

const inspector = createEventInspector();
// Capture events, filter, export JSON
```

---

## 📁 Project Structure

```
src/
├── index.ts           # Main exports
├── core/
│   ├── create-game.ts        # Game registration
│   └── capability-guard.ts   # Capability access
├── types/
│   ├── branded.ts            # Branded types + factories
│   ├── capabilities.ts       # Capability definitions
│   ├── context.ts            # GameContext union
│   └── metadata.ts           # GameMetadata interface
├── events/
│   ├── event-types.ts        # All event definitions
│   ├── event-validators.ts   # Runtime validation
│   └── event-emitter.ts      # Fire-and-forget emitter
├── state/
│   └── index.ts              # State management hooks
└── dev/
    ├── harness.ts            # Dev testing harness
    ├── mock-context.ts       # Context generators
    ├── event-inspector.ts    # Event debugging
    └── capability-apis.ts    # Mock capability APIs
```

---

## 🔧 Configuration

### TypeScript

The SDK requires strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### ESLint

Recommended ESLint rules:

```javascript
// eslint.config.mjs
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  }
);
```

---

## 📜 Scripts

```bash
npm run build       # Compile TypeScript
npm run typecheck   # Type check without emitting
npm run lint        # Run ESLint
npm run lint:fix    # Fix auto-fixable issues
npm run test        # Run tests
npm run dev         # Start dev server
```

---

## 📄 License

Apache 2.0 © [SecondSun Technologies LLC](https://secondsuntech.com)

---

## 🔗 Links

- [Wiki Documentation](https://github.com/SecondSun-Technologies/games-sdk/wiki)
- [API Reference](https://github.com/SecondSun-Technologies/games-sdk/wiki/API-Reference)
- [Issue Tracker](https://github.com/SecondSun-Technologies/games-sdk/issues)
