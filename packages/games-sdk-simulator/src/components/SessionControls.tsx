import type { ReactElement } from 'react';

interface SessionControlsProps {
    isActive: boolean;
    onStart: () => void;
    onEnd: (reason: string) => void;
}

export function SessionControls({ isActive, onStart, onEnd }: SessionControlsProps): ReactElement {
    const handleComplete = (): void => { onEnd('completed'); };
    const handleExit = (): void => { onEnd('user_exit'); };

    return (
        <div style={styles.container}>
            {!isActive ? (
                <button style={styles.button} onClick={onStart}>
                    ▶️ Start Session
                </button>
            ) : (
                <div style={styles.group}>
                    <span style={styles.active}>🟢 Session Active</span>
                    <button style={styles.endButton} onClick={handleComplete}>
                        ✓ Complete
                    </button>
                    <button style={styles.endButton} onClick={handleExit}>
                        ✕ Exit
                    </button>
                </div>
            )}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        justifyContent: 'center',
    },
    button: {
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        background: '#2563eb',
        color: '#fff',
        fontSize: 14,
        cursor: 'pointer',
    },
    group: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    active: {
        fontSize: 14,
        color: '#4ade80',
    },
    endButton: {
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid #666',
        background: 'transparent',
        color: '#ccc',
        fontSize: 13,
        cursor: 'pointer',
    },
};
