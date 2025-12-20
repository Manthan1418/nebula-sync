import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Wifi, WifiOff } from 'lucide-react';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { CursorEffect } from '@/components/CursorEffect';
import { useSocket } from '@/context/SocketContext';

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const navigate = useNavigate();
  const { joinRoom, room, loading, error, connected } = useSocket();

  const handleJoin = () => {
    if (roomCode.trim() && deviceName.trim()) {
      joinRoom(roomCode.toUpperCase(), deviceName.trim());
    }
  };

  // Navigate to room when joined
  useEffect(() => {
    if (room) {
      navigate(`/room/${room.id}`, { state: { roomName: 'Music Room', isHost: false } });
    }
  }, [room, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <ParallaxBackground />
      <CursorEffect />
      
      <div className="w-full max-w-md animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-8 glow-text-cyan hover:glow-text-purple transition-all text-sm"
        >
          <ArrowLeft className="mr-1 sm:mr-2 w-4 h-4" />
          Back
        </Button>
        
        <div className="glassmorphism p-6 sm:p-10 rounded-2xl sm:rounded-3xl glow-border-cyan">
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            {connected ? (
              <>
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                <span className="text-xs sm:text-sm text-green-500">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                <span className="text-xs sm:text-sm text-red-500">Connecting...</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-secondary/20 flex items-center justify-center animate-pulse-glow">
              <Users className="w-7 h-7 sm:w-10 sm:h-10 text-secondary" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2 sm:mb-3 glow-text-cyan">
            Join Room
          </h1>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            Enter the room code
          </p>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Room Code</label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="glassmorphism border-secondary/30 focus:glow-border-cyan text-lg sm:text-xl py-4 sm:py-6 text-center font-mono tracking-widest transition-all"
                maxLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Enter your name..."
                className="glassmorphism border-secondary/30 focus:glow-border-cyan text-base sm:text-lg py-4 sm:py-6 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs sm:text-sm text-center">{error}</p>
            )}
            
            <Button
              onClick={handleJoin}
              disabled={roomCode.trim().length < 6 || !deviceName.trim() || loading || !connected}
              size="lg"
              className="w-full glow-border-purple hover:scale-105 transition-all py-4 sm:py-6 text-base sm:text-lg"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </Button>
          </div>
          
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 glassmorphism rounded-xl border border-primary/20">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              🎵 Get the code from your friend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
