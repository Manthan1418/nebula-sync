import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { getSocket } from '@/lib/socket';
import { Slider } from './ui/slider';
import { Volume2, VolumeX, Maximize2, Minimize2, Youtube, Lock } from 'lucide-react';
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

  const playerRef = useRef<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(!canControl); // Non-host may need interaction for autoplay
  const lastSyncRef = useRef(0);
  const lastCommandRef = useRef(0);
  // Flag to prevent sync loop - when we trigger a command locally, ignore incoming sync for a bit
  const ignoreNextSyncRef = useRef(false);
  const hostSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => !isFinite(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  // Load YouTube API once
  useEffect(() => {
    if (window.YT?.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Initialize player - show controls only for host
  useEffect(() => {
    if (!videoId) return;

    const init = () => {
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(`yt-${videoId}`, {
        videoId,
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1, // Enable autoplay for all users to allow sync
          // Only show controls for host - listeners should not be able to control
          controls: canControl ? 1 : 0,
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          disablekb: canControl ? 0 : 1, // Disable keyboard controls for non-hosts
          origin: window.location.origin,
          mute: canControl ? 0 : 0, // Don't mute - let users hear audio
        },
        events: {
          onReady: (e) => { 
            setIsReady(true); 
            setDuration(e.target.getDuration()); 
            e.target.setVolume(volume);
            
            // For non-host, request latest sync state and apply immediately
            if (!canControl) {
              const socket = getSocket();
              // Request current state from server
              socket.emit('requestSync', {}, (res: any) => {
                if (res?.success && res.track) {
                  const currentTime = res.timestamp || 0;
                  if (currentTime > 0) {
                    e.target.seekTo(currentTime, true);
                  }
                  // Force play if server says it's playing
                  if (res.isPlaying) {
                    setTimeout(() => {
                      const state = e.target.getPlayerState();
                      // Only try to play if not already playing or buffering
                      if (state !== window.YT.PlayerState.PLAYING && 
                          state !== window.YT.PlayerState.BUFFERING) {
                        e.target.playVideo();
                      }
                    }, 200);
                  } else {
                    e.target.pauseVideo();
                  }
                }
              });
            }
          },
          onStateChange: (e) => {
            // Clear interaction requirement once playback starts successfully
            if (!canControl && e.data === window.YT.PlayerState.PLAYING) {
              setNeedsInteraction(false);
            }
            
            // Sync state changes from native controls to our socket state
            // Only host can emit these - non-hosts will have controls disabled
            if (canControl) {
              const isPlaying = e.data === window.YT.PlayerState.PLAYING;
              const isPaused = e.data === window.YT.PlayerState.PAUSED;
              
              // Only emit if state actually changed to prevent loops
              if (isPlaying && !playback.isPlaying) {
                ignoreNextSyncRef.current = true;
                play();
                setTimeout(() => { ignoreNextSyncRef.current = false; }, 1000);
              } else if (isPaused && playback.isPlaying) {
                ignoreNextSyncRef.current = true;
                pause();
                setTimeout(() => { ignoreNextSyncRef.current = false; }, 1000);
              }
            }
            if (e.data === window.YT.PlayerState.ENDED) onVideoEnd?.();
          },
          onError: (e) => {
            toast.error({ 2: 'Invalid video', 100: 'Video not found', 101: 'Cannot embed', 150: 'Cannot embed' }[e.data] || 'Player error');
          },
        },
      });
    };

    window.YT?.Player ? init() : (window.onYouTubeIframeAPIReady = init);
    return () => { playerRef.current?.destroy(); playerRef.current = null; };
    // Only depend on videoId and canControl - other values are read from current state/refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, canControl]);

  // Host sync - send position to server more frequently
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
        const state = p.getPlayerState();
        const localPlaying = state === window.YT.PlayerState.PLAYING;
        const currentTime = p.getCurrentTime();
        
        socket.emit('hostSync', { 
          position: currentTime, 
          isPlaying: localPlaying, 
          serverTime: Date.now() 
        }, () => { });
      } catch { }
    };

    send();
    // Sync more frequently for smoother experience
    hostSyncIntervalRef.current = setInterval(send, 1000);
    return () => hostSyncIntervalRef.current && clearInterval(hostSyncIntervalRef.current);
  }, [canControl, videoId, isReady]);

  // Listener sync - continuously sync with host's position
  // This runs on an interval for smooth, real-time sync
  useEffect(() => {
    if (canControl || !isReady) return;

    const syncInterval = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;

      try {
        const state = p.getPlayerState();
        const isBuffering = state === window.YT.PlayerState.BUFFERING;
        const isUnstarted = state === window.YT.PlayerState.UNSTARTED;
        const playing = state === window.YT.PlayerState.PLAYING;
        const paused = state === window.YT.PlayerState.PAUSED;
        const currentTime = p.getCurrentTime();
        
        // Debug logging (remove in production)
        if (playback.isPlaying && !playing && !isBuffering) {
          console.log('[YT Sync] Should be playing but not. State:', state, 'Position:', currentTime, 'Expected:', playback.position);
        }

        // Sync play/pause state - force play if should be playing
        if (playback.isPlaying && !playing && !isBuffering) {
          // Try to play - may need user interaction on first play
          try {
            p.playVideo();
            // Check multiple times if play succeeded
            let checkCount = 0;
            const checkPlayback = () => {
              checkCount++;
              const newState = p.getPlayerState();
              if (newState === window.YT.PlayerState.PLAYING) {
                // Success! Clear any interaction flag
                setNeedsInteraction(false);
              } else if (checkCount < 3 && newState !== window.YT.PlayerState.BUFFERING) {
                // Try again
                p.playVideo();
                setTimeout(checkPlayback, 500);
              } else if (checkCount >= 3 && newState !== window.YT.PlayerState.PLAYING && 
                         newState !== window.YT.PlayerState.BUFFERING) {
                // Failed after retries - need user interaction
                setNeedsInteraction(true);
              }
            };
            setTimeout(checkPlayback, 500);
          } catch (err) {
            console.error('Failed to play:', err);
            setNeedsInteraction(true);
          }
        } else if (!playback.isPlaying && playing) {
          p.pauseVideo();
        }

        // Sync position if should be playing (even if currently paused/unstarted)
        if (playback.isPlaying && !isBuffering) {
          const drift = currentTime - playback.position;
          const absDrift = Math.abs(drift);

          if (absDrift > 2.5) {
            // Large drift - hard seek and force play
            p.seekTo(playback.position, true);
            if (!playing && !isUnstarted) {
              setTimeout(() => p.playVideo(), 100);
            }
          } else if (absDrift > 0.8) {
            // Moderate drift - soft seek
            p.seekTo(playback.position, true);
          }
        }
      } catch (err) {
        console.error('Sync error:', err);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(syncInterval);
  }, [canControl, isReady, playback.isPlaying, playback.position]);

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
      <div className={`relative bg-black rounded-lg overflow-hidden mb-3 w-full transition-all ${isExpanded ? 'h-[60vh]' : 'h-48 sm:h-64 lg:h-[400px]'}`}>
        <div id={`yt-${videoId}`} className="w-full h-full" />
        
        {/* Click to enable audio overlay for non-hosts needing interaction */}
        {!canControl && needsInteraction && playback.isPlaying && (
          <div 
            className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex items-center justify-center cursor-pointer animate-pulse"
            onClick={() => {
              const p = playerRef.current;
              if (p && isReady) {
                try {
                  // Unmute first in case that's the issue
                  p.unMute();
                  p.setVolume(volume || 70);
                  
                  // Try to play with retry logic
                  const attemptPlay = (retries = 3) => {
                    p.playVideo();
                    setTimeout(() => {
                      const state = p.getPlayerState();
                      if (state === window.YT.PlayerState.PLAYING) {
                        setNeedsInteraction(false);
                        toast.success('🎵 Audio enabled! Now syncing with host.');
                      } else if (retries > 0) {
                        attemptPlay(retries - 1);
                      } else {
                        toast.error('Could not start playback. Try clicking again.');
                      }
                    }, 300);
                  };
                  
                  attemptPlay();
                } catch (err) {
                  console.error('Failed to enable playback:', err);
                  toast.error('Failed to start playback. Please try again.');
                }
              }
            }}
          >
            <div className="text-center px-6 py-8 bg-black/60 rounded-2xl border-2 border-violet-500/50">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center animate-bounce">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Click to Enable Audio</h3>
              <p className="text-gray-300 text-sm mb-1">Your browser requires interaction to play audio</p>
              <p className="text-violet-400 text-xs">Click anywhere to sync with the host</p>
            </div>
          </div>
        )}
        
        {/* Blocking overlay for non-hosts - prevents clicking on iframe to control playback */}
        {!canControl && !needsInteraction && (
          <div 
            className="absolute inset-0 z-10 cursor-not-allowed" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.error('Only the host can control playback');
            }}
          />
        )}
        
        <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white pointer-events-none z-20">
          <Youtube className="w-3 h-3 text-red-500" /> YouTube
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 rounded z-20"
        >
          {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>

      {/* Status info */}
      {!canControl && (
        <div className="mb-2 p-2 rounded bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" /> Only host can control playback - your video syncs automatically with host
        </div>
      )}

      {canControl && (
        <p className="text-xs text-muted-foreground text-center mb-2">
          Use YouTube controls above to play/pause - listeners sync automatically
        </p>
      )}

      {/* Progress display (read-only for non-host, functional for host) */}
      <div className="mb-2">
        <Slider
          value={[localProgress]}
          onValueChange={(v) => { if (canControl) { setIsSliderDragging(true); setLocalProgress(v[0]); } }}
          onValueCommit={(v) => { if (canControl) handleSeek(v); }}
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

      {/* Volume control */}
      <div className="flex items-center gap-2">
        <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground p-1">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <Slider value={[isMuted ? 0 : volume]} onValueChange={handleVolume} max={100} step={1} className="flex-1" />
        <span className="text-[10px] text-muted-foreground w-7 text-right">{isMuted ? 0 : volume}%</span>
      </div>

      {/* Sync status */}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
        <span className="text-[10px] text-muted-foreground">
          {isReady ? (playback.isPlaying ? 'Playing' : 'Paused') : 'Loading...'}
        </span>
      </div>
    </div>
  );
};
