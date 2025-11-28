import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { CursorEffect } from '@/components/CursorEffect';
import { MusicPlayer } from '@/components/MusicPlayer';
import { ConnectedDevices } from '@/components/ConnectedDevices';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Room() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const roomName = location.state?.roomName || 'Music Room';

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success('Room code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen p-6 relative">
      <ParallaxBackground />
      <CursorEffect />
      
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="glow-text-cyan hover:glow-text-purple transition-all"
          >
            <ArrowLeft className="mr-2" />
            Leave Room
          </Button>
          
          <div className="glassmorphism px-6 py-3 rounded-full flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Room Code:</span>
            <span className="font-mono font-bold text-lg glow-text-purple">{roomCode}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyRoomCode}
              className="hover:glow-text-cyan"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Room Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-3 glow-text-purple">{roomName}</h1>
          <p className="text-muted-foreground">Share the room code with friends to sync your music</p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Music Player - Takes 2 columns */}
          <div className="lg:col-span-2 animate-slide-in-left">
            <MusicPlayer />
          </div>

          {/* Connected Devices - Takes 1 column */}
          <div className="animate-slide-in-right">
            <ConnectedDevices />
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-12 glassmorphism p-6 rounded-2xl border border-primary/20 animate-fade-in">
          <p className="text-center text-muted-foreground">
            🎵 This is a visual demo. Real playback synchronization will be implemented with backend integration.
          </p>
        </div>
      </div>
    </div>
  );
}
