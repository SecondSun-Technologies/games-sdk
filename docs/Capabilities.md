# Capabilities

Capabilities are explicit requests for platform features.

## Philosophy

```typescript
// Declaration is REQUEST, not GRANT
metadata: {
  capabilities: ['audio', 'haptics'], // Request
}

// Platform may still deny at runtime
const audio = getCapability('audio');
if (!audio.isAvailable) {
  // User disabled, device unsupported, quiet mode, etc.
}
```

**Graceful degradation is required, not optional.**

## Available Capabilities

### Audio

Sound effects and audio playback.

```typescript
const audio = getCapability('audio');

if (audio.isAvailable) {
  audio.api.playSound('success', { volume: 0.8, loop: false });
  audio.api.stopSound('background');
  audio.api.stopAllSounds();
}
```

**May be denied if:**
- User muted the app
- Device is in silent mode
- Platform is in quiet mode

### Haptics

Vibration feedback.

```typescript
const haptics = getCapability('haptics');

if (haptics.isAvailable) {
  haptics.api.trigger('success'); // 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection'
}
```

**May be denied if:**
- User disabled haptics
- Device doesn't support vibration
- Battery saver active

### Timers

High-precision timing.

```typescript
const timers = getCapability('timers');

if (timers.isAvailable) {
  const now = timers.api.now(); // Sub-millisecond precision
  const id = timers.api.setTimeout(() => { ... }, 1000);
  timers.api.clearTimeout(id);
}
```

**May be denied if:**
- Low power mode active
- Platform restricting CPU usage

### Sensors

Device motion sensors.

```typescript
const sensors = getCapability('sensors');

if (sensors.isAvailable) {
  const unsub = sensors.api.onAccelerometer((data) => {
    console.log(data.x, data.y, data.z, data.timestamp);
  });
  
  // Later
  unsub();
}
```

**Note:** Callbacks may be throttled/sampled by the platform.

**May be denied if:**
- User denied sensor permission
- Device doesn't have sensors
- Privacy mode active

### Animations

Guaranteed animation frames.

```typescript
const animations = getCapability('animations');

if (animations.isAvailable) {
  const frameId = animations.api.requestAnimationFrame((timestamp) => {
    // Draw frame
  });
  animations.api.cancelAnimationFrame(frameId);
}
```

**May be denied if:**
- Low-end device
- Battery saver active
- Background tab

## Usage Pattern

```typescript
import { createCapabilityGuard } from '@secondsuntech/games-sdk';

// Create guard with declared capabilities
const { getCapability } = createCapabilityGuard({
  declaredCapabilities: metadata.capabilities,
  apiFactory: platformApiFactory,     // Provided by platform
  noOpApiFactory: platformNoOpFactory, // Provided by platform
});

// Request capability
const haptics = getCapability('haptics');

// Always check availability
if (haptics.isAvailable) {
  haptics.api.trigger('success');
} else {
  // Optional: show visual feedback instead
  console.log('Haptics unavailable:', haptics.unavailableReason);
}
```

## CapabilityResult

```typescript
interface CapabilityResult<TApi> {
  readonly isAvailable: boolean;
  readonly api: TApi;                    // No-op if unavailable
  readonly unavailableReason?: string;   // Only if unavailable
}
```

If `isAvailable` is `false`, the API is a **no-op wrapper**—calling methods does nothing but won't throw.

## Errors

### CapabilityNotDeclaredError

Thrown when requesting an undeclared capability.

```typescript
// Metadata declares: ['audio']
getCapability('haptics'); // ❌ Throws CapabilityNotDeclaredError
```

**This is a bug in your game.** Add the capability to metadata.

### CapabilityDeniedError

**This error should never be caught.** If you're catching it, your code is wrong.

Check `isAvailable` instead:

```typescript
// ❌ Wrong
try {
  haptics.api.trigger('success');
} catch (e) {
  if (e instanceof CapabilityDeniedError) { ... }
}

// ✅ Correct
if (haptics.isAvailable) {
  haptics.api.trigger('success');
}
```

## Best Practices

### 1. Always Check Availability

```typescript
// ✅ Good
if (audio.isAvailable) {
  audio.api.playSound('click');
}

// ❌ Bad - assumes availability
audio.api.playSound('click');
```

### 2. Provide Alternatives

```typescript
function confirmAction() {
  if (haptics.isAvailable) {
    haptics.api.trigger('success');
  }
  
  // Always show visual feedback too
  showSuccessAnimation();
}
```

### 3. Declare What You Need

Only declare capabilities you actually use:

```typescript
// ❌ Don't hoard capabilities
capabilities: ['audio', 'haptics', 'sensors', 'animations']

// ✅ Be specific
capabilities: ['audio', 'haptics']
```

## Next Steps

- [[State Management]] - Ephemeral and persistent state
- [[Developer Tooling]] - Testing capabilities locally
- [[API Reference]] - Complete API docs
