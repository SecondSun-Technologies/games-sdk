# Core Concepts

Understanding the philosophy behind the Games SDK is essential for building effective games.

## The Fundamental Model

```
┌─────────────────────────────────────────────────────────┐
│                      PLATFORM                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  • Session management                            │   │
│  │  • Score calculation                             │   │
│  │  • Rewards and progression                       │   │
│  │  • Analytics and insights                        │   │
│  │  • User data and persistence                     │   │
│  └─────────────────────────────────────────────────┘   │
│                         ▲                               │
│                         │ Events (facts)                │
│                         │                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │                     GAME                         │   │
│  │  • Render UI                                     │   │
│  │  • Handle user input                             │   │
│  │  • Emit observations                             │   │
│  │  • Request capabilities                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Games are Unprivileged

Games have **no direct access** to:
- User data
- Persistent storage
- Network requests
- Scoring algorithms
- Reward systems

Everything goes through the platform.

### 2. Games Emit Facts, Not Decisions

**Wrong approach:**
```typescript
// ❌ DON'T DO THIS
emit({ type: 'USER_IMPROVED', improvement: 15 });
emit({ type: 'AWARD_POINTS', points: 100 });
emit({ type: 'DIFFICULTY_WAS_TOO_HARD' });
```

**Correct approach:**
```typescript
// ✅ DO THIS
emit({
  type: 'PERFORMANCE_REPORTED',
  accuracy: 0.85,
  reactionTimeMs: 342,
  errorCount: 3,
});
```

The platform decides what the observations mean.

### 3. Platform Owns Session Lifecycle

```typescript
// The platform CREATES sessions
// Games ACKNOWLEDGE them

if (context.state === 'IN_SESSION') {
  emit({
    type: 'SESSION_STARTED',
    sessionId: context.sessionId,
  });
}
```

Games cannot start or end sessions—they can only report what happened during them.

### 4. Capabilities are Explicit

```typescript
// Must be declared in metadata
metadata: {
  capabilities: ['audio', 'haptics'],
}

// Then requested at runtime
const audio = getCapability('audio');

// AND may still be denied
if (!audio.isAvailable) {
  // Handle gracefully
}
```

### 5. Graceful Degradation is Required

Capabilities can be denied for many reasons:
- User disabled the feature
- Device doesn't support it
- Platform is in "quiet mode"
- Battery saver is active

Your game **must** handle all these cases.

## The Event Contract

The `emit()` function has a strict contract:

| Property | Guarantee |
|----------|-----------|
| Returns | `void` (never Promise) |
| Throws | Never |
| Blocks | Never |
| Confirms | Never |

```typescript
emit(event); // Fire and forget
// Don't await, don't check, just move on
```

## Validation Philosophy

| Environment | Invalid Event | Out-of-Range Value |
|-------------|---------------|-------------------|
| Development | Console error + drop | Console warn + clamp |
| Production | Silent drop | Silent clamp |

In development, the SDK is **loud** so you catch bugs early.
In production, the SDK is **silent** so users aren't affected.

## Trust Model

```
┌─────────────┐         ┌─────────────┐
│    Game     │ ──────▶ │   SDK       │
│  (untrusted)│         │ (boundary)  │
└─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │  Platform   │
                        │  (trusted)  │
                        └─────────────┘
```

The SDK treats game code as **untrusted input**:
- All events are validated at the boundary
- Invalid data is clamped or dropped
- Errors never propagate to the platform

## Next Steps

- [[Type System]] - Branded types and validation
- [[Event System]] - Complete event reference
- [[Game Context]] - Lifecycle states
