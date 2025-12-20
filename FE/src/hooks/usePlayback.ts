import { useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { toast } from 'sonner';

export interface Track {
  id?: string;
  title: string;
  url: string;
  duration?: number;
  isYouTube?: boolean;
  videoId?: string;
}

export function usePlayback() {
  const socket = getSocket();

  const setTrack = useCallback((track: Partial<Track>) => {
    socket.emit('setTrack', {
      track: {
        id: track.id || Date.now().toString(),
        title: track.title || 'Unknown',
        url: track.url || '',
        duration: track.duration || 0,
        isYouTube: track.isYouTube,
        videoId: track.videoId
      }
    }, (res: any) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to set track';
        toast.error(err);
        if (err === 'Not in room' || err === 'Room not found') window.location.href = '/';
        if (err === 'Not host') window.location.reload();
      }
    });
  }, [socket]);

  const play = useCallback((timestamp?: number) => {
    socket.emit('play', { timestamp }, (res: any) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to play';
        toast.error(err);
        if (err === 'Not in room' || err === 'Room not found') window.location.href = '/';
        if (err === 'Not host') window.location.reload();
      }
    });
  }, [socket]);

  const pause = useCallback(() => {
    socket.emit('pause', {}, (res: any) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to pause';
        toast.error(err);
        if (err === 'Not in room' || err === 'Room not found') window.location.href = '/';
        if (err === 'Not host') window.location.reload();
      }
    });
  }, [socket]);

  const seek = useCallback((timestamp: number) => {
    socket.emit('seek', { timestamp }, (res: any) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to seek';
        toast.error(err);
        if (err === 'Not in room' || err === 'Room not found') window.location.href = '/';
        if (err === 'Not host') window.location.reload();
      }
    });
  }, [socket]);

  const sendHeartbeat = useCallback(() => socket.emit('deviceHeartbeat', {}), [socket]);

  return { setTrack, play, pause, seek, sendHeartbeat };
}
