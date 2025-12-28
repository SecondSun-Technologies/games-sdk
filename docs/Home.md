# SecondSun Games SDK

Welcome to the official documentation for the **@secondsuntech/games-sdk**.

## What is this SDK?

The Games SDK is the foundation for building cognitive wellness games on the SecondSun platform. Games built with this SDK are:

- **Unprivileged** - No direct data access, no persistence control
- **Stateless** - Platform manages all authoritative state
- **Observational** - Games emit facts, platform makes decisions

## Quick Navigation

### Getting Started
- [[Getting Started]] - Installation and your first game
- [[Core Concepts]] - Philosophy and architecture

### Reference
- [[Type System]] - Branded types and validation
- [[Event System]] - Events, validation, emission
- [[Capabilities]] - Platform feature access
- [[State Management]] - Ephemeral and persistent state
- [[Game Context]] - Lifecycle states

### Development
- [[Developer Tooling]] - Dev harness and testing
- [[API Reference]] - Complete API documentation
- [[Best Practices]] - Guidelines and patterns
- [[FAQ]] - Common questions

## Core Philosophy

```
Games do not log conclusions—they log observations.

NOT: "user improved", "this was hard", "award points"
BUT: what happened, when it happened, under what conditions, how long it took
```

## Installation

```bash
npm install @secondsuntech/games-sdk
```

## Example

```typescript
import { createGame } from '@secondsuntech/games-sdk';

export const game = createGame({
  metadata: {
    id: 'com.example.my-game',
    name: 'My Game',
    version: '1.0.0',
    categories: ['memory'],
    recommendedSessionDurationMs: 300000,
    capabilities: [],
    stateSchemaVersion: 1,
  },
  capabilities: [],
  render: MyGameComponent,
});
```

## Links

- [GitHub Repository](https://github.com/SecondSun-Technologies/games-sdk)
- [Issue Tracker](https://github.com/SecondSun-Technologies/games-sdk/issues)
- [SecondSun Website](https://secondsun.tech)
