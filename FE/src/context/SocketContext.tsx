import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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
  const [currentPosition, setCurrentPosition] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

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

  // High-precision position update using requestAnimationFrame
  useEffect(() => {
    if (!room) {
      setCurrentPosition(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const baseTimestamp = room.masterTimestamp || 0;
    const syncTime = room.lastSyncTime || Date.now();

    const updatePosition = () => {
      const now = Date.now();
      
      if (room.isPlaying) {
        // Calculate elapsed time since last sync
        const elapsed = (now - syncTime) / 1000;
        const newPosition = baseTimestamp + elapsed;
        
        // Only update state if position changed meaningfully (every ~100ms)
        if (now - lastUpdateRef.current > 100) {
          setCurrentPosition(newPosition);
          lastUpdateRef.current = now;
        }
      } else {
        // When paused, just use the base timestamp
        if (currentPosition !== baseTimestamp) {
          setCurrentPosition(baseTimestamp);
        }
      }
      
      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };

    // Start the animation loop
    updatePosition();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [room?.isPlaying, room?.masterTimestamp, room?.lastSyncTime]);

  // Derive playback state from room
  const playback: PlaybackState = {
    currentTrack: room?.currentTrack || null,
    isPlaying: room?.isPlaying || false,
    position: currentPosition,
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
