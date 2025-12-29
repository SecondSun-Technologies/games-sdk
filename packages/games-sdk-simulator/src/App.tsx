import { useState, useCallback, type ReactElement } from 'react';
import type { AccessibilityPrefs, ThemeMode, Capability } from '@secondsuntech/games-sdk';
import type { GameEvent } from '@secondsuntech/games-sdk';
import { DEVICE_PROFILES } from './deviceProfiles';
import { buildRuntime, type RuntimeOverrides } from './runtimeBuilder';
import { ControlPanel } from './components/ControlPanel';
import { DeviceFrame } from './components/DeviceFrame';
import { EventInspector } from './components/EventInspector';

interface EventLogEntry {
    readonly event: GameEvent;
    readonly timestamp: number;
}

export default function App(): ReactElement {
    // Device profile state
    const [profileId, setProfileId] = useState(DEVICE_PROFILES[0].id);
    const profile = DEVICE_PROFILES.find((p) => p.id === profileId) ?? DEVICE_PROFILES[0];

    // Override state
    const [themeMode, setThemeMode] = useState<ThemeMode>(profile.defaults.themeMode);
    const [accessibilityPrefs, setAccessibilityPrefs] = useState<AccessibilityPrefs>(
        profile.defaults.accessibilityPrefs
    );
    const [capabilities, setCapabilities] = useState<Record<Capability, boolean>>(
        profile.defaults.capabilities
    );

    // Event log
    const [events, setEvents] = useState<EventLogEntry[]>([]);

    const handleProfileChange = useCallback((newProfileId: string): void => {
        setProfileId(newProfileId);
        const newProfile = DEVICE_PROFILES.find((p) => p.id === newProfileId);
        if (newProfile) {
            setThemeMode(newProfile.defaults.themeMode);
            setAccessibilityPrefs(newProfile.defaults.accessibilityPrefs);
            setCapabilities(newProfile.defaults.capabilities);
        }
    }, []);

    const handleEvent = useCallback((event: GameEvent): void => {
        setEvents((prev) => [...prev, { event, timestamp: Date.now() }]);
    }, []);

    const clearEvents = useCallback((): void => {
        setEvents([]);
    }, []);

    const overrides: RuntimeOverrides = {
        accessibilityPrefs,
        themeMode,
        capabilities,
    };

    const runtime = buildRuntime(profile, overrides);

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <ControlPanel
                    profiles={DEVICE_PROFILES}
                    currentProfileId={profileId}
                    onProfileChange={handleProfileChange}
                    themeMode={themeMode}
                    onThemeModeChange={setThemeMode}
                    accessibilityPrefs={accessibilityPrefs}
                    onAccessibilityChange={setAccessibilityPrefs}
                    capabilities={capabilities}
                    onCapabilitiesChange={setCapabilities}
                />
            </div>
            <div style={styles.main}>
                <DeviceFrame
                    profile={profile}
                    runtime={runtime}
                    onEvent={handleEvent}
                />
            </div>
            <div style={styles.inspector}>
                <EventInspector events={events} onClear={clearEvents} />
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        height: '100vh',
        background: '#0a0a0a',
    },
    sidebar: {
        width: 300,
        borderRight: '1px solid #333',
        overflow: 'auto',
        padding: 16,
    },
    main: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
    },
    inspector: {
        width: 350,
        borderLeft: '1px solid #333',
        overflow: 'auto',
        padding: 16,
    },
};
