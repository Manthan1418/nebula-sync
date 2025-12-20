import { useCallback, useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { getClockOffset } from '../lib/timeSync';
import { toast } from 'sonner';

export interface User {
  socketId: string;
  deviceName: string;
  isHost: boolean;
}

export interface Track {
  id: string;
  title: string;
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
  lastSyncTime?: number;
}

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); };
  }, [socket]);

  const createRoom = useCallback((deviceName = 'My Device') => {
    setLoading(true);
    setError(null);
    socket.emit('createRoom', { deviceName }, (res: any) => {
      setLoading(false);
      if (res.success) {
        setRoom({ ...res.room, isHost: true });
        toast.success(`Room created: ${res.room.id}`);
      } else {
        setError(res.error);
        toast.error(res.error || 'Failed to create room');
      }
    });
  }, [socket]);

  const joinRoom = useCallback((roomId: string, deviceName = 'My Device') => {
    setLoading(true);
    setError(null);
    socket.emit('joinRoom', { roomId: roomId.toUpperCase(), deviceName }, (res: any) => {
      setLoading(false);
      if (res.success) {
        setRoom({ ...res.room, isHost: false });
        toast.success(`Joined room: ${roomId}`);
      } else {
        setError(res.error);
        toast.error(res.error || 'Failed to join room');
      }
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    socket.emit('leaveRoom', {}, (res: any) => {
      if (res.success) { setRoom(null); toast.success('Left room'); }
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handlers: Record<string, (data: any) => void> = {
      userJoined: (d) => setRoom(prev => prev ? { ...prev, users: d.users } : null),
      userLeft: (d) => setRoom(prev => prev ? { ...prev, users: d.users } : null),
      trackChanged: (d) => {
        setRoom(prev => prev ? { ...prev, currentTrack: d.track, isPlaying: d.isPlaying ?? true, masterTimestamp: d.timestamp ?? 0, lastSyncTime: Date.now() } : null);
        toast.info(`Now playing: ${d.track?.title}`);
      },
      playbackUpdate: (d) => setRoom(prev => prev ? { ...prev, isPlaying: d.isPlaying, masterTimestamp: d.timestamp ?? prev.masterTimestamp, lastSyncTime: Date.now() } : null),
      syncState: (d) => setRoom(prev => prev ? { ...prev, currentTrack: d.track || prev.currentTrack, isPlaying: d.isPlaying, masterTimestamp: d.timestamp ?? 0, lastSyncTime: Date.now() } : null),
      syncBeacon: (d) => setRoom(prev => {
        if (!prev || prev.isHost) return prev;
        const offset = getClockOffset();
        const elapsed = (Date.now() - (d.serverTime - offset)) / 1000;
        const adjusted = d.isPlaying && elapsed > 0 && elapsed < 1 ? d.timestamp + elapsed : d.timestamp;
        return { ...prev, isPlaying: d.isPlaying, masterTimestamp: adjusted, lastSyncTime: Date.now() };
      }),
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => { Object.keys(handlers).forEach(event => socket.off(event)); };
  }, [socket]);

  return { room, loading, error, connected, createRoom, joinRoom, leaveRoom };
}
