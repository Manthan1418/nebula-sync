import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Radio } from 'lucide-react';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { CursorEffect } from '@/components/CursorEffect';

export default function CreateRoom() {
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (roomName.trim()) {
      // Generate a random room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      navigate(`/room/${roomCode}`, { state: { roomName } });
    }
  };

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
              <label className="block text-sm font-medium mb-2">Room Name</label>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter a cool room name..."
                className="glassmorphism border-primary/30 focus:glow-border-purple text-lg py-6 transition-all duration-300"
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            
            <Button
              onClick={handleCreate}
              disabled={!roomName.trim()}
              size="lg"
              className="w-full glow-border-cyan hover:scale-105 transition-all duration-300 py-6 text-lg"
            >
              Create & Join Room
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
