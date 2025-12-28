# Developer Tooling

Tools for developing and testing games locally.

## Dev Harness

The dev harness provides a complete local testing environment.

```typescript
import { createDevHarness } from '@secondsuntech/games-sdk/dev';

const harness = createDevHarness({
  metadata: myGameMetadata,
  logEvents: true,
  contextOptions: {
    savedGameState: { highScore: 100 },
  },
});

// Use in your app
<MyGame 
  context={harness.context} 
  emit={harness.emit} 
/>
```

### Harness API

```typescript
interface DevHarness {
  context: GameContext;                    // Current context
  emit: (event: GameEvent) => void;        // Event emitter
  capabilities: CapabilityGuard;           // Capability guard
  inspector: EventInspector;               // Event inspector
  
  setContextState(state): void;            // Switch context state
  updateContext(options): void;            // Update context options
  getSessionId(): SessionId | undefined;   // Current session
  reset(): void;                           // Reset to initial state
}
```

### Switching States

```typescript
// Test different lifecycle states
harness.setContextState('INITIAL');    // Pre-session
harness.setContextState('IN_SESSION'); // Active play
harness.setContextState('ENDED');      // Post-session
```

### Updating Context

```typescript
// Update context with new options
harness.updateContext({
  savedGameState: { level: 5 },
  accessibilityPrefs: { reduceMotion: true },
});
```

## Event Inspector

Capture and inspect emitted events.

```typescript
import { createEventInspector } from '@secondsuntech/games-sdk/dev';

const inspector = createEventInspector();

// Capture events
inspector.capture(emittedEvent);

// Get all events
const history = inspector.getHistory();

// Filter by type
const performance = inspector.filterByType('PERFORMANCE_REPORTED');

// Get stats
const stats = inspector.getStats();
console.log(stats.totalEvents);
console.log(stats.byType['PERFORMANCE_REPORTED']);

// Clear history
inspector.clear();

// Export JSON
const json = inspector.toJSON();
```

### Inspector API

```typescript
interface EventInspector {
  capture(event: EmittedEvent): void;
  getHistory(): readonly EmittedEvent[];
  filterByType(type: string): readonly EmittedEvent[];
  getStats(): EventStats;
  clear(): void;
  toJSON(): string;
  subscribe(handler): () => void;
}
```

## Mock Context

Generate mock contexts for testing.

```typescript
import {
  createMockInitialContext,
  createMockInSessionContext,
  createMockSessionEndedContext,
  createMockContext,
} from '@secondsuntech/games-sdk/dev';

// Pre-session context
const initial = createMockInitialContext(metadata);

// Active session context
const inSession = createMockInSessionContext(metadata, {
  savedGameState: { level: 5 },
  progression: { currentLevel: 10 },
  accessibilityPrefs: { reduceMotion: true },
});

// Post-session context
const ended = createMockSessionEndedContext(metadata, {
  sessionSummary: { levelsCompleted: 3 },
});

// Or use the generic helper
const ctx = createMockContext('IN_SESSION', metadata, options);
```

### Default Values

```typescript
import {
  DEFAULT_ACCESSIBILITY_PREFS,
  MAX_ACCESSIBILITY_PREFS,
  DEFAULT_ORG_CONFIG,
  DEFAULT_PROGRESSION,
  EXPERIENCED_PROGRESSION,
} from '@secondsuntech/games-sdk/dev';

// Test maximum accessibility
const context = createMockInSessionContext(metadata, {
  accessibilityPrefs: MAX_ACCESSIBILITY_PREFS,
});
```

## Mock Capability APIs

Development implementations log to console.

```typescript
import {
  createMockCapabilityApi,
  createNoOpCapabilityApi,
} from '@secondsuntech/games-sdk/dev';

// Create capability guard with mock APIs
const { getCapability } = createCapabilityGuard({
  declaredCapabilities: ['audio', 'haptics'],
  apiFactory: createMockCapabilityApi,
  noOpApiFactory: createNoOpCapabilityApi,
});

// Now capability calls log to console
const audio = getCapability('audio');
audio.api.playSound('click'); // Logs: [Audio] Play: click
```

## Development Setup

### Import Path

Dev tools are on a separate import path:

```typescript
// Main SDK
import { createGame } from '@secondsuntech/games-sdk';

// Dev tools (tree-shaken in production)
import { createDevHarness } from '@secondsuntech/games-sdk/dev';
```

### Example Test Setup

```typescript
import { createDevHarness } from '@secondsuntech/games-sdk/dev';
import { render, screen, fireEvent } from '@testing-library/react';

describe('MyGame', () => {
  it('emits events on button click', () => {
    const harness = createDevHarness({
      metadata: myGameMetadata,
      logEvents: false, // Quiet in tests
    });
    
    render(
      <MyGame 
        context={harness.context} 
        emit={harness.emit} 
      />
    );
    
    fireEvent.click(screen.getByText('Click me'));
    
    const events = harness.inspector.getHistory();
    expect(events).toHaveLength(1);
    expect(events[0].event.type).toBe('PERFORMANCE_REPORTED');
  });
});
```

### Storybook Integration

```typescript
// MyGame.stories.tsx
import { createDevHarness } from '@secondsuntech/games-sdk/dev';

const harness = createDevHarness({
  metadata: myGameMetadata,
});

export default {
  title: 'Games/MyGame',
  component: MyGame,
};

export const InSession = () => (
  <MyGame context={harness.context} emit={harness.emit} />
);

export const WithAccessibility = () => {
  harness.updateContext({
    accessibilityPrefs: { reduceMotion: true, highContrast: true },
  });
  return <MyGame context={harness.context} emit={harness.emit} />;
};
```

## Next Steps

- [[Best Practices]] - Testing patterns
- [[API Reference]] - Complete API
- [[FAQ]] - Common questions
