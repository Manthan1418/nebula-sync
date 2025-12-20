import { useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { toast } from 'sonner';

export interface Track {
  id?: string;
  title: string;
  url: string;
  duration?: number;
}

export function usePlayback() {
  const socket = getSocket();

  const setTrack = useCallback((track: Partial<Track>) => {
    console.log('setTrack called:', track, 'socket connected:', socket.connected);
    socket.emit('setTrack', {
      track: { id: track.id || Date.now().toString(), title: track.title || 'Unknown', url: track.url || '', duration: track.duration || 0 }
    }, (res: any) => { 
      console.log('setTrack response:', res);
      if (!res?.success) toast.error(res?.error || 'Failed to set track'); 
    });
  }, [socket]);

  const play = useCallback((timestamp?: number) => {
    console.log('play called, socket connected:', socket.connected, 'socket id:', socket.id);
    socket.emit('play', { timestamp }, (res: any) => { 
      console.log('play response:', res);
      if (!res?.success) toast.error(res?.error || 'Failed to play'); 
    });
  }, [socket]);

  const pause = useCallback(() => {
    console.log('pause called, socket connected:', socket.connected, 'socket id:', socket.id);
    socket.emit('pause', {}, (res: any) => { 
      console.log('pause response:', res);
      if (!res?.success) toast.error(res?.error || 'Failed to pause'); 
    });
  }, [socket]);

  const seek = useCallback((timestamp: number) => {
    console.log('seek called:', timestamp);
    socket.emit('seek', { timestamp }, (res: any) => { 
      console.log('seek response:', res);
      if (!res?.success) toast.error(res?.error || 'Failed to seek'); 
    });
  }, [socket]);

  const sendHeartbeat = useCallback(() => socket.emit('deviceHeartbeat', {}), [socket]);

  return { setTrack, play, pause, seek, sendHeartbeat };
}
