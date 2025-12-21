import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Play, Pause, Volume2, Music, Lock, Upload, FileAudio, X, Youtube } from 'lucide-react';
import { Slider } from './ui/slider';
import { useSocket } from '@/context/SocketContext';
import { getSocket } from '@/lib/socket';
import { getServerTime, startAutoSync, stopAutoSync } from '@/lib/timeSync';
import { YouTubePlayer, isYouTubeUrl, extractYouTubeVideoId } from './YouTubePlayer';
import { toast } from 'sonner';

export const MusicPlayer = () => {
  const location = useLocation();
  const { playback, play, pause, seek, setTrack, isHost, connected } = useSocket();
  const canControl = isHost || (location.state as any)?.isHost;

  const [url, setUrl] = useState('');
  const [volume, setVolume] = useState(70);
  const [localProgress, setLocalProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSyncRef = useRef(0);
  const hostSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackRateRef = useRef(1.0);

  const currentTrackUrl = playback.currentTrack?.url || '';
  // Prefer server-provided metadata, fall back to URL check
  const isYouTube = playback.currentTrack?.isYouTube ?? isYouTubeUrl(currentTrackUrl);
  const youtubeVideoId = playback.currentTrack?.videoId || (isYouTube ? extractYouTubeVideoId(currentTrackUrl) : null);

  useEffect(() => {
    startAutoSync();
    return () => stopAutoSync();
  }, []);

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  // Host sync - skip for YouTube
  useEffect(() => {
    if (!canControl || !playback.currentTrack || isYouTube) {
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
      }, () => { });
    };

    sendSync();
    hostSyncIntervalRef.current = setInterval(sendSync, 2000);
    return () => { if (hostSyncIntervalRef.current) clearInterval(hostSyncIntervalRef.current); };
  }, [canControl, playback.currentTrack, playback.isPlaying, isYouTube]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!canControl) return toast.error('Only the host can upload tracks');

    const validExts = /\.(mp3|wav|ogg|flac|aac|m4a)$/i;
    if (!file.type.startsWith('audio/') && !validExts.test(file.name)) {
      return toast.error('Invalid audio file');
    }
    if (file.size > 50 * 1024 * 1024) return toast.error('File must be under 50MB');

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      setUploadedFile({ name: file.name, url: data.url });
      setUrl(data.url);
      setTrack({ url: data.url, title: file.name });
      toast.success(`"${file.name}" loaded!`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [canControl, setTrack]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (canControl) setIsDragOver(true);
  }, [canControl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canControl) return toast.error('Only the host can upload');
    if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
  }, [canControl, handleFileUpload]);

  const handleSetTrack = () => {
    if (!canControl) return toast.error('Only the host can change tracks');
    const trimmed = url.trim();
    if (!trimmed) return;

    if (isYouTubeUrl(trimmed)) {
      const vid = extractYouTubeVideoId(trimmed);
      if (vid) {
        setTrack({ url: trimmed, title: 'YouTube Video', isYouTube: true, videoId: vid });
        toast.success('YouTube video loaded!');
      } else {
        toast.error('Invalid YouTube URL');
      }
    } else {
      setTrack({ url: trimmed, title: 'Custom Track' });
      toast.success('Track set!');
    }
  };

  const handlePlayPause = () => {
    // For YouTube, let the YouTubePlayer handle play/pause
    if (isYouTube) {
      if (!canControl) return toast.error('Only the host can control playback');
      if (playback.isPlaying) {
        pause();
      } else {
        play();
      }
      return;
    }

    if (!canControl) return toast.error('Only the host can control playback');
    if (!playback.currentTrack) return toast.error('No track loaded');

    // Rely solely on server state update to drive audio element via useEffect
    // This prevents race conditions where local state conflicts with incoming server state
    // Optimistic update for Host
    const audio = audioRef.current;
    if (audio) {
      if (!audio.paused) {
        audio.pause();
        pause();
      } else {
        audio.play().catch(console.error);
        play();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (!canControl) return;
    const pos = value[0];
    setLocalProgress(pos);
    setIsSliderDragging(false);

    // Temporarily disable sync enforcement to check for race conditions
    lastSyncRef.current = Date.now() + 1000;

    seek(pos);
    if (audioRef.current && !isYouTube) audioRef.current.currentTime = pos;
  };

  // Sync audio with playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playback.currentTrack?.url) return;

    // Skip for YouTube - handled by YouTubePlayer component
    if (isYouTube) return;

    const trackUrl = playback.currentTrack.url;
    const needsNew = !audio.src || (!audio.src.endsWith(trackUrl) && !audio.src.includes(trackUrl.replace(/^\//, '')));

    if (needsNew) {
      audio.src = trackUrl;
      audio.load();
      setUrl(trackUrl);
      audio.oncanplay = () => {
        if (playback.position > 0) audio.currentTime = playback.position;
        if (playback.isPlaying) audio.play().catch(() => { });
        audio.oncanplay = null;
      };
      return;
    }

    // Only enforce play/pause from server if NOT host (Host is source of truth)
    if (!canControl) {
      if (playback.isPlaying && audio.paused) audio.play().catch(() => { });
      else if (!playback.isPlaying && !audio.paused) audio.pause();
    }

    // Listener sync
    if (!canControl && playback.isPlaying && Date.now() - lastSyncRef.current > 500) {
      const drift = audio.currentTime - playback.position;
      const abs = Math.abs(drift);

      if (abs > 2) {
        audio.currentTime = playback.position;
        audio.playbackRate = 1.0;
        playbackRateRef.current = 1.0;
      } else if (abs > 0.3) {
        const rate = drift > 0 ? 0.97 : 1.03;
        if (audio.playbackRate !== rate) {
          audio.playbackRate = rate;
          playbackRateRef.current = rate;
        }
      } else if (abs < 0.1 && playbackRateRef.current !== 1.0) {
        audio.playbackRate = 1.0;
        playbackRateRef.current = 1.0;
      }
      lastSyncRef.current = Date.now();
    }
  }, [playback.currentTrack?.url, playback.isPlaying, playback.position, canControl, isYouTube]);

  // Progress & duration updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => !isSliderDragging && setLocalProgress(audio.currentTime);
    const onDuration = () => isFinite(audio.duration) && setDuration(audio.duration);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDuration);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDuration);
    };
  }, [isSliderDragging]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  return (
    <div
      className={`bg-card/80 backdrop-blur-sm rounded-2xl border shadow-xl shadow-violet-500/5 transition-all ${isDragOver ? 'border-violet-500 border-2 bg-violet-500/5' : 'border-border/50'}`}
      onDragOver={handleDragOver}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
      onDrop={handleDrop}
    >
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" onError={() => toast.error('Failed to load audio')} />
      <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />

      {isDragOver && canControl && (
        <div className="absolute inset-0 bg-violet-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <Upload className="w-12 h-12 lg:w-16 lg:h-16 text-violet-400 mx-auto mb-3 animate-bounce" />
            <p className="font-semibold text-violet-400 lg:text-lg">Drop audio file here</p>
          </div>
        </div>
      )}

      {/* Host Controls Section */}
      {canControl ? (
        <div className="p-4 lg:p-6 border-b border-border/50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 lg:gap-3 px-4 py-4 lg:py-5 rounded-xl border-2 border-dashed transition-all ${isUploading ? 'border-violet-500 bg-violet-500/5' : 'border-border/50 hover:border-violet-500/50 hover:bg-violet-500/5'}`}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm lg:text-base font-medium">Uploading...</span>
              </>
            ) : uploadedFile ? (
              <>
                <FileAudio className="w-5 h-5 text-violet-400" />
                <span className="text-sm lg:text-base font-medium truncate max-w-[150px] lg:max-w-[250px]">{uploadedFile.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setUrl(''); }} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm lg:text-base text-muted-foreground">Tap to upload audio file</span>
              </>
            )}
          </button>

          <div className="flex gap-2 lg:gap-3 mt-3 lg:mt-4">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL or YouTube link..."
              className="h-11 lg:h-12 text-sm lg:text-base rounded-xl border-border/50 focus:border-violet-500/50 focus:ring-violet-500/20"
              onKeyPress={(e) => e.key === 'Enter' && handleSetTrack()}
            />
            <Button onClick={handleSetTrack} disabled={!connected || !url.trim()} className="h-11 lg:h-12 px-5 lg:px-6 lg:text-base rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25">
              Load
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-3 text-xs lg:text-sm text-muted-foreground">
            <Youtube className="w-4 h-4 text-red-500" />
            <span>YouTube links supported</span>
          </div>
        </div>
      ) : (
        <div className="p-4 lg:p-6 border-b border-border/50">
          <div className="flex items-center gap-3 text-muted-foreground bg-muted/30 px-4 py-3 rounded-xl">
            <Lock className="w-5 h-5 text-violet-400/50" />
            <span className="text-sm lg:text-base">Only the captain can control playback</span>
          </div>
        </div>
      )}

      {/* Now Playing */}
      {playback.currentTrack && (
        <div className="px-4 lg:px-6 py-4 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
              <Music className="w-6 h-6 lg:w-7 lg:h-7 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm lg:text-lg truncate">{playback.currentTrack.title || 'Unknown Track'}</p>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">{playback.currentTrack.url}</p>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Player - renders its own controls */}
      {isYouTube && youtubeVideoId && <YouTubePlayer videoId={youtubeVideoId} />}

      {/* Audio Player Controls - Only show when NOT YouTube */}
      {!isYouTube && (
        <div className="p-4 lg:p-6">
          {/* Waveform */}
          <div className="flex items-end justify-center gap-[3px] lg:gap-1 h-20 sm:h-24 lg:h-32 mb-5 lg:mb-6">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 sm:w-2 lg:w-2.5 rounded-full transition-all ${playback.isPlaying ? 'animate-waveform' : ''}`}
                style={{ 
                  height: playback.isPlaying ? `${25 + Math.random() * 75}%` : '15%', 
                  animationDelay: `${i * 0.05}s`, 
                  animationDuration: `${0.4 + Math.random() * 0.4}s`,
                  background: `linear-gradient(to top, rgb(139 92 246), rgb(217 70 239 / 0.4))`
                }}
              />
            ))}
          </div>

          {/* Play Button */}
          <div className="flex justify-center mb-5 lg:mb-6">
            <button
              onClick={handlePlayPause}
              disabled={!connected || !playback.currentTrack}
              className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                canControl 
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {playback.isPlaying ? <Pause className="w-7 h-7 lg:w-8 lg:h-8" /> : <Play className="w-7 h-7 lg:w-8 lg:h-8 ml-1" />}
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-5 lg:mb-6">
            <Slider
              value={[localProgress]}
              onValueChange={(v) => { setIsSliderDragging(true); setLocalProgress(v[0]); }}
              onValueCommit={handleSeek}
              max={duration || 100}
              step={1}
              disabled={!canControl || !playback.currentTrack}
              className={canControl && playback.currentTrack ? '' : 'opacity-50'}
            />
            <div className="flex justify-between text-xs lg:text-sm text-muted-foreground font-medium">
              <span>{formatTime(localProgress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 lg:gap-4 bg-muted/20 rounded-xl px-4 py-3">
            <Volume2 className="w-5 h-5 text-violet-400" />
            <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} className="flex-1" />
            <span className="text-xs lg:text-sm text-muted-foreground font-medium w-10 text-right">{volume}%</span>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="px-4 lg:px-6 py-3 border-t border-border/50 bg-muted/10 rounded-b-2xl">
        <div className="flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs lg:text-sm text-muted-foreground font-medium">{connected ? 'Synced & Ready' : 'Reconnecting...'}</span>
        </div>
      </div>
    </div>
  );
};
