# Getting Started

This guide will get you up and running with the SecondSun Games SDK.

## Prerequisites

- Node.js 18+
- React 18+
- TypeScript 5.3+

## Installation

```bash
npm install @secondsuntech/games-sdk
```

## Your First Game

### 1. Create the Game Component

```typescript
import type { GameRenderProps } from '@secondsuntech/games-sdk';

interface MyGameState {
  highScore: number;
}

function MyGame({ context, emit }: GameRenderProps<MyGameState>) {
  // Check if we're in an active session
  if (context.state !== 'IN_SESSION') {
    return <div>Waiting for session...</div>;
  }

  const handleSuccess = () => {
    emit({
      type: 'PERFORMANCE_REPORTED',
      accuracy: 1.0,
      streakLength: 1,
    });
  };

  return (
    <div>
      <h1>Welcome to My Game!</h1>
      <p>Session: {context.sessionId}</p>
      <button onClick={handleSuccess}>I did it!</button>
    </div>
  );
}
```

### 2. Register the Game

```typescript
import { createGame } from '@secondsuntech/games-sdk';

export const game = createGame({
  metadata: {
    id: 'com.mycompany.my-game',
    name: 'My First Game',
    version: '1.0.0',
    categories: ['memory'],
    recommendedSessionDurationMs: 300000, // 5 minutes
    capabilities: [],
    stateSchemaVersion: 1,
  },
  capabilities: [],
  render: MyGame,
});
```

### 3. Test Locally

```typescript
import { createDevHarness } from '@secondsuntech/games-sdk/dev';

const harness = createDevHarness({
  metadata: game.metadata,
  logEvents: true,
});

// Render with harness
<MyGame context={harness.context} emit={harness.emit} />

// Check emitted events
console.log(harness.inspector.getStats());
```

## Project Structure

```
my-game/
├── src/
│   ├── index.ts          # Game registration
│   ├── MyGame.tsx        # Main component
│   ├── components/       # UI components
│   └── hooks/            # Custom hooks
├── package.json
└── tsconfig.json
```

## TypeScript Configuration

Ensure strict mode is enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

## Next Steps

- [[Core Concepts]] - Understand the SDK philosophy
- [[Event System]] - Learn about events
- [[Capabilities]] - Request platform features
- [[Developer Tooling]] - Testing and debugging
