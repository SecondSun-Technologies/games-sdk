# Game Context

The GameContext represents the current state of the game's lifecycle.

## Context Union

```typescript
type GameContext =
  | InitialContext      // state: 'INITIAL'
  | InSessionContext    // state: 'IN_SESSION'
  | SessionEndedContext // state: 'ENDED'
```

Always use exhaustive switch:

```typescript
switch (context.state) {
  case 'INITIAL':
    return <StartScreen metadata={context.metadata} />;
  case 'IN_SESSION':
    return <GamePlay session={context} />;
  case 'ENDED':
    return <Results summary={context.sessionSummary} />;
}
```

## InitialContext

Pre-session state. User hasn't started playing yet.

```typescript
interface InitialContext {
  readonly state: 'INITIAL';
  readonly metadata: GameMetadata;
  readonly accessibilityPrefs: AccessibilityPrefs;
  readonly themeMode: 'light' | 'dark';
  readonly orgConfig: OrgConfig;
}
```

**Use for:**
- Start screen / menu
- Game instructions
- Settings preview

## InSessionContext

Active gameplay. User is playing.

```typescript
interface InSessionContext {
  readonly state: 'IN_SESSION';
  readonly sessionId: SessionId;
  readonly startTime: Timestamp;
  readonly metadata: GameMetadata;
  readonly progression: ProgressionSnapshot;
  readonly accessibilityPrefs: AccessibilityPrefs;
  readonly themeMode: 'light' | 'dark';
  readonly orgConfig: OrgConfig;
  readonly savedGameState?: unknown;  // Previously saved state
}
```

**Available data:**
- `sessionId` - Current session identifier
- `startTime` - When session started
- `progression` - User's overall progress
- `savedGameState` - Previously saved game state

## SessionEndedContext

Post-session state. Session is complete.

```typescript
interface SessionEndedContext {
  readonly state: 'ENDED';
  readonly sessionId: SessionId;
  readonly sessionDurationMs: DurationMs;
  readonly sessionSummary?: SessionSummary;
}
```

**Use for:**
- Results screen
- Session summary
- "Play again" option

## Supporting Types

### AccessibilityPrefs

```typescript
interface AccessibilityPrefs {
  readonly reduceMotion: boolean;
  readonly highContrast: boolean;
  readonly fontScale: number;
  readonly screenReaderActive: boolean;
  readonly largerTouchTargets: boolean;
  readonly colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}
```

**Respect these preferences:**

```typescript
function MyGame({ context }: GameRenderProps) {
  const { reduceMotion, fontScale } = context.accessibilityPrefs;
  
  return (
    <div style={{ fontSize: `${fontScale}rem` }}>
      {reduceMotion ? (
        <StaticIndicator />
      ) : (
        <AnimatedIndicator />
      )}
    </div>
  );
}
```

### ProgressionSnapshot

```typescript
interface ProgressionSnapshot {
  readonly currentLevel: number;
  readonly totalLevels?: number;
  readonly sessionsPlayed: number;
  readonly totalPlayTimeMs: DurationMs;
  readonly bestScores?: Record<string, number>;
  readonly completionCount: number;
}
```

### SessionSummary

```typescript
interface SessionSummary {
  readonly activeTimeMs: DurationMs;
  readonly levelsAttempted: number;
  readonly levelsCompleted: number;
  readonly finalAccuracy?: number;
  readonly averageReactionTimeMs?: number;
}
```

### OrgConfig

Platform/organization configuration.

```typescript
interface OrgConfig {
  readonly orgName: string;
  readonly enableCompetitiveFeatures: boolean;
  readonly customBranding?: {
    readonly primaryColor?: string;
    readonly logoUrl?: string;
  };
}
```

## Lifecycle Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   INITIAL   │ ──────▶ │  IN_SESSION  │ ──────▶ │    ENDED    │
│             │         │              │         │             │
│ Start       │ Platform│ Active       │ Session │ Results     │
│ screen      │ creates │ gameplay     │ ends    │ screen      │
└─────────────┘ session └──────────────┘         └─────────────┘
                              │
                              ▼
                        emit events
```

## Common Patterns

### Type Narrowing

```typescript
function GamePlay({ context }: { context: GameContext }) {
  // TypeScript knows the full type after narrowing
  if (context.state !== 'IN_SESSION') {
    return null;
  }
  
  // context is InSessionContext here
  return <div>Session: {context.sessionId}</div>;
}
```

### Conditional Rendering

```typescript
function MyGame({ context, emit }: GameRenderProps) {
  switch (context.state) {
    case 'INITIAL':
      return <WelcomeScreen />;
      
    case 'IN_SESSION':
      return (
        <GameBoard
          sessionId={context.sessionId}
          savedState={context.savedGameState}
          emit={emit}
        />
      );
      
    case 'ENDED':
      return (
        <ResultsScreen
          duration={context.sessionDurationMs}
          summary={context.sessionSummary}
        />
      );
  }
}
```

## Next Steps

- [[State Management]] - Using savedGameState
- [[Event System]] - Session events
- [[Developer Tooling]] - Mock contexts
