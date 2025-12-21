import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Check, Crown, Users, MessageCircle } from 'lucide-react';
import { MusicPlayer } from '@/components/MusicPlayer';
import { ConnectedDevices } from '@/components/ConnectedDevices';
import { ChatPanel } from '@/components/ChatPanel';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketContext';

export default function Room() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'chat'>('chat');
  const { room, leaveRoom, isHost, connected } = useSocket();

  const roomName = location.state?.roomName || 'Music Room';
  const isHostFromState = location.state?.isHost;
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
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-background">

      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-3 py-2 lg:px-6 lg:py-3 max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-1 lg:gap-2 text-muted-foreground hover:text-foreground transition-colors p-1.5 lg:p-2 -ml-1.5 rounded-lg active:bg-muted"
          >
            <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            <span className="text-sm lg:text-base hidden sm:inline">Leave</span>
          </button>

          {/* Room Info - Center */}
          <div className="flex flex-col items-center flex-1 min-w-0 px-2">
            <div className="flex items-center gap-1.5 lg:gap-2">
              {(isHost || isHostFromState) && <Crown className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-yellow-500" />}
              <h1 className="text-sm lg:text-xl font-semibold truncate max-w-[150px] sm:max-w-[250px] lg:max-w-[400px]">{roomName}</h1>
            </div>
            <div className="flex items-center gap-1 lg:gap-1.5">
              <span className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] lg:text-sm text-muted-foreground">{connected ? 'Connected' : 'Offline'}</span>
            </div>
          </div>

          {/* Room Code */}
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 lg:gap-2 bg-muted/50 hover:bg-muted px-2.5 py-1.5 lg:px-4 lg:py-2 rounded-lg transition-colors active:scale-95"
          >
            <span className="font-mono font-bold text-xs lg:text-base tracking-wider">{roomCode}</span>
            {copied ? <Check className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-green-500" /> : <Copy className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-muted-foreground" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
          {/* Main Player Area - Single Instance */}
          <div className="lg:col-span-2">
            <MusicPlayer />
          </div>

          {/* Sidebar / Tabs Area */}
          <div className="lg:col-span-1">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block space-y-6">
              <ConnectedDevices />
              <ChatPanel roomCode={roomCode} />
            </div>

            {/* Mobile Tabs */}
            <div className="lg:hidden bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  <Users className="w-4 h-4" />
                  Users
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{userCount}</span>
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
