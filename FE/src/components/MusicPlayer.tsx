import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Play, Pause, Volume2, Music, Lock } from 'lucide-react';
import { Slider } from './ui/slider';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';

export const MusicPlayer = () => {
  const location = useLocation();
  const { playback, play, pause, seek, setTrack, isHost, connected } = useSocket();
  const isHostFromState = location.state?.isHost;
  const canControl = isHost || isHostFromState;
  
  const [url, setUrl] = useState('');
  const [volume, setVolume] = useState(70);
  const [localProgress, setLocalProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle setting track URL
  const handleSetTrack = () => {
    if (!canControl) {
      toast.error('Only the host can change tracks');
      return;
    }
    if (url.trim()) {
      setTrack({ url: url.trim(), title: 'Custom Track' });
      toast.success('Track set!');
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!canControl) {
      toast.error('Only the host can control playback');
      return;
    }
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (!canControl) {
      toast.error('Only the host can seek');
      return;
    }
    setLocalProgress(value[0]);
    setIsDragging(false);
    seek(value[0]);
  };

  // Sync audio element with playback state
  useEffect(() => {
    if (!audioRef.current || !playback.currentTrack?.url) return;

    const audio = audioRef.current;
    
    // Update source if changed
    if (audio.src !== playback.currentTrack.url) {
      audio.src = playback.currentTrack.url;
      audio.load();
      setUrl(playback.currentTrack.url);
    }

    // Sync play state
    if (playback.isPlaying && audio.paused) {
      audio.play().catch(console.error);
    } else if (!playback.isPlaying && !audio.paused) {
      audio.pause();
    }

    // Sync position (with tolerance)
    const drift = Math.abs(audio.currentTime - playback.position);
    if (drift > 0.5) {
      audio.currentTime = playback.position;
    }
  }, [playback]);

  // Update progress from audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setLocalProgress(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, [isDragging]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <div className="bg-card rounded-3xl p-8 border border-border">
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* URL Input - Only for host */}
      {canControl ? (
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Music URL</label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste audio URL (MP3, WAV, etc.)..."
              className="w-full"
              onKeyPress={(e) => e.key === 'Enter' && handleSetTrack()}
            />
            <Button onClick={handleSetTrack} disabled={!connected}>
              Load
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-8 glassmorphism p-4 rounded-xl flex items-center gap-3 border border-secondary/30">
          <Lock className="w-5 h-5 text-secondary" />
          <span className="text-muted-foreground">Only the host can control playback</span>
        </div>
      )}

      {/* Current Track Info */}
      {playback.currentTrack && (
        <div className="mb-6 glassmorphism p-4 rounded-xl flex items-center gap-3">
          <Music className="w-6 h-6 text-primary" />
          <div className="overflow-hidden">
            <p className="font-medium truncate">{playback.currentTrack.title || 'Unknown Track'}</p>
            <p className="text-sm text-muted-foreground truncate">{playback.currentTrack.url}</p>
          </div>
        </div>
      )}

      {/* Waveform Visualizer */}
      <div className="flex items-end justify-center gap-1 h-32 mb-8">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 bg-gradient-to-t from-primary via-accent to-secondary rounded-full ${
              playback.isPlaying ? 'animate-waveform' : ''
            }`}
            style={{
              height: playback.isPlaying ? `${20 + Math.random() * 80}%` : '20%',
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
              transition: 'height 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Play Button */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={handlePlayPause}
          size="lg"
          disabled={!connected || !playback.currentTrack}
          className={`w-24 h-24 rounded-full transition-all duration-300 ${
            canControl 
              ? 'bg-primary hover:bg-primary/90 hover:scale-110' 
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {playback.isPlaying ? (
            <Pause className="w-10 h-10" />
          ) : (
            <Play className="w-10 h-10 ml-1" />
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <Slider
          value={[isDragging ? localProgress : (playback.position || 0)]}
          onValueChange={(v) => {
            setIsDragging(true);
            setLocalProgress(v[0]);
          }}
          onValueCommit={handleSeek}
          max={duration || 100}
          step={0.1}
          disabled={!canControl}
          className={canControl ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{formatTime(playback.position || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume - Local control */}
      <div className="flex items-center gap-3">
        <Volume2 className="w-5 h-5 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={(v) => setVolume(v[0])}
          max={100}
          step={1}
          className="cursor-pointer"
        />
        <span className="text-sm text-muted-foreground w-12 text-right">{volume}%</span>
      </div>

      {/* Status */}
      <div className="mt-6 text-center">
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          connected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
        }`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          {connected ? 'Synced' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};
