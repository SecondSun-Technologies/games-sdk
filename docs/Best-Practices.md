# Best Practices

Guidelines and patterns for building great games with the SDK.

## Event Emission

### Do: Emit Observable Facts

```typescript
// ✅ Good - factual observations
emit({
  type: 'PERFORMANCE_REPORTED',
  accuracy: 0.85,
  reactionTimeMs: 342,
  errorCount: 3,
});
```

### Don't: Emit Interpretations

```typescript
// ❌ Bad - these are conclusions, not facts
emit({ type: 'USER_IMPROVED', improvement: 15 });
emit({ type: 'SESSION_WAS_GOOD' });
```

### Do: Emit at Logical Points

```typescript
// ✅ Good - boundaries and milestones
onLevelComplete() { emit({ type: 'LEVEL_COMPLETED', ... }); }
onCheckpoint() { emit({ type: 'CHECKPOINT_REACHED', ... }); }
```

### Don't: Over-Emit

```typescript
// ❌ Bad - too granular
onEveryClick() { emit(...); }
onEveryFrame() { emit(...); }
```

## Capability Usage

### Always Check Availability

```typescript
// ✅ Good
const haptics = getCapability('haptics');
if (haptics.isAvailable) {
  haptics.api.trigger('success');
}
showVisualFeedback(); // Always have fallback
```

### Don't Assume Capabilities

```typescript
// ❌ Bad - assumes availability
getCapability('audio').api.playSound('click');
```

## State Management

### Keep Persistent State Minimal

```typescript
// ✅ Good - only essential data
saveState({
  highScore: 1000,
  unlockedLevels: [1, 2, 3],
});

// ❌ Bad - too much data
saveState({
  allGameHistory: [...],
  replayBuffers: [...],
  tempCalculations: [...],
});
```

### Always Validate Loaded State

```typescript
// ✅ Good - validate with fallback
const state = useGameState(
  context.savedGameState,
  defaultState,
  isValidState
);
```

## Accessibility

### Respect User Preferences

```typescript
// ✅ Good - check preferences
const { reduceMotion, fontScale } = context.accessibilityPrefs;

return reduceMotion ? <Static /> : <Animated />;
```

### Provide Visual Alternatives

```typescript
// ✅ Good - multiple feedback channels
function onSuccess() {
  if (haptics.isAvailable) haptics.api.trigger('success');
  if (audio.isAvailable) audio.api.playSound('ding');
  showSuccessVisual(); // Always works
}
```

## Error Handling

### Let SDK Handle Validation

```typescript
// ✅ Good - SDK validates and clamps
emit({
  type: 'PERFORMANCE_REPORTED',
  accuracy: calculatedValue, // SDK clamps if out of range
});
```

### Don't Wrap emit() in try/catch

```typescript
// ❌ Unnecessary - emit never throws
try {
  emit(event);
} catch (e) {
  // This never runs
}

// ✅ Just emit
emit(event);
```

## Type Safety

### Use Branded Type Factories

```typescript
// ✅ Good
const levelId = createLevelId('level-1');
const difficulty = createDifficulty(5);

// ❌ Bad - bypasses validation
const levelId = 'level-1' as LevelId;
```

### Exhaust Switch Statements

```typescript
// ✅ Good - compiler catches missing cases
switch (context.state) {
  case 'INITIAL': return <Start />;
  case 'IN_SESSION': return <Play />;
  case 'ENDED': return <Results />;
  // TypeScript error if case missing
}
```

## Testing

### Use Dev Harness

```typescript
const harness = createDevHarness({
  metadata: myGameMetadata,
  logEvents: false, // Quiet in tests
});

// Inspect emitted events
expect(harness.inspector.getHistory()).toHaveLength(1);
```

### Test All Context States

```typescript
it('renders start screen in INITIAL', () => {
  harness.setContextState('INITIAL');
  render(<MyGame context={harness.context} />);
  expect(screen.getByText('Start')).toBeInTheDocument();
});

it('renders game in IN_SESSION', () => {
  harness.setContextState('IN_SESSION');
  render(<MyGame context={harness.context} />);
  expect(screen.getByText('Playing')).toBeInTheDocument();
});
```

## Performance

### Batch State Updates

```typescript
// ✅ Good - single setState
setState(s => ({
  ...s,
  score: s.score + 10,
  streak: s.streak + 1,
}));

// ❌ Bad - multiple re-renders
setScore(score + 10);
setStreak(streak + 1);
```

### Memoize Heavy Computations

```typescript
import { useMemo } from '@secondsuntech/games-sdk';

const sortedItems = useMemo(
  () => expensiveSort(items),
  [items]
);
```

## Next Steps

- [[FAQ]] - Common questions
- [[API Reference]] - Complete API
- [[Home]] - Back to home
