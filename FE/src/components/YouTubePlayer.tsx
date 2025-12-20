import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { getSocket } from '@/lib/socket';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Youtube, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string | null;
  onVideoEnd?: () => void;
}

export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})|^([a-zA-Z0-9_-]{11})$/);
  return match?.[1] || match?.[2] || null;
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url) || /^[a-zA-Z0-9_-]{11}$/.test(url);
}

export const YouTubePlayer = ({ videoId, onVideoEnd }: YouTubePlayerProps) => {
  const location = useLocation();
  const { playback, play, pause, seek, isHost } = useSocket();
  const canControl = isHost || (location.state as any)?.isHost;

  // DEBUG FOR YOUTUBE
  useEffect(() => {
    console.log('YouTubePlayer state:', { canControl, isHost, 'location.isHost': (location.state as any)?.isHost, videoId });
  }, [canControl, isHost, videoId]);

  const playerRef = useRef<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const lastSyncRef = useRef(0);
  const lastCommandRef = useRef(0);
  const hostSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => !isFinite(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  // Load YouTube API once
  useEffect(() => {
    if (window.YT?.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Initialize player
  useEffect(() => {
    if (!videoId) return;

    const init = () => {
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(`yt-${videoId}`, {
        videoId,
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: window.location.origin,
          host: 'https://www.youtube.com',
        },
        events: {
          onReady: (e) => { setIsReady(true); setDuration(e.target.getDuration()); e.target.setVolume(volume); },
          onStateChange: (e) => e.data === window.YT.PlayerState.ENDED && onVideoEnd?.(),
          onError: (e) => toast.error({ 2: 'Invalid video', 100: 'Video not found', 101: 'Cannot embed', 150: 'Cannot embed' }[e.data] || 'Player error'),
        },
      });
    };

    window.YT?.Player ? init() : (window.onYouTubeIframeAPIReady = init);
    return () => { playerRef.current?.destroy(); playerRef.current = null; };
  }, [videoId]);

  // Host sync
  useEffect(() => {
    if (!canControl || !videoId || !isReady) {
      hostSyncIntervalRef.current && clearInterval(hostSyncIntervalRef.current);
      return;
    }

    const socket = getSocket();
    const send = () => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const localPlaying = p.getPlayerState() === window.YT.PlayerState.PLAYING;
        // If we recently received a command (e.g. from MusicPlayer controls), rely on the intended state
        // to prevent the sync loop from cancelling the command during latency
        const isGracePeriod = Date.now() - lastCommandRef.current < 2000;
        const reportPlaying = isGracePeriod ? playback.isPlaying : localPlaying;

        socket.emit('hostSync', { position: p.getCurrentTime(), isPlaying: reportPlaying, serverTime: Date.now() }, () => { });
      } catch { }
    };

    send();
    hostSyncIntervalRef.current = setInterval(send, 2000);
    return () => hostSyncIntervalRef.current && clearInterval(hostSyncIntervalRef.current);
  }, [canControl, videoId, isReady, playback.isPlaying]);

  // Listener sync - also handles host playback state for control
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !isReady) return;

    try {
      const state = p.getPlayerState();
      const playing = state === window.YT.PlayerState.PLAYING;

      // Sync play/pause state (Host must also listen because MusicPlayer controls trigger this)
      if (playback.isPlaying && !playing) {
        p.playVideo();
        lastCommandRef.current = Date.now();
      } else if (!playback.isPlaying && playing) {
        p.pauseVideo();
        lastCommandRef.current = Date.now();
      }

      // Sync position (Host must also listen for Seeks from MusicPlayer)
      // Check for significant drift to avoid micro-stuttering during normal playback
      const drift = Math.abs(p.getCurrentTime() - playback.position);
      if (drift > 2) {
        p.seekTo(playback.position, true);
        lastCommandRef.current = Date.now();
      } else if (!canControl && drift > 0.5) {
        // Finer sync for listeners
        p.seekTo(playback.position, true);
      }
    } catch { }
  }, [playback.isPlaying, playback.position, isReady, canControl]);

  // Progress updates
  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (p && !isSliderDragging) {
        try { setLocalProgress(p.getCurrentTime()); setDuration(p.getDuration()); } catch { }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isReady, isSliderDragging]);

  const handlePlayPause = useCallback(() => {
    console.log('YouTubePlayer: handlePlayPause', { canControl, isReady });
    if (!canControl) return toast.error('Only host can control');
    const p = playerRef.current;
    if (!p || !isReady) return;
    try {
      const isPlaying = p.getPlayerState() === window.YT.PlayerState.PLAYING;
      // Rely on server state echo to drive the player via useEffect
      // This matches the fix in MusicPlayer.tsx to prevent race conditions
      if (isPlaying) {
        p.pauseVideo();
        pause();
      } else {
        p.playVideo();
        play();
      }
    } catch (err) {
      console.error('Play/pause error:', err);
    }
  }, [canControl, isReady, play, pause]);

  const handleSeek = useCallback((v: number[]) => {
    if (!canControl) return toast.error('Only host can seek');
    const p = playerRef.current;
    if (!p || !isReady) return;
    const pos = v[0];
    setLocalProgress(pos);
    setIsSliderDragging(false);
    try { p.seekTo(pos, true); seek(pos); } catch { }
  }, [canControl, isReady, seek]);

  const handleVolume = useCallback((v: number[]) => {
    const vol = v[0];
    setVolume(vol);
    setIsMuted(vol === 0);
    const p = playerRef.current;
    if (p && isReady) try { p.setVolume(vol); vol === 0 ? p.mute() : p.unMute(); } catch { }
  }, [isReady]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p || !isReady) return;
    try {
      if (isMuted) { p.unMute(); p.setVolume(volume || 70); setIsMuted(false); }
      else { p.mute(); setIsMuted(true); }
    } catch { }
  }, [isReady, isMuted, volume]);

  if (!videoId) return null;

  return (
    <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
      {/* Video Container */}
      {/* Video Container - Use explicit height instead of aspect-video for safety */}
      <div className={`relative bg-black rounded-lg overflow-hidden mb-3 w-full transition-all ${isExpanded ? 'h-[60vh]' : 'h-48 sm:h-64 lg:h-[400px]'}`}>
        <div id={`yt-${videoId}`} className="w-full h-full" />
        <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white pointer-events-none">
          <Youtube className="w-3 h-3 text-red-500" /> YouTube
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 rounded z-10"
        >
          {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>

      {!canControl && (
        <div className="mb-2 p-2 rounded bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" /> Only host controls
        </div>
      )}

      {/* Play button */}
      <div className="flex justify-center mb-3">
        <button
          onClick={handlePlayPause}
          disabled={!isReady}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${canControl && isReady ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
        >
          {playback.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </div>

      {/* Progress */}
      <div className="mb-2">
        <Slider
          value={[localProgress]}
          onValueChange={(v) => { setIsSliderDragging(true); setLocalProgress(v[0]); }}
          onValueCommit={handleSeek}
          max={duration || 100}
          step={0.1}
          disabled={!canControl || !isReady}
          className={canControl && isReady ? '' : 'opacity-50'}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{formatTime(localProgress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2">
        <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground p-1">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <Slider value={[isMuted ? 0 : volume]} onValueChange={handleVolume} max={100} step={1} className="flex-1" />
        <span className="text-[10px] text-muted-foreground w-7 text-right">{isMuted ? 0 : volume}%</span>
      </div>
    </div>
  );
};
