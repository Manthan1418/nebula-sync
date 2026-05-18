import { useCallback, useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { getClockOffset } from '../lib/timeSync';
import { saveRoomSession, getRoomSession, clearRoomSession } from '../lib/sessionStorage';
import { toast } from 'sonner';

export interface User {
  socketId: string;
  deviceName: string;
  isHost: boolean;
}

export interface Track {
  id: string;
  title: string;
  url?: string;
  streamUrl?: string;
  duration?: number;
  artistName?: string;
  albumName?: string;
  thumbnail?: string;
  isYouTube?: boolean;
  videoId?: string;
  audioDownloadUrl?: string;
  shareUrl?: string;
  licenseUrl?: string;
  source?: string;
  jamendoId?: string;
}

export interface Room {
  id: string;
  hostId?: string;
  users: User[];
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  isPlaying: boolean;
  isHost: boolean;
  repeatMode?: 'off' | 'all' | 'one';
  shuffleMode?: boolean;
  volume?: number;
  masterTimestamp?: number;
  lastSyncTime?: number;
}

interface RoomAckResponse {
  success?: boolean;
  error?: string;
  room?: Room;
}

interface RoomEventPayload {
  users?: User[];
  room?: Room;
  queue?: Track[];
  history?: Track[];
  track?: Track | null;
  isPlaying?: boolean;
  timestamp?: number;
  serverTime?: number;
  repeatMode?: Room['repeatMode'];
  shuffleMode?: boolean;
  volume?: number;
}

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      // Auto-rejoin room from sessionStorage on reconnect/refresh
      const savedSession = getRoomSession();
      if (savedSession && !room) {
        const { roomId, deviceName, isHost } = savedSession;
        if (isHost) {
          // Cannot recreate room with same code, rejoin as regular user
          socket.emit('joinRoom', { roomId, deviceName }, (res: RoomAckResponse) => {
            if (res.success) {
              setRoom({ ...res.room, isHost: true });
              toast.success('Rejoined your room');
            } else {
              clearRoomSession();
            }
          });
        } else {
          socket.emit('joinRoom', { roomId, deviceName }, (res: RoomAckResponse) => {
            if (res.success) {
              setRoom({ ...res.room, isHost: false });
              toast.success('Rejoined room');
            } else {
              clearRoomSession();
            }
          });
        }
      }
    };
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);
    // Trigger auto-rejoin on initial load if connected
    if (socket.connected) onConnect();
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); };
  }, [socket, room]);

  const createRoom = useCallback((deviceName = 'My Device') => {
    setLoading(true);
    setError(null);
    socket.emit('createRoom', { deviceName }, (res: RoomAckResponse) => {
      setLoading(false);
      if (res.success) {
        setRoom({ ...res.room, isHost: true });
        // Save to sessionStorage for persistence across refreshes
        saveRoomSession({
          roomId: res.room.id,
          deviceName,
          isHost: true,
          roomName: deviceName + "'s Constellation"
        });
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
    socket.emit('joinRoom', { roomId: roomId.toUpperCase(), deviceName }, (res: RoomAckResponse) => {
      setLoading(false);
      if (res.success) {
        setRoom({ ...res.room, isHost: false });
        // Save to sessionStorage for persistence across refreshes
        saveRoomSession({
          roomId: roomId.toUpperCase(),
          deviceName,
          isHost: false,
          roomName: 'Constellation'
        });
        toast.success(`Joined room: ${roomId}`);
      } else {
        setError(res.error);
        toast.error(res.error || 'Failed to join room');
      }
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    socket.emit('leaveRoom', {}, (res: RoomAckResponse) => {
      if (res.success) {
        setRoom(null);
        // Clear sessionStorage when explicitly leaving
        clearRoomSession();
        toast.success('Left room');
      }
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handlers: Record<string, (data: RoomEventPayload) => void> = {
      userJoined: (d) => setRoom(prev => prev ? { ...prev, users: d.users } : null),
      userLeft: (d) => setRoom(prev => prev ? { ...prev, users: d.users } : null),
      roomState: (d) => setRoom(prev => prev ? { ...prev, ...d } : d),
      queueUpdated: (d) => setRoom(prev => prev ? { ...prev, ...d.room } : d.room),
      trackChanged: (d) => {
        setRoom(prev => prev ? { ...prev, ...(d.room || {}), currentTrack: d.track, isPlaying: d.isPlaying ?? true, masterTimestamp: d.timestamp ?? 0, lastSyncTime: Date.now() } : d.room || null);
        toast.info(`Now playing: ${d.track?.title}`);
      },
      playbackUpdate: (d) => setRoom(prev => prev ? { ...prev, ...(d.room || {}), isPlaying: d.isPlaying, masterTimestamp: d.timestamp ?? prev.masterTimestamp, lastSyncTime: Date.now() } : d.room || null),
      syncState: (d) => setRoom(prev => prev ? { ...prev, ...(d.room || {}), currentTrack: d.track || prev.currentTrack, isPlaying: d.isPlaying, masterTimestamp: d.timestamp ?? 0, lastSyncTime: Date.now() } : d.room || null),
      syncBeacon: (d) => setRoom(prev => {
        if (!prev || prev.isHost) return prev;
        
        // Calculate latency-adjusted position
        const now = Date.now();
        const offset = getClockOffset();
        // Time elapsed since the host sent this sync
        const latency = (now - (d.serverTime - offset)) / 1000;
        
        // Adjust position for latency if playing
        let adjustedPos = d.timestamp;
        if (d.isPlaying && latency > 0 && latency < 2) {
          adjustedPos = d.timestamp + latency;
        }
        
        return { 
          ...prev, 
          ...(d.room || {}),
          isPlaying: d.isPlaying, 
          masterTimestamp: adjustedPos, 
          lastSyncTime: now 
        };
      }),
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => { Object.keys(handlers).forEach(event => socket.off(event)); };
  }, [socket]);

  return { room, loading, error, connected, createRoom, joinRoom, leaveRoom };
}
