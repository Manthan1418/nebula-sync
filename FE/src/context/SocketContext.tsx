import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { initializeSocket, closeSocket } from '../lib/socket';
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
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { room, loading, error, connected, createRoom, joinRoom, leaveRoom } = useRoom();
  const { setTrack, play, pause, seek, sendHeartbeat } = usePlayback();

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    return () => {
      closeSocket();
    };
  }, []);

  // Send heartbeat every 30 seconds
  useEffect(() => {
    if (room) {
      const interval = setInterval(() => {
        sendHeartbeat();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [room, sendHeartbeat]);

  // Derive playback state from room
  const playback: PlaybackState = {
    currentTrack: room?.currentTrack || null,
    isPlaying: room?.isPlaying || false,
    position: room?.masterTimestamp || 0,
  };

  return (
    <SocketContext.Provider
      value={{
        room,
        loading,
        error,
        connected,
        isHost: room?.isHost || false,
        playback,
        createRoom,
        joinRoom,
        leaveRoom,
        setTrack,
        play,
        pause,
        seek,
        sendHeartbeat,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
