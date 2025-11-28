import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { Slider } from './ui/slider';

export const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState(30);
  const [volume, setVolume] = useState(70);

  return (
    <div className="glassmorphism rounded-3xl p-8 glow-border-purple">
      {/* URL Input */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Music URL</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube, Spotify, or audio URL..."
          className="glassmorphism border-primary/30 focus:glow-border-cyan"
        />
      </div>

      {/* Waveform Visualizer */}
      <div className="flex items-end justify-center gap-1 h-32 mb-8">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-primary via-accent to-secondary rounded-full animate-waveform"
            style={{
              height: `${20 + Math.random() * 80}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Play Button */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          size="lg"
          className="w-24 h-24 rounded-full glow-border-purple hover:scale-110 transition-all duration-300 animate-pulse-glow"
        >
          {isPlaying ? (
            <Pause className="w-10 h-10" />
          ) : (
            <Play className="w-10 h-10 ml-1" />
          )}
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="hover:glow-text-cyan">
          <SkipBack className="w-6 h-6" />
        </Button>
        <Button variant="ghost" size="icon" className="hover:glow-text-cyan">
          <SkipForward className="w-6 h-6" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <Slider
          value={[progress]}
          onValueChange={(v) => setProgress(v[0])}
          max={100}
          step={1}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>1:23</span>
          <span>3:45</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <Volume2 className="w-5 h-5 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={(v) => setVolume(v[0])}
          max={100}
          step={1}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};
