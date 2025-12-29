import type { ReactElement } from 'react';
import type { GameEvent } from '@secondsuntech/games-sdk';

interface EventLogEntry {
    readonly event: GameEvent;
    readonly timestamp: number;
}

interface EventInspectorProps {
    events: EventLogEntry[];
    onClear: () => void;
}

export function EventInspector({ events, onClear }: EventInspectorProps): ReactElement {
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Events ({String(events.length)})</h2>
                <button style={styles.clearButton} onClick={onClear}>
                    Clear
                </button>
            </div>
            <div style={styles.list}>
                {events.length === 0 ? (
                    <div style={styles.empty}>No events yet</div>
                ) : (
                    events.map((item, i) => (
                        <div key={i} style={styles.event}>
                            <div style={styles.eventHeader}>
                                <span style={styles.eventType}>{item.event.type}</span>
                                <span style={styles.eventTime}>
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <pre style={styles.eventData}>
                                {JSON.stringify(item.event, null, 2)}
                            </pre>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 600,
        color: '#fff',
    },
    clearButton: {
        padding: '4px 10px',
        borderRadius: 4,
        border: '1px solid #555',
        background: 'transparent',
        color: '#888',
        fontSize: 12,
        cursor: 'pointer',
    },
    list: {
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    empty: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        padding: 24,
    },
    event: {
        background: '#1a1a1a',
        borderRadius: 8,
        padding: 10,
        border: '1px solid #333',
    },
    eventHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    eventType: {
        fontWeight: 600,
        fontSize: 13,
        color: '#4ade80',
    },
    eventTime: {
        fontSize: 11,
        color: '#666',
    },
    eventData: {
        fontSize: 11,
        color: '#aaa',
        margin: 0,
        overflow: 'auto',
        maxHeight: 100,
    },
};
