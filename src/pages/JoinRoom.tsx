import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users } from 'lucide-react';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { CursorEffect } from '@/components/CursorEffect';

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.toUpperCase()}`);
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
        
        <div className="glassmorphism p-10 rounded-3xl glow-border-cyan">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center animate-pulse-glow">
              <Users className="w-10 h-10 text-secondary" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-center mb-3 glow-text-cyan">
            Join Room
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter the room code to join
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Room Code</label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="glassmorphism border-secondary/30 focus:glow-border-cyan text-lg py-6 text-center font-mono tracking-widest transition-all duration-300"
                maxLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            
            <Button
              onClick={handleJoin}
              disabled={roomCode.trim().length < 6}
              size="lg"
              className="w-full glow-border-purple hover:scale-105 transition-all duration-300 py-6 text-lg"
            >
              Join Room
            </Button>
          </div>
          
          <div className="mt-8 p-4 glassmorphism rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              🎵 Get the room code from your friend who created the room
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
