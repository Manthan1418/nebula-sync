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
  const canControl = isHost || location.state?.isHost;
  
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
  const isYouTube = isYouTubeUrl(currentTrackUrl);
  const youtubeVideoId = isYouTube ? extractYouTubeVideoId(currentTrackUrl) : null;

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
        isPlaying: !audio.paused && playback.isPlaying,
        serverTime: getServerTime(),
      }, () => {});
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
    console.log('handlePlayPause called', { isYouTube, canControl, isPlaying: playback.isPlaying, currentTrack: playback.currentTrack });
    
    // For YouTube, let the YouTubePlayer handle play/pause
    if (isYouTube) {
      if (!canControl) return toast.error('Only the host can control playback');
      if (playback.isPlaying) {
        console.log('Pausing YouTube');
        pause();
      } else {
        console.log('Playing YouTube');
        play();
      }
      return;
    }
    
    if (!canControl) return toast.error('Only the host can control playback');
    if (!playback.currentTrack) return toast.error('No track loaded');
    
    const audio = audioRef.current;
    if (playback.isPlaying) {
      console.log('Pausing audio');
      pause();
      audio?.pause();
    } else {
      console.log('Playing audio');
      play();
      audio?.play().catch((e) => console.error('Play error:', e));
    }
  };

  const handleSeek = (value: number[]) => {
    if (isYouTube || !canControl) return;
    const pos = value[0];
    setLocalProgress(pos);
    setIsSliderDragging(false);
    seek(pos);
    if (audioRef.current) audioRef.current.currentTime = pos;
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
        if (playback.isPlaying) audio.play().catch(() => {});
        audio.oncanplay = null;
      };
      return;
    }

    if (playback.isPlaying && audio.paused) audio.play().catch(() => {});
    else if (!playback.isPlaying && !audio.paused) audio.pause();

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
      className={`bg-card rounded-xl border transition-all ${isDragOver ? 'border-primary border-2 bg-primary/5' : 'border-border'}`}
      onDragOver={handleDragOver}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
      onDrop={handleDrop}
    >
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" onError={() => toast.error('Failed to load audio')} />
      <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />

      {isDragOver && canControl && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <Upload className="w-10 h-10 lg:w-14 lg:h-14 text-primary mx-auto mb-2 animate-bounce" />
            <p className="font-medium text-primary lg:text-lg">Drop audio file</p>
          </div>
        </div>
      )}

      {/* Host Controls Section */}
      {canControl ? (
        <div className="p-4 lg:p-6 border-b border-border">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 lg:gap-3 px-4 py-3 lg:py-4 rounded-lg border-2 border-dashed transition-all ${isUploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm lg:text-base">Uploading...</span>
              </>
            ) : uploadedFile ? (
              <>
                <FileAudio className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                <span className="text-sm lg:text-base truncate max-w-[150px] lg:max-w-[250px]">{uploadedFile.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setUrl(''); }} className="ml-auto text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                <span className="text-sm lg:text-base text-muted-foreground">Tap to upload audio</span>
              </>
            )}
          </button>
          
          <div className="flex gap-2 lg:gap-3 mt-3 lg:mt-4">
            <Input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="Paste URL or YouTube link..." 
              className="h-10 lg:h-12 text-sm lg:text-base" 
              onKeyPress={(e) => e.key === 'Enter' && handleSetTrack()} 
            />
            <Button onClick={handleSetTrack} disabled={!connected || !url.trim()} className="h-10 lg:h-12 px-4 lg:px-6 lg:text-base">
              Load
            </Button>
          </div>
          
          <div className="flex items-center gap-1.5 lg:gap-2 mt-2 lg:mt-3 text-xs lg:text-sm text-muted-foreground">
            <Youtube className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-red-500" />
            <span>YouTube supported</span>
          </div>
        </div>
      ) : (
        <div className="p-4 lg:p-6 border-b border-border">
          <div className="flex items-center gap-2 lg:gap-3 text-muted-foreground">
            <Lock className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm lg:text-base">Only the host can control playback</span>
          </div>
        </div>
      )}

      {/* Now Playing */}
      {playback.currentTrack && !isYouTube && (
        <div className="px-4 lg:px-6 py-3 lg:py-4 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 lg:w-7 lg:h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm lg:text-lg truncate">{playback.currentTrack.title || 'Unknown Track'}</p>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">{playback.currentTrack.url}</p>
            </div>
          </div>
        </div>
      )}

      {isYouTube && youtubeVideoId && <YouTubePlayer videoId={youtubeVideoId} />}

      {!isYouTube && (
        <div className="p-4 lg:p-6">
          {/* Waveform */}
          <div className="flex items-end justify-center gap-[3px] lg:gap-1 h-16 sm:h-20 lg:h-28 mb-4 lg:mb-6">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 sm:w-2 lg:w-3 bg-gradient-to-t from-primary to-primary/40 rounded-full ${playback.isPlaying ? 'animate-waveform' : ''}`}
                style={{ height: playback.isPlaying ? `${25 + Math.random() * 75}%` : '15%', animationDelay: `${i * 0.05}s`, animationDuration: `${0.4 + Math.random() * 0.4}s` }}
              />
            ))}
          </div>

          {/* Play Button */}
          <div className="flex justify-center mb-4 lg:mb-6">
            <button 
              onClick={handlePlayPause} 
              disabled={!connected || !playback.currentTrack}
              className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${canControl && playback.currentTrack ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
            >
              {playback.isPlaying ? <Pause className="w-6 h-6 lg:w-8 lg:h-8" /> : <Play className="w-6 h-6 lg:w-8 lg:h-8 ml-1" />}
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-1 lg:space-y-2 mb-4 lg:mb-6">
            <Slider 
              value={[localProgress]} 
              onValueChange={(v) => { setIsSliderDragging(true); setLocalProgress(v[0]); }} 
              onValueCommit={handleSeek} 
              max={duration || 100} 
              step={0.1} 
              disabled={!canControl || !playback.currentTrack} 
              className={canControl && playback.currentTrack ? '' : 'opacity-50'} 
            />
            <div className="flex justify-between text-xs lg:text-sm text-muted-foreground">
              <span>{formatTime(localProgress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 lg:gap-4">
            <Volume2 className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
            <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} className="flex-1" />
            <span className="text-xs lg:text-sm text-muted-foreground w-8 lg:w-12 text-right">{volume}%</span>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="px-4 lg:px-6 py-2 lg:py-3 border-t border-border bg-muted/20 rounded-b-xl">
        <div className="flex items-center justify-center gap-1.5 lg:gap-2">
          <span className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs lg:text-sm text-muted-foreground">{connected ? 'Synced' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
};
