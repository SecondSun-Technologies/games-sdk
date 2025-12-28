# FAQ

Frequently asked questions about the Games SDK.

## General

### Why can't games calculate scores?

Games emit observations; the platform calculates scores. This ensures:
- Consistent scoring across all games
- Tamper-resistant analytics
- Platform can evolve scoring without game updates

### Why are events fire-and-forget?

If games could await event delivery:
- They could block on network issues
- They could make decisions based on platform responses
- They'd have authority they shouldn't have

Fire-and-forget keeps games stateless and unprivileged.

### What happens to invalid events?

| Mode | Behavior |
|------|----------|
| Development | Console error + dropped |
| Production | Silently dropped |

Your game continues either way. Invalid events just don't reach the platform.

## Events

### My accuracy is 1.0000001, will it be rejected?

No. Analytics fields like `accuracy` and `successRate` are **clamped** to [0, 1], not rejected. In development, you'll see a warning.

### How many events should I emit per session?

| Count | Assessment |
|-------|------------|
| 10-50 | ✅ Healthy |
| 100+ | ⚠️ Too chatty |
| 1-2 | ⚠️ Not enough signal |

### What's the difference between LEVEL_FAILED and ERROR_MADE?

- `ERROR_MADE` - Individual mistakes during play
- `LEVEL_FAILED` - Level termination due to failure

You might emit many `ERROR_MADE` events before one `LEVEL_FAILED`.

## Capabilities

### Why was my capability denied?

Common reasons:
- User disabled the feature in settings
- Device doesn't support it
- Platform is in "quiet mode"
- Battery saver is active

Check `unavailableReason` for details.

### What happens if I call a denied capability?

Nothing. The API is a no-op wrapper. Methods do nothing but won't throw.

### Why must I declare capabilities in metadata?

Explicit declaration:
- Prevents "works on my machine" bugs
- Lets platform allocate resources
- Makes requirements clear for review

## State

### How big can savedGameState be?

Maximum ~1MB. Keep it minimal.

### When should I save state?

At logical breakpoints:
- Level completion
- Unlocking content
- Significant achievements

**Not** every frame or click.

### What if saved state is corrupted?

Always provide a default fallback:

```typescript
const state = useGameState(
  context.savedGameState,
  defaultState,  // Fallback
  validateState  // Validator
);
```

## Types

### Why can't I cast to branded types?

Direct casting bypasses validation:

```typescript
// ❌ This could be invalid
const bad = '' as SessionId;

// ✅ This validates
const good = createSessionId('valid-id');
```

### What if createDifficulty throws?

Catch it at the input boundary, not throughout your code:

```typescript
function handleDifficultySelect(raw: number) {
  try {
    const difficulty = createDifficulty(raw);
    startLevel(difficulty);
  } catch (e) {
    showError('Please select 1-10');
  }
}
```

## Development

### How do I test locally without the platform?

Use the dev harness:

```typescript
import { createDevHarness } from '@secondsuntech/games-sdk/dev';

const harness = createDevHarness({ metadata });
<MyGame context={harness.context} emit={harness.emit} />
```

### Are dev tools included in production builds?

No. The `/dev` import path is tree-shaken in production.

### How do I see emitted events?

```typescript
// Option 1: Enable logging
const harness = createDevHarness({ metadata, logEvents: true });

// Option 2: Use inspector
console.log(harness.inspector.getHistory());
```

## Troubleshooting

### TypeScript says my capability isn't declared

Add it to both places:

```typescript
const game = createGame({
  metadata: {
    capabilities: ['audio'], // Here
  },
  capabilities: ['audio'],   // And here
  render: MyGame,
});
```

### My events aren't being captured

1. Check you're using the harness's `emit`, not a mock
2. Check `logEvents: true` is set
3. Check the inspector: `harness.inspector.getHistory()`

### State isn't persisting between sessions

1. Ensure you're emitting `SAVE_GAME_STATE`
2. Check the `schemaVersion` matches
3. Validate your state structure

## Next Steps

- [[Home]] - Back to home
- [[API Reference]] - Complete API
- [[Best Practices]] - Guidelines
