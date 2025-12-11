import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { getSocket } from '@/lib/socket';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Youtube,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

// YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string | null;
  onVideoEnd?: () => void;
}

// Extract video ID from various YouTube URL formats
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Check if a URL is a YouTube URL
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url) || /^[a-zA-Z0-9_-]{11}$/.test(url);
}

export const YouTubePlayer = ({ videoId, onVideoEnd }: YouTubePlayerProps) => {
  const location = useLocation();
  const { playback, play, pause, seek, isHost } = useSocket();
  const isHostFromState = location.state?.isHost;
  const canControl = isHost || isHostFromState;

  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const lastSyncRef = useRef<number>(0);
  const hostSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time helper
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      return; // Already loaded
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // Initialize player when video ID changes
  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
        videoId,
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0, // Hide YouTube controls, we use our own
          disablekb: 1,
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3, // Hide annotations
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            setDuration(event.target.getDuration());
            event.target.setVolume(volume);
            console.log('[YouTube] Player ready');
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onVideoEnd?.();
            }
          },
          onError: (event) => {
            console.error('[YouTube] Player error:', event.data);
            const errorMessages: Record<number, string> = {
              2: 'Invalid video ID',
              5: 'HTML5 player error',
              100: 'Video not found or private',
              101: 'Video cannot be embedded',
              150: 'Video cannot be embedded',
            };
            toast.error(errorMessages[event.data] || 'YouTube player error');
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Host broadcasts position every 2 seconds
  useEffect(() => {
    if (!canControl || !videoId || !isReady) {
      if (hostSyncIntervalRef.current) {
        clearInterval(hostSyncIntervalRef.current);
        hostSyncIntervalRef.current = null;
      }
      return;
    }

    const socket = getSocket();

    const sendHostSync = () => {
      const player = playerRef.current;
      if (!player || !canControl) return;

      try {
        const currentTime = player.getCurrentTime();
        const playerState = player.getPlayerState();
        const isPlaying = playerState === window.YT.PlayerState.PLAYING;

        socket.emit('hostSync', {
          position: currentTime,
          isPlaying,
          serverTime: Date.now(),
        }, () => {});
      } catch (e) {
        console.error('[YouTube] Error sending sync:', e);
      }
    };

    sendHostSync();
    hostSyncIntervalRef.current = setInterval(sendHostSync, 2000);

    return () => {
      if (hostSyncIntervalRef.current) {
        clearInterval(hostSyncIntervalRef.current);
        hostSyncIntervalRef.current = null;
      }
    };
  }, [canControl, videoId, isReady, playback.isPlaying]);

  // Sync with playback state (for listeners)
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isReady || canControl) return;

    try {
      const playerState = player.getPlayerState();
      const isCurrentlyPlaying = playerState === window.YT.PlayerState.PLAYING;

      // Sync play/pause state
      if (playback.isPlaying && !isCurrentlyPlaying) {
        player.playVideo();
      } else if (!playback.isPlaying && isCurrentlyPlaying) {
        player.pauseVideo();
      }

      // Sync position
      const now = Date.now();
      if (now - lastSyncRef.current > 500) {
        const currentTime = player.getCurrentTime();
        const drift = Math.abs(currentTime - playback.position);

        if (drift > 1) {
          console.log('[YouTube] Syncing position, drift:', drift.toFixed(2));
          player.seekTo(playback.position, true);
        }
        lastSyncRef.current = now;
      }
    } catch (e) {
      console.error('[YouTube] Error syncing:', e);
    }
  }, [playback.isPlaying, playback.position, isReady, canControl]);

  // Update local progress
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player && !isSliderDragging) {
        try {
          setLocalProgress(player.getCurrentTime());
          setDuration(player.getDuration());
        } catch (e) {
          // Player might not be ready
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isReady, isSliderDragging]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (!canControl) {
      toast.error('Only the host can control playback');
      return;
    }

    const player = playerRef.current;
    if (!player || !isReady) return;

    try {
      const playerState = player.getPlayerState();
      if (playerState === window.YT.PlayerState.PLAYING) {
        player.pauseVideo();
        pause();
      } else {
        player.playVideo();
        play();
      }
    } catch (e) {
      console.error('[YouTube] Play/pause error:', e);
    }
  }, [canControl, isReady, play, pause]);

  // Handle seek
  const handleSeek = useCallback((value: number[]) => {
    if (!canControl) {
      toast.error('Only the host can seek');
      return;
    }

    const player = playerRef.current;
    if (!player || !isReady) return;

    const newPosition = value[0];
    setLocalProgress(newPosition);
    setIsSliderDragging(false);

    try {
      player.seekTo(newPosition, true);
      seek(newPosition);
    } catch (e) {
      console.error('[YouTube] Seek error:', e);
    }
  }, [canControl, isReady, seek]);

  // Handle volume
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    const player = playerRef.current;
    if (player && isReady) {
      try {
        player.setVolume(newVolume);
        if (newVolume === 0) {
          player.mute();
        } else {
          player.unMute();
        }
      } catch (e) {
        console.error('[YouTube] Volume error:', e);
      }
    }
  }, [isReady]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player || !isReady) return;

    try {
      if (isMuted) {
        player.unMute();
        player.setVolume(volume || 70);
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error('[YouTube] Mute error:', e);
    }
  }, [isReady, isMuted, volume]);

  if (!videoId) {
    return null;
  }

  return (
    <div className="bg-card rounded-3xl p-6 border border-border">
      {/* Video Container */}
      <div 
        ref={containerRef}
        className={`relative bg-black rounded-xl overflow-hidden mb-6 transition-all duration-300 ${
          isExpanded ? 'aspect-video' : 'aspect-video max-h-64'
        }`}
      >
        <div id={`youtube-player-${videoId}`} className="absolute inset-0" />
        
        {/* YouTube branding overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-lg">
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="text-xs text-white/80">YouTube</span>
        </div>

        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Host-only notice for listeners */}
      {!canControl && (
        <div className="mb-4 glassmorphism p-3 rounded-xl flex items-center gap-3 border border-secondary/30">
          <Lock className="w-4 h-4 text-secondary" />
          <span className="text-sm text-muted-foreground">Only the host can control playback</span>
        </div>
      )}

      {/* Play Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={handlePlayPause}
          size="lg"
          disabled={!isReady}
          className={`w-20 h-20 rounded-full transition-all duration-300 ${
            canControl 
              ? 'bg-red-600 hover:bg-red-700 hover:scale-110' 
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {playback.isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[isSliderDragging ? localProgress : localProgress]}
          onValueChange={(v) => {
            setIsSliderDragging(true);
            setLocalProgress(v[0]);
          }}
          onValueCommit={handleSeek}
          max={duration || 100}
          step={0.1}
          disabled={!canControl || !isReady}
          className={`${canControl && isReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{formatTime(localProgress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-muted-foreground hover:text-foreground"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="cursor-pointer"
        />
        <span className="text-sm text-muted-foreground w-12 text-right">{isMuted ? 0 : volume}%</span>
      </div>
    </div>
  );
};
