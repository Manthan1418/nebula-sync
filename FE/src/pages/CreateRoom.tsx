import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Radio, Wifi, WifiOff } from 'lucide-react';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { CursorEffect } from '@/components/CursorEffect';
import { useSocket } from '@/context/SocketContext';

export default function CreateRoom() {
  const [deviceName, setDeviceName] = useState('');
  const navigate = useNavigate();
  const { createRoom, room, loading, connected } = useSocket();

  const handleCreate = () => {
    if (deviceName.trim()) {
      createRoom(deviceName.trim());
    }
  };

  // Navigate to room when created
  useEffect(() => {
    if (room) {
      navigate(`/room/${room.id}`, { state: { roomName: deviceName + "'s Room", isHost: true } });
    }
  }, [room, navigate, deviceName]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <ParallaxBackground />
      <CursorEffect />
      
      <div className="w-full max-w-md animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 glow-text-cyan hover:glow-text-purple transition-all"
        >
          <ArrowLeft className="mr-2" />
          Back to Home
        </Button>
        
        <div className="glassmorphism p-10 rounded-3xl glow-border-purple">
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {connected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Connected to server</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">Connecting...</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
              <Radio className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-center mb-3 glow-text-purple">
            Create Room
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Start a new listening session
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Your Name / Device</label>
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Enter your name or device..."
                className="glassmorphism border-primary/30 focus:glow-border-purple text-lg py-6 transition-all duration-300"
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            
            <Button
              onClick={handleCreate}
              disabled={!deviceName.trim() || loading || !connected}
              size="lg"
              className="w-full glow-border-cyan hover:scale-105 transition-all duration-300 py-6 text-lg"
            >
              {loading ? 'Creating...' : 'Create & Join Room'}
            </Button>
          </div>
          
          <div className="mt-8 p-4 glassmorphism rounded-xl border border-secondary/20">
            <p className="text-sm text-muted-foreground text-center">
              💡 You'll get a unique room code to share with friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
