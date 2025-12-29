import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { PlatformRuntime, SessionDriver, RenderHandle } from '@secondsuntech/games-sdk/platform';
import type { GameEvent, SessionId } from '@secondsuntech/games-sdk';
import type { DeviceProfile } from '../deviceProfiles';
import { getLoadedGame } from '../gameLoader';
import { SessionControls } from './SessionControls';

interface DeviceFrameProps {
    profile: DeviceProfile;
    runtime: PlatformRuntime;
    onEvent: (event: GameEvent) => void;
}

interface SimulatorHandle {
    sessionDriver: SessionDriver;
    unmount: () => void;
}

export function DeviceFrame({ profile, runtime, onEvent }: DeviceFrameProps): ReactElement {
    const mountRef = useRef<HTMLDivElement>(null);
    const [sessionActive, setSessionActive] = useState(false);
    const [renderHandle, setRenderHandle] = useState<SimulatorHandle | null>(null);

    const game = getLoadedGame();

    useEffect(() => {
        if (!mountRef.current || !game) {
            return;
        }

        let handle: RenderHandle | null = null;

        const loadRenderer = async (): Promise<void> => {
            try {
                const { renderGame } = await import('@secondsuntech/games-sdk/platform');
                const { createSessionId, createDuration } = await import('@secondsuntech/games-sdk');

                const mountPoint = mountRef.current;
                if (!mountPoint) {
                    return;
                }

                handle = await renderGame(game, mountPoint, runtime, {
                    onEvent,
                    orgConfig: {
                        orgName: 'Simulator',
                        enableCompetitiveFeatures: false,
                    },
                    progression: {
                        currentLevel: 1,
                        sessionsPlayed: 0,
                        totalPlayTimeMs: createDuration(0),
                        completionCount: 0,
                    },
                });

                setRenderHandle({
                    sessionDriver: handle.sessionDriver,
                    unmount: (): void => { handle?.unmount(); },
                });

                // Auto-start session
                const sessionId = createSessionId(`sim-${String(Date.now())}`);
                handle.sessionDriver.startSession(sessionId);
                setSessionActive(true);
            } catch {
                // Error handled silently - simulator continues
            }
        };

        void loadRenderer();

        return (): void => {
            handle?.unmount();
        };
    }, [game, runtime, onEvent]);

    const handleStartSession = (): void => {
        void (async (): Promise<void> => {
            const { createSessionId } = await import('@secondsuntech/games-sdk');
            const sessionId: SessionId = createSessionId(`sim-${String(Date.now())}`);
            renderHandle?.sessionDriver.startSession(sessionId);
            setSessionActive(true);
        })();
    };

    const handleEndSession = (reason: string): void => {
        if (renderHandle?.sessionDriver) {
            // Type assertion needed because reason comes from UI as string
            renderHandle.sessionDriver.endSession(reason as 'completed' | 'user_exit' | 'timeout');
            setSessionActive(false);
        }
    };

    const scale = Math.min(
        600 / profile.viewport.width,
        800 / profile.viewport.height,
        1
    );

    return (
        <div style={styles.outer}>
            <div style={styles.deviceLabel}>{profile.label}</div>
            <div
                style={{
                    ...styles.frame,
                    width: profile.viewport.width * scale,
                    height: profile.viewport.height * scale,
                }}
            >
                <div
                    ref={mountRef}
                    style={{
                        ...styles.viewport,
                        width: profile.viewport.width,
                        height: profile.viewport.height,
                        transform: `scale(${String(scale)})`,
                        transformOrigin: 'top left',
                    }}
                >
                    {!game && (
                        <div style={styles.noGame}>
                            <p>No game loaded</p>
                            <p style={styles.hint}>
                                Load a game via <code>window.simulatorLoadGame(game)</code>
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <SessionControls
                isActive={sessionActive}
                onStart={handleStartSession}
                onEnd={handleEndSession}
            />
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    outer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
    },
    deviceLabel: {
        fontSize: 14,
        color: '#666',
    },
    frame: {
        background: '#000',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '4px solid #333',
    },
    viewport: {
        background: '#fff',
        overflow: 'hidden',
        position: 'relative',
    },
    noGame: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#666',
        textAlign: 'center',
        padding: 32,
    },
    hint: {
        fontSize: 12,
        marginTop: 8,
        color: '#999',
    },
};
