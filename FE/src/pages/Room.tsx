import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Check, Crown, Users, MessageCircle, Music } from 'lucide-react';
import { MusicPlayer } from '@/components/MusicPlayer';
import { ConnectedDevices } from '@/components/ConnectedDevices';
import { ChatPanel } from '@/components/ChatPanel';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketContext';
import { getRoomSession } from '@/lib/sessionStorage';

export default function Room() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'chat'>('chat');
  const { room, leaveRoom, isHost, connected } = useSocket();

  // Get room info from location state or sessionStorage
  const getRoomInfo = () => {
    if (location.state?.roomName) {
      return {
        roomName: location.state.roomName,
        isHostFromState: location.state.isHost
      };
    }
    const savedSession = getRoomSession();
    if (savedSession) {
      const { roomName, isHost } = savedSession;
      return { roomName: roomName || 'Music Room', isHostFromState: isHost };
    }
    return { roomName: 'Music Room', isHostFromState: false };
  };

  const { roomName, isHostFromState } = getRoomInfo();
  const userCount = room?.users?.length || 1;

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
  };

  useEffect(() => {
    if (!connected) return;
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
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-b from-background via-background to-violet-500/5">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
      </div>

      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-3 py-2.5 lg:px-6 lg:py-3 max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 lg:gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 lg:p-2.5 -ml-2 rounded-xl hover:bg-muted/50 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 lg:w-5 lg:h-5" />
            <span className="text-sm lg:text-base hidden sm:inline font-medium">Leave</span>
          </button>

          {/* Room Info - Center */}
          <div className="flex flex-col items-center flex-1 min-w-0 px-2">
            <div className="flex items-center gap-1.5 lg:gap-2">
              {(isHost || isHostFromState) && (
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Crown className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white" />
                </div>
              )}
              <h1 className="text-sm lg:text-xl font-bold truncate max-w-[150px] sm:max-w-[250px] lg:max-w-[400px]">{roomName}</h1>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] lg:text-xs text-muted-foreground font-medium">{connected ? 'Live' : 'Reconnecting...'}</span>
            </div>
          </div>

          {/* Room Code */}
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 lg:gap-2 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 hover:from-violet-500/20 hover:to-fuchsia-500/20 border border-violet-500/20 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl transition-all active:scale-95 group"
          >
            <span className="font-mono font-bold text-xs lg:text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">{roomCode}</span>
            {copied ? (
              <Check className="w-4 h-4 lg:w-5 lg:h-5 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 lg:w-5 lg:h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Player Area */}
          <div className="lg:col-span-2">
            <MusicPlayer />
          </div>

          {/* Sidebar / Tabs Area */}
          <div className="lg:col-span-1">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block space-y-5">
              <ConnectedDevices />
              <ChatPanel roomCode={roomCode} />
            </div>

            {/* Mobile Tabs */}
            <div className="lg:hidden bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden shadow-xl shadow-violet-500/5">
              <div className="flex border-b border-border/50">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                    activeTab === 'chat' 
                      ? 'text-violet-400 bg-violet-500/5 border-b-2 border-violet-500' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                    activeTab === 'users' 
                      ? 'text-violet-400 bg-violet-500/5 border-b-2 border-violet-500' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Crew
                  <span className="text-xs bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-400 px-2 py-0.5 rounded-full font-semibold">{userCount}</span>
                </button>
              </div>

              {activeTab === 'chat' ? (
                <ChatPanel compact roomCode={roomCode} />
              ) : (
                <ConnectedDevices compact />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
