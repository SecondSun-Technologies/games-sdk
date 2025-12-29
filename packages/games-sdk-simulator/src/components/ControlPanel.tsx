import type { ReactElement } from 'react';
import type { AccessibilityPrefs, ThemeMode, Capability } from '@secondsuntech/games-sdk';
import type { DeviceProfile } from '../deviceProfiles';

interface ControlPanelProps {
    profiles: readonly DeviceProfile[];
    currentProfileId: string;
    onProfileChange: (id: string) => void;
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
    accessibilityPrefs: AccessibilityPrefs;
    onAccessibilityChange: (prefs: AccessibilityPrefs) => void;
    capabilities: Record<Capability, boolean>;
    onCapabilitiesChange: (caps: Record<Capability, boolean>) => void;
}

export function ControlPanel({
    profiles,
    currentProfileId,
    onProfileChange,
    themeMode,
    onThemeModeChange,
    accessibilityPrefs,
    onAccessibilityChange,
    capabilities,
    onCapabilitiesChange,
}: ControlPanelProps): ReactElement {
    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Simulator Controls</h2>

            {/* Device Profile */}
            <Section title="Device">
                <select
                    value={currentProfileId}
                    onChange={(e): void => { onProfileChange(e.target.value); }}
                    style={styles.select}
                >
                    {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.label} ({p.platform})
                        </option>
                    ))}
                </select>
            </Section>

            {/* Theme */}
            <Section title="Theme">
                <ToggleButton
                    options={[
                        { value: 'light', label: '☀️ Light' },
                        { value: 'dark', label: '🌙 Dark' },
                    ]}
                    value={themeMode}
                    onChange={(v): void => { onThemeModeChange(v as ThemeMode); }}
                />
            </Section>

            {/* Accessibility */}
            <Section title="Accessibility">
                <Checkbox
                    label="Reduce Motion"
                    checked={accessibilityPrefs.reduceMotion}
                    onChange={(v): void => { onAccessibilityChange({ ...accessibilityPrefs, reduceMotion: v }); }}
                />
                <Checkbox
                    label="High Contrast"
                    checked={accessibilityPrefs.highContrast}
                    onChange={(v): void => { onAccessibilityChange({ ...accessibilityPrefs, highContrast: v }); }}
                />
                <Checkbox
                    label="Larger Touch Targets"
                    checked={accessibilityPrefs.largerTouchTargets}
                    onChange={(v): void => { onAccessibilityChange({ ...accessibilityPrefs, largerTouchTargets: v }); }}
                />
                <Checkbox
                    label="Screen Reader"
                    checked={accessibilityPrefs.screenReaderActive}
                    onChange={(v): void => { onAccessibilityChange({ ...accessibilityPrefs, screenReaderActive: v }); }}
                />
                <div style={styles.sliderRow}>
                    <span>Font Scale: {accessibilityPrefs.fontScale.toFixed(1)}x</span>
                    <input
                        type="range"
                        min="0.8"
                        max="2.0"
                        step="0.1"
                        value={accessibilityPrefs.fontScale}
                        onChange={(e): void => {
                            onAccessibilityChange({ ...accessibilityPrefs, fontScale: parseFloat(e.target.value) });
                        }}
                        style={styles.slider}
                    />
                </div>
            </Section>

            {/* Capabilities */}
            <Section title="Capabilities">
                {(Object.keys(capabilities) as Capability[]).map((cap) => (
                    <Checkbox
                        key={cap}
                        label={cap.charAt(0).toUpperCase() + cap.slice(1)}
                        checked={capabilities[cap]}
                        onChange={(v): void => { onCapabilitiesChange({ ...capabilities, [cap]: v }); }}
                    />
                ))}
            </Section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): ReactElement {
    return (
        <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{title}</h3>
            {children}
        </div>
    );
}

function Checkbox({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}): ReactElement {
    return (
        <label style={styles.checkbox}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e): void => { onChange(e.target.checked); }}
            />
            <span>{label}</span>
        </label>
    );
}

function ToggleButton({
    options,
    value,
    onChange,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
}): ReactElement {
    return (
        <div style={styles.toggleGroup}>
            {options.map((opt) => (
                <button
                    key={opt.value}
                    style={{
                        ...styles.toggleButton,
                        ...(value === opt.value ? styles.toggleActive : {}),
                    }}
                    onClick={(): void => { onChange(opt.value); }}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 600,
        color: '#fff',
        marginBottom: 8,
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 500,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    select: {
        width: '100%',
        padding: 8,
        borderRadius: 6,
        border: '1px solid #333',
        background: '#222',
        color: '#fff',
        fontSize: 14,
    },
    checkbox: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 14,
        color: '#ccc',
        cursor: 'pointer',
    },
    sliderRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontSize: 14,
        color: '#ccc',
    },
    slider: {
        width: '100%',
    },
    toggleGroup: {
        display: 'flex',
        gap: 4,
    },
    toggleButton: {
        flex: 1,
        padding: '8px 12px',
        border: '1px solid #333',
        borderRadius: 6,
        background: '#222',
        color: '#888',
        fontSize: 13,
        cursor: 'pointer',
    },
    toggleActive: {
        background: '#333',
        color: '#fff',
        borderColor: '#555',
    },
};
