import { useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { toast } from 'sonner';
import { JamendoTrack } from '@/lib/jamendo';

export interface Track {
  id?: string;
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

interface SocketAckResponse {
  success?: boolean;
  error?: string;
}

export function usePlayback() {
  const socket = getSocket();

  const setTrack = useCallback((track: Partial<Track>) => {
    socket.emit('setTrack', {
      track: {
        id: track.id || Date.now().toString(),
        title: track.title || 'Unknown',
        url: track.streamUrl || track.url || '',
        streamUrl: track.streamUrl || track.url || '',
        duration: track.duration || 0,
        artistName: track.artistName,
        albumName: track.albumName,
        thumbnail: track.thumbnail,
        isYouTube: track.isYouTube,
        videoId: track.videoId,
        audioDownloadUrl: track.audioDownloadUrl,
        shareUrl: track.shareUrl,
        licenseUrl: track.licenseUrl,
        source: track.source,
        jamendoId: track.jamendoId,
      }
    }, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to set track';
        toast.error(err);
        if (err === 'Not in room' || err === 'Room not found') window.location.href = '/';
        if (err === 'Not host') window.location.reload();
      }
    });
  }, [socket]);

  const enqueueTrack = useCallback((track: JamendoTrack) => {
    socket.emit('queue:add', { track }, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to add track to queue';
        toast.error(err);
      }
    });
  }, [socket]);

  const removeQueueTrack = useCallback((trackId: string) => {
    socket.emit('queue:remove', { trackId }, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to remove queue item';
        toast.error(err);
      }
    });
  }, [socket]);

  const clearQueue = useCallback(() => {
    socket.emit('queue:clear', {}, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to clear queue';
        toast.error(err);
      }
    });
  }, [socket]);

  const nextTrack = useCallback(() => {
    socket.emit('track:next', {}, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to skip track';
        toast.error(err);
      }
    });
  }, [socket]);

  const previousTrack = useCallback(() => {
    socket.emit('track:previous', {}, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to go to previous track';
        toast.error(err);
      }
    });
  }, [socket]);

  const toggleRepeat = useCallback(() => {
    socket.emit('room:repeat', {}, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to update repeat mode';
        toast.error(err);
      }
    });
  }, [socket]);

  const toggleShuffle = useCallback(() => {
    socket.emit('room:shuffle', {}, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to update shuffle mode';
        toast.error(err);
      }
    });
  }, [socket]);

  const setVolume = useCallback((volume: number) => {
    socket.emit('room:volume', { volume }, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to update volume';
        toast.error(err);
      }
    });
  }, [socket]);

  const play = useCallback((timestamp?: number) => {
    socket.emit('play', { timestamp }, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to play';
        toast.error(err);
        if (err === 'Not in room' || err === 'Room not found') window.location.href = '/';
        if (err === 'Not host') window.location.reload();
      }
    });
  }, [socket]);

  const pause = useCallback(() => {
    socket.emit('pause', {}, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to pause';
        toast.error(err);
        if (err === 'Not in room' || err === 'Room not found') window.location.href = '/';
        if (err === 'Not host') window.location.reload();
      }
    });
  }, [socket]);

  const seek = useCallback((timestamp: number) => {
    socket.emit('seek', { timestamp }, (res: SocketAckResponse) => {
      if (!res?.success) {
        const err = res?.error || 'Failed to seek';
        toast.error(err);
        if (err === 'Not in room' || err === 'Room not found') window.location.href = '/';
        if (err === 'Not host') window.location.reload();
      }
    });
  }, [socket]);

  const sendHeartbeat = useCallback(() => socket.emit('deviceHeartbeat', {}), [socket]);

  return { setTrack, enqueueTrack, removeQueueTrack, clearQueue, nextTrack, previousTrack, toggleRepeat, toggleShuffle, setVolume, play, pause, seek, sendHeartbeat };
}
