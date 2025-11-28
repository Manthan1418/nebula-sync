import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Crown, Wifi, WifiOff } from 'lucide-react';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { CursorEffect } from '@/components/CursorEffect';
import { MusicPlayer } from '@/components/MusicPlayer';
import { ConnectedDevices } from '@/components/ConnectedDevices';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketContext';

export default function Room() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { room, leaveRoom, isHost, connected } = useSocket();
  
  const roomName = location.state?.roomName || 'Music Room';
  const isHostFromState = location.state?.isHost;

  // Leave room handler
  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
  };

  // Redirect if room doesn't exist
  useEffect(() => {
    if (!connected) return;
    
    // Give some time for room data to load
    const timeout = setTimeout(() => {
      if (!room && !location.state?.roomName) {
        toast.error('Room not found');
        navigate('/');
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [room, connected, navigate, location.state]);

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
            onClick={handleLeaveRoom}
            className="glow-text-cyan hover:glow-text-purple transition-all"
          >
            <ArrowLeft className="mr-2" />
            Leave Room
          </Button>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="glassmorphism px-4 py-2 rounded-full flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">Disconnected</span>
                </>
              )}
            </div>

            {/* Host Badge */}
            {(isHost || isHostFromState) && (
              <div className="glassmorphism px-4 py-2 rounded-full flex items-center gap-2 border border-yellow-500/30">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-500">Host</span>
              </div>
            )}

            {/* Room Code */}
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
        </div>

        {/* Room Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-3 glow-text-purple">{roomName}</h1>
          <p className="text-muted-foreground">
            {(isHost || isHostFromState) 
              ? 'You are the host. Control the music for everyone!' 
              : 'Share the room code with friends to sync your music'}
          </p>
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
            {(isHost || isHostFromState)
              ? '🎵 You control the music. Everyone in the room will hear what you play!'
              : '🎧 Listen along with the host. Playback is synced in real-time.'}
          </p>
        </div>
      </div>
    </div>
  );
}
