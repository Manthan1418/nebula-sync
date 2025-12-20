import { useSocket } from '@/context/SocketContext';
import { useState, useEffect } from 'react';

export const DebugPanel = () => {
    const { room, connected, playback, isHost } = useSocket();
    const [lastEvent, setLastEvent] = useState<string>('');

    useEffect(() => {
        // Hook into window for console logging if needed
        (window as any).__debug_socket = { room, connected, playback };
    }, [room, connected, playback]);

    if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug')) return null;

    return (
        <div className="fixed bottom-4 left-4 p-4 bg-black/80 text-green-400 font-mono text-xs rounded border border-green-500 z-50 pointer-events-none opacity-70">
            <h3 className="font-bold border-b border-green-500 mb-2">Debug Info</h3>
            <div>Connected: {connected ? 'YES' : 'NO'}</div>
            <div>Room ID: {room?.id || 'N/A'}</div>
            <div>Is Host: {isHost ? 'YES' : 'NO'}</div>
            <div>Playing: {playback.isPlaying ? 'TRUE' : 'FALSE'}</div>
            <div>Track: {playback.currentTrack?.title || 'None'}</div>
            <div>Position: {playback.position.toFixed(2)}</div>
        </div>
    );
};
