/**
 * @fileoverview Dev Tooling Entry Point
 * @module @secondsun/games-sdk/dev
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DEV-ONLY EXPORTS
 *
 * These utilities are only for development and testing.
 * They are tree-shaken from production builds.
 *
 * Import via: import { ... } from '@secondsun/games-sdk/dev'
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ─── Dev Harness ─────────────────────────────────────────────────────────────
export {
    createDevHarness,
    type DevHarness,
    type DevHarnessConfig,
} from './harness.js';

// ─── Mock Context ────────────────────────────────────────────────────────────
export {
    createMockContext,
    createMockInitialContext,
    createMockInSessionContext,
    createMockSessionEndedContext,
    type MockContextOptions,
    DEFAULT_ACCESSIBILITY_PREFS,
    MAX_ACCESSIBILITY_PREFS,
    DEFAULT_ORG_CONFIG,
    DEFAULT_PROGRESSION,
    EXPERIENCED_PROGRESSION,
} from './mock-context.js';

// ─── Event Inspector ─────────────────────────────────────────────────────────
export {
    createEventInspector,
    type EventInspector,
    type CapturedEvent,
    type EventFilter,
    type InspectorStats,
} from './event-inspector.js';

// ─── Capability APIs ─────────────────────────────────────────────────────────
export {
    createMockCapabilityApi,
    createNoOpCapabilityApi,
} from './capability-apis.js';
