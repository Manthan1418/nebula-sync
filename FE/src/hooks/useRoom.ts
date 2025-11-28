import { useCallback, useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { toast } from 'sonner';

export interface User {
  socketId: string;
  deviceName: string;
  isHost: boolean;
  lastHeartbeat?: number;
}

export interface Track {
  id: string;
  title: string;
  artist?: string;
  url: string;
  duration: number;
}

export interface Room {
  id: string;
  users: User[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isHost: boolean;
  masterTimestamp?: number;
}

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socket = getSocket();

  // Track connection status
  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial state
    setConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  // Create room
  const createRoom = useCallback(
    (deviceName: string = 'My Device') => {
      setLoading(true);
      setError(null);

      socket.emit('createRoom', { deviceName }, (response: any) => {
        setLoading(false);
        if (response.success) {
          setRoom({
            ...response.room,
            isHost: true,
          });
          toast.success(`Room created: ${response.room.id}`);
        } else {
          setError(response.error);
          toast.error(response.error || 'Failed to create room');
        }
      });
    },
    [socket]
  );

  // Join room
  const joinRoom = useCallback(
    (roomId: string, deviceName: string = 'My Device') => {
      setLoading(true);
      setError(null);

      socket.emit('joinRoom', { roomId: roomId.toUpperCase(), deviceName }, (response: any) => {
        setLoading(false);
        if (response.success) {
          setRoom({
            ...response.room,
            isHost: response.room.isHost || false,
          });
          toast.success(`Joined room: ${roomId}`);
        } else {
          setError(response.error);
          toast.error(response.error || 'Failed to join room');
        }
      });
    },
    [socket]
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    socket.emit('leaveRoom', {}, (response: any) => {
      if (response.success) {
        setRoom(null);
        toast.success('Left room');
      }
    });
  }, [socket]);

  // Listen for room events
  useEffect(() => {
    if (!socket) return;

    socket.on('deviceUpdateList', (data: any) => {
      setRoom((prev) => (prev ? { ...prev, users: data.devices } : null));
    });

    socket.on('trackChanged', (data: any) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              currentTrack: data.track,
              isPlaying: data.isPlaying,
              masterTimestamp: data.masterTimestamp,
            }
          : null
      );
      toast.info(`Now playing: ${data.track?.title}`);
    });

    socket.on('playStarted', (data: any) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              isPlaying: true,
              masterTimestamp: data.masterTimestamp,
            }
          : null
      );
    });

    socket.on('pauseStarted', (data: any) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              isPlaying: false,
              masterTimestamp: data.pausedAt,
            }
          : null
      );
    });

    socket.on('seekUpdated', (data: any) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              masterTimestamp: data.masterTimestamp,
            }
          : null
      );
    });

    socket.on('syncBeacon', (data: any) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              isPlaying: data.isPlaying,
              masterTimestamp: data.masterTimestamp,
            }
          : null
      );
    });

    socket.on('hostOnlyAction', (data: any) => {
      toast.error(data.message || 'Only the host can control playback');
    });

    return () => {
      socket.off('deviceUpdateList');
      socket.off('trackChanged');
      socket.off('playStarted');
      socket.off('pauseStarted');
      socket.off('seekUpdated');
      socket.off('syncBeacon');
      socket.off('hostOnlyAction');
    };
  }, [socket]);

  return {
    room,
    loading,
    error,
    connected,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
