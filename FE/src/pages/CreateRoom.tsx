import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Orbit, Wifi, WifiOff, Sparkles } from 'lucide-react';
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
      navigate(`/room/${room.id}`, { state: { roomName: deviceName + "'s Constellation", isHost: true } });
    }
  }, [room, navigate, deviceName]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-background to-fuchsia-500/10" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 sm:mb-8 text-muted-foreground hover:text-violet-400 transition-all text-sm"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>

        <div className="bg-card/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-border/50 shadow-2xl shadow-violet-500/10">
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {connected ? (
              <div className="flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full">
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-xs font-medium">Connecting...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Orbit className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Create Constellation
          </h1>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-8">
            Launch a new cosmic listening session
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Your Callsign</label>
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Enter your name..."
                className="h-12 sm:h-14 text-base sm:text-lg rounded-xl border-border/50 focus:border-violet-500/50 focus:ring-violet-500/20 bg-background/50"
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={!deviceName.trim() || loading || !connected}
              size="lg"
              className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Launching...
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Launch Constellation
                </>
              )}
            </Button>
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/10">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              🌟 You'll get a star code to share with your crew
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
