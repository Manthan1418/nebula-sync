import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { initializeSocket, closeSocket, getSocket } from '../lib/socket';
import { useRoom, Room, Track } from '../hooks/useRoom';
import { usePlayback } from '../hooks/usePlayback';

interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
}

interface SocketContextType {
  room: Room | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  isHost: boolean;
  playback: PlaybackState;
  createRoom: (deviceName?: string) => void;
  joinRoom: (roomId: string, deviceName?: string) => void;
  leaveRoom: () => void;
  setTrack: (track: any) => void;
  play: (timestamp?: number) => void;
  pause: () => void;
  seek: (timestamp: number) => void;
  sendHeartbeat: () => void;
  sendMessage: (text: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { room, loading, error, connected, createRoom, joinRoom, leaveRoom } = useRoom();
  const { setTrack, play, pause, seek, sendHeartbeat } = usePlayback();
  const [position, setPosition] = useState(0);
  const frameRef = useRef<number | null>(null);
  const lastUpdate = useRef(0);

  useEffect(() => {
    initializeSocket();
    return () => closeSocket();
  }, []);

  const sendMessage = (text: string) => {
    const socket = getSocket();
    socket.emit('chat:send', { text });
  };

  // High-precision position updates
  useEffect(() => {
    if (!room) {
      setPosition(0);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const base = room.masterTimestamp || 0;
    const syncTime = room.lastSyncTime || Date.now();

    const update = () => {
      const now = Date.now();
      if (room.isPlaying) {
        const elapsed = (now - syncTime) / 1000;
        if (now - lastUpdate.current > 100) {
          setPosition(base + elapsed);
          lastUpdate.current = now;
        }
      } else if (position !== base) {
        setPosition(base);
      }
      frameRef.current = requestAnimationFrame(update);
    };

    update();
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [room?.isPlaying, room?.masterTimestamp, room?.lastSyncTime]);

  const playback: PlaybackState = {
    currentTrack: room?.currentTrack || null,
    isPlaying: room?.isPlaying || false,
    position,
  };

  return (
    <SocketContext.Provider value={{ room, loading, error, connected, isHost: room?.isHost || false, playback, createRoom, joinRoom, leaveRoom, setTrack, play, pause, seek, sendHeartbeat, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
