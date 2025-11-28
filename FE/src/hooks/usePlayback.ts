import { useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { toast } from 'sonner';

export interface Track {
  id?: string;
  title: string;
  artist?: string;
  url: string;
  duration?: number;
}

export function usePlayback() {
  const socket = getSocket();

  const setTrack = useCallback(
    (track: Partial<Track>) => {
      const fullTrack = {
        id: track.id || Date.now().toString(),
        title: track.title || 'Unknown Track',
        artist: track.artist || '',
        url: track.url || '',
        duration: track.duration || 0,
      };
      
      socket.emit('setTrack', { track: fullTrack }, (response: any) => {
        if (!response.success) {
          toast.error(response.error || 'Failed to set track');
        }
      });
    },
    [socket]
  );

  const play = useCallback(
    (timestamp: number = 0) => {
      socket.emit('playRequest', { timestamp }, (response: any) => {
        if (!response.success) {
          toast.error(response.error || 'Failed to play');
        }
      });
    },
    [socket]
  );

  const pause = useCallback(() => {
    socket.emit('pauseRequest', {}, (response: any) => {
      if (!response.success) {
        toast.error(response.error || 'Failed to pause');
      }
    });
  }, [socket]);

  const seek = useCallback(
    (timestamp: number) => {
      socket.emit('seekRequest', { timestamp }, (response: any) => {
        if (!response.success) {
          toast.error(response.error || 'Failed to seek');
        }
      });
    },
    [socket]
  );

  const sendHeartbeat = useCallback(() => {
    socket.emit('deviceHeartbeat', {}, (response: any) => {
      // Heartbeat response received
    });
  }, [socket]);

  return {
    setTrack,
    play,
    pause,
    seek,
    sendHeartbeat,
  };
}
