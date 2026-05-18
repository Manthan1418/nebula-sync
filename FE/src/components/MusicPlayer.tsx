import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useSocket } from '@/context/SocketContext';
import { getSocket } from '@/lib/socket';
import { getServerTime, startAutoSync, stopAutoSync } from '@/lib/timeSync';
import { toast } from 'sonner';
import { JamendoSearch } from './JamendoSearch';
import { TrackQueue } from './TrackQueue';
import { JamendoTrack, formatDuration } from '@/lib/jamendo';
import {
  Pause, Play, Volume2, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Disc3, SignalHigh,
} from 'lucide-react';

export const MusicPlayer = () => {
  const location = useLocation();
  const {
    room,
    playback,
    play,
    pause,
    seek,
    setTrack,
    enqueueTrack,
    removeQueueTrack,
    clearQueue,
    nextTrack,
    previousTrack,
    toggleRepeat,
    toggleShuffle,
    setVolume: syncVolume,
    isHost,
    connected,
  } = useSocket();

  const canControl = isHost || (location.state as any)?.isHost;
  const [localProgress, setLocalProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [volume, setLocalVolume] = useState(playback.volume || 70);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hostSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncRef = useRef(0);
  const playbackRateRef = useRef(1);

  const currentTrack = playback.currentTrack;
  const currentTrackUrl = currentTrack?.streamUrl || currentTrack?.url || '';

  useEffect(() => {
    startAutoSync();
    return () => stopAutoSync();
  }, []);

  useEffect(() => {
    setLocalVolume(playback.volume || 70);
  }, [playback.volume]);

  useEffect(() => {
    if (!canControl || !currentTrack) {
      if (hostSyncIntervalRef.current) {
        clearInterval(hostSyncIntervalRef.current);
        hostSyncIntervalRef.current = null;
      }
      return;
    }

    const socket = getSocket();
    const sendSync = () => {
      const audio = audioRef.current;
      if (!audio || !canControl) return;

      socket.emit('hostSync', {
        position: audio.currentTime,
        isPlaying: !audio.paused,
        serverTime: getServerTime(),
      }, () => undefined);
    };

    sendSync();
    hostSyncIntervalRef.current = setInterval(sendSync, 2000);
    return () => {
      if (hostSyncIntervalRef.current) clearInterval(hostSyncIntervalRef.current);
    };
  }, [canControl, currentTrack]);

  const queueIds = useMemo(() => new Set((playback.queue || []).map((track) => track.id)), [playback.queue]);
  const formatTime = (seconds: number) => formatDuration(seconds);

  const handlePlayPause = () => {
    if (!canControl) return toast.error('Only the host can control playback');
    if (!currentTrack) return toast.error('No track loaded');

    const audio = audioRef.current;
    if (audio) {
      if (!audio.paused) {
        audio.pause();
        pause();
      } else {
        audio.play().catch(() => undefined);
        play();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (!canControl) return;
    const nextPosition = value[0];
    setLocalProgress(nextPosition);
    setIsSliderDragging(false);
    lastSyncRef.current = Date.now() + 1000;
    seek(nextPosition);
    if (audioRef.current) {
      audioRef.current.currentTime = nextPosition;
    }
  };

  const handlePlayNow = (track: JamendoTrack) => {
    if (!canControl) return toast.error('Only the host can load a track into the room');
    setTrack({
      id: track.id,
      title: track.title,
      streamUrl: track.streamUrl,
      url: track.streamUrl,
      duration: track.duration,
      artistName: track.artistName,
      albumName: track.albumName,
      thumbnail: track.thumbnail,
      audioDownloadUrl: track.audioDownloadUrl,
      shareUrl: track.shareUrl,
      licenseUrl: track.licenseUrl,
      source: track.source,
      jamendoId: track.jamendoId,
    });
    toast.success(`Now playing ${track.title}`);
  };

  const handleQueue = (track: JamendoTrack) => {
    enqueueTrack(track);
    toast.success(`Added ${track.title} to the queue`);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrackUrl) return;

    const needsNew = !audio.src || !audio.src.includes(currentTrackUrl);
    if (needsNew) {
      audio.src = currentTrackUrl;
      audio.load();
      audio.oncanplay = () => {
        if (playback.position > 0) audio.currentTime = playback.position;
        if (playback.isPlaying) audio.play().catch(() => undefined);
        audio.oncanplay = null;
      };
      return;
    }

    if (!canControl) {
      if (playback.isPlaying && audio.paused) audio.play().catch(() => undefined);
      else if (!playback.isPlaying && !audio.paused) audio.pause();
    }

    if (!canControl && playback.isPlaying && Date.now() - lastSyncRef.current > 500) {
      const drift = audio.currentTime - playback.position;
      const absDrift = Math.abs(drift);

      if (absDrift > 2) {
        audio.currentTime = playback.position;
        audio.playbackRate = 1;
        playbackRateRef.current = 1;
      } else if (absDrift > 0.3) {
        const rate = drift > 0 ? 0.97 : 1.03;
        if (audio.playbackRate !== rate) {
          audio.playbackRate = rate;
          playbackRateRef.current = rate;
        }
      } else if (absDrift < 0.1 && playbackRateRef.current !== 1) {
        audio.playbackRate = 1;
        playbackRateRef.current = 1;
      }
      lastSyncRef.current = Date.now();
    }
  }, [currentTrackUrl, playback.isPlaying, playback.position, canControl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => !isSliderDragging && setLocalProgress(audio.currentTime);
    const onDuration = () => isFinite(audio.duration) && setDuration(audio.duration);
    const onEnded = () => {
      if (canControl) nextTrack();
    };
    const onError = () => {
      toast.error('Failed to load the current stream');
      if (canControl) nextTrack();
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [canControl, isSliderDragging, nextTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (canControl) syncVolume(volume);
  }, [volume, syncVolume, canControl]);

  return (
    <div className="space-y-4 rounded-[2rem] border border-border/50 bg-gradient-to-br from-card/85 via-card/70 to-background/50 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        onError={() => toast.error('Failed to load audio stream')}
      />

      <div className="border-b border-border/50 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-teal-500/20 ring-1 ring-white/5">
              {currentTrack?.thumbnail ? (
                <img src={currentTrack.thumbnail} alt={currentTrack.title} className="h-full w-full object-cover" />
              ) : (
                <Disc3 className="h-7 w-7 text-emerald-300" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <SignalHigh className="h-3.5 w-3.5 text-emerald-300" />
                {connected ? 'Live room' : 'Reconnecting'}
              </div>
              <h2 className="mt-1 truncate text-2xl font-semibold text-foreground">
                {currentTrack?.title || 'Search GaanaPy to start the room'}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {currentTrack ? `${currentTrack.artistName || 'Unknown artist'}${currentTrack.albumName ? ` · ${currentTrack.albumName}` : ''}` : 'Pick a track from GaanaPy'}
              </p>
            </div>
          </div>

          <div className="rounded-full border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
            GaanaPy streaming is proxied through the server for room sync
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 lg:px-6 lg:pb-6">
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/50 bg-background/45 p-4 lg:p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Button onClick={handlePlayPause} disabled={!connected || !currentTrack} className="h-14 w-14 rounded-full p-0 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/25">
                  {playback.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
                </Button>
                <Button size="sm" variant="secondary" onClick={previousTrack} disabled={!canControl || !playback.history.length} className="rounded-full">
                  <SkipBack className="h-4 w-4" />
                  Prev
                </Button>
                <Button size="sm" variant="secondary" onClick={nextTrack} disabled={!canControl} className="rounded-full">
                  <SkipForward className="h-4 w-4" />
                  Next
                </Button>
                <Button size="sm" variant={playback.repeatMode === 'off' ? 'secondary' : 'default'} onClick={toggleRepeat} disabled={!canControl} className="rounded-full">
                  {playback.repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                  {playback.repeatMode === 'one' ? 'Repeat one' : playback.repeatMode === 'all' ? 'Repeat all' : 'Repeat off'}
                </Button>
                <Button size="sm" variant={playback.shuffleMode ? 'default' : 'secondary'} onClick={toggleShuffle} disabled={!canControl} className="rounded-full">
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </Button>
              </div>

              <div className="space-y-2">
                <Slider
                  value={[localProgress]}
                  onValueChange={(values) => {
                    setIsSliderDragging(true);
                    setLocalProgress(values[0]);
                  }}
                  onValueCommit={handleSeek}
                  max={duration || 100}
                  step={1}
                  disabled={!canControl || !currentTrack}
                />
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>{formatTime(localProgress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/50 bg-background/50 px-4 py-3">
                <Volume2 className="h-5 w-5 text-emerald-300" />
                <Slider value={[volume]} onValueChange={(values) => setLocalVolume(values[0])} max={100} step={1} className="flex-1" />
                <button type="button" onClick={() => setIsMuted((current) => !current)} className="text-xs font-medium text-muted-foreground transition hover:text-foreground">
                  {isMuted ? 'Muted' : `${volume}%`}
                </button>
              </div>
            </div>

            <JamendoSearch canControl={canControl} queueIds={queueIds} onPlayNow={handlePlayNow} onQueue={handleQueue} />
          </div>

          <TrackQueue
            queue={playback.queue}
            history={playback.history}
            repeatMode={playback.repeatMode}
            shuffleMode={playback.shuffleMode}
            canControl={canControl}
            onNext={nextTrack}
            onPrevious={previousTrack}
            onToggleRepeat={toggleRepeat}
            onToggleShuffle={toggleShuffle}
            onRemove={removeQueueTrack}
            onClear={clearQueue}
          />
        </div>
      </div>

      <div className="border-t border-border/50 px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{connected ? 'Synced room playback' : 'Waiting for connection'}</span>
          <span>{currentTrack ? `${formatDuration(currentTrack.duration || 0)} · GaanaPy` : 'Ready for search'}</span>
        </div>
      </div>
    </div>
  );
};
