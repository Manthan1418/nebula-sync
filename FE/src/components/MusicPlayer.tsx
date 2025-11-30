import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Play, Pause, Volume2, Music, Lock, Upload, FileAudio, X } from 'lucide-react';
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
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSyncRef = useRef<number>(0);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!canControl) {
      toast.error('Only the host can upload tracks');
      return;
    }

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/flac', 'audio/aac', 'audio/m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)) {
      toast.error('Please upload a valid audio file (MP3, WAV, OGG, FLAC, AAC, M4A)');
      return;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('audio', file);

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Set the uploaded file info
      setUploadedFile({ name: file.name, url: data.url });
      setUrl(data.url);
      
      // Automatically set track
      setTrack({ url: data.url, title: file.name });
      toast.success(`"${file.name}" uploaded and loaded!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Try using a URL instead.');
    } finally {
      setIsUploading(false);
    }
  }, [canControl, setTrack]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canControl) {
      setIsDragOver(true);
    }
  }, [canControl]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!canControl) {
      toast.error('Only the host can upload tracks');
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [canControl, handleFileUpload]);

  // File input change handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFileUpload]);

  // Clear uploaded file
  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUrl('');
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
    
    if (!playback.currentTrack) {
      toast.error('No track loaded');
      return;
    }
    
    if (playback.isPlaying) {
      pause();
      // Immediately pause local audio for responsiveness
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      play();
      // Immediately play local audio for responsiveness
      if (audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (!canControl) {
      toast.error('Only the host can seek');
      return;
    }
    const newPosition = value[0];
    setLocalProgress(newPosition);
    setIsSliderDragging(false);
    seek(newPosition);
    
    // Also update audio element immediately
    if (audioRef.current) {
      audioRef.current.currentTime = newPosition;
    }
  };

  // Handle slider drag
  const handleSliderChange = (value: number[]) => {
    setIsSliderDragging(true);
    setLocalProgress(value[0]);
  };

  // Sync audio element with playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (!playback.currentTrack?.url) {
      // No track loaded
      return;
    }

    const trackUrl = playback.currentTrack.url;
    
    // Check if we need to load a new track
    // Handle both relative and absolute URLs
    const needsNewSource = !audio.src || 
      (!audio.src.endsWith(trackUrl) && !audio.src.includes(trackUrl.replace(/^\//, '')));
    
    if (needsNewSource) {
      console.log('Loading new track:', trackUrl);
      audio.src = trackUrl;
      audio.load();
      setUrl(trackUrl);
      
      // Auto-play when new track is loaded and should be playing
      if (playback.isPlaying) {
        audio.play().catch(e => console.log('Auto-play prevented:', e));
      }
      return;
    }

    // Sync play state
    if (playback.isPlaying && audio.paused) {
      console.log('Syncing: Starting playback');
      audio.play().catch(e => console.log('Play failed:', e));
    } else if (!playback.isPlaying && !audio.paused) {
      console.log('Syncing: Pausing playback');
      audio.pause();
    }

    // Sync position (with tolerance) - but not too frequently
    const now = Date.now();
    if (now - lastSyncRef.current > 1000) {
      const drift = Math.abs(audio.currentTime - playback.position);
      if (drift > 2) {
        console.log('Syncing position, drift:', drift);
        audio.currentTime = playback.position;
        lastSyncRef.current = now;
      }
    }
  }, [playback.currentTrack?.url, playback.isPlaying, playback.position]);

  // Update local progress from audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isSliderDragging) {
        setLocalProgress(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      const newDuration = audio.duration;
      if (newDuration && isFinite(newDuration)) {
        setDuration(newDuration);
      }
    };

    const handleLoadedMetadata = () => {
      const newDuration = audio.duration;
      if (newDuration && isFinite(newDuration)) {
        setDuration(newDuration);
      }
    };

    const handleCanPlay = () => {
      const newDuration = audio.duration;
      if (newDuration && isFinite(newDuration)) {
        setDuration(newDuration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [isSliderDragging]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <div 
      className={`bg-card rounded-3xl p-8 border transition-all duration-300 ${
        isDragOver 
          ? 'border-primary border-2 bg-primary/5' 
          : 'border-border'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        preload="auto"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error('Audio error:', e);
          toast.error('Failed to load audio. Check the URL.');
        }}
        onEnded={() => {
          console.log('Audio ended');
          setLocalProgress(0);
        }}
      />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag overlay */}
      {isDragOver && canControl && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <Upload className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-semibold text-primary">Drop your audio file here</p>
          </div>
        </div>
      )}

      {/* URL Input & File Upload - Only for host */}
      {canControl ? (
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Add Music</label>
          
          {/* Upload area */}
          <div 
            className="border-2 border-dashed border-border rounded-xl p-6 mb-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-muted-foreground">Uploading...</p>
              </div>
            ) : uploadedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileAudio className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium truncate max-w-xs">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">Click to change</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearUploadedFile();
                  }}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">
                  <span className="text-primary font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">MP3, WAV, OGG, FLAC, AAC, M4A (max 50MB)</p>
              </>
            )}
          </div>

          {/* Or divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or paste URL</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* URL input */}
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste audio URL (MP3, WAV, etc.)..."
              className="w-full"
              onKeyPress={(e) => e.key === 'Enter' && handleSetTrack()}
            />
            <Button onClick={handleSetTrack} disabled={!connected || !url.trim()}>
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
          value={[isSliderDragging ? localProgress : localProgress]}
          onValueChange={handleSliderChange}
          onValueCommit={handleSeek}
          max={duration || 100}
          step={0.1}
          disabled={!canControl || !playback.currentTrack}
          className={canControl && playback.currentTrack ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{formatTime(localProgress)}</span>
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
