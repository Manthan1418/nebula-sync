import { Smartphone, Monitor, Crown, User, Wifi, Users } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

interface ConnectedDevicesProps {
  compact?: boolean;
}

export const ConnectedDevices = ({ compact = false }: ConnectedDevicesProps) => {
  const { room, connected } = useSocket();
  const users = room?.users || [];

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('phone') || name.includes('iphone') || name.includes('android')) return Smartphone;
    if (name.includes('laptop') || name.includes('desktop') || name.includes('pc') || name.includes('mac')) return Monitor;
    return User;
  };

  // Compact mode for mobile collapsible
  if (compact) {
    return (
      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {!connected && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Wifi className="w-4 h-4 text-muted-foreground animate-pulse" />
            <p className="text-xs text-muted-foreground">Connecting...</p>
          </div>
        )}
        {connected && users.length === 0 && <p className="text-center py-4 text-xs text-muted-foreground">No users yet</p>}
        {users.map((user: any) => {
          const DeviceIcon = getDeviceIcon(user.deviceName || user.name || '');
          const isUserHost = user.isHost || room?.hostId === user.id;
          return (
            <div key={user.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${isUserHost ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20' : 'bg-muted/30 hover:bg-muted/50'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isUserHost ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30' : 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20'}`}>
                {isUserHost ? <Crown className="w-4 h-4 text-white" /> : <DeviceIcon className="w-4 h-4 text-violet-400" />}
              </div>
              <span className="flex-1 text-sm font-medium truncate">{user.deviceName || user.name || 'Unknown'}</span>
              {isUserHost && <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full">Captain</span>}
              <span className={`w-2 h-2 rounded-full ${isUserHost ? 'bg-violet-500' : 'bg-cyan-500'} animate-pulse`} />
            </div>
          );
        })}
      </div>
    );
  }

  // Full mode for desktop sidebar
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 border border-border/50 shadow-xl shadow-violet-500/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          Crew
        </h3>
        <span className="text-sm font-medium text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">{users.length} online</span>
      </div>
      
      {!connected && (
        <div className="flex items-center justify-center gap-2 py-8">
          <Wifi className="w-5 h-5 text-muted-foreground animate-pulse" />
          <p className="text-base text-muted-foreground">Connecting...</p>
        </div>
      )}
      {connected && users.length === 0 && <p className="text-center py-8 text-base text-muted-foreground">No users yet</p>}
      
      <div className="space-y-2.5 max-h-72 overflow-y-auto">
        {users.map((user: any) => {
          const DeviceIcon = getDeviceIcon(user.deviceName || user.name || '');
          const isUserHost = user.isHost || room?.hostId === user.id;
          return (
            <div key={user.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isUserHost ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20' : 'bg-muted/30 hover:bg-muted/50'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUserHost ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30' : 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20'}`}>
                {isUserHost ? <Crown className="w-5 h-5 text-white" /> : <DeviceIcon className="w-5 h-5 text-violet-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.deviceName || user.name || 'Unknown'}</p>
                {isUserHost && <p className="text-xs text-violet-400 font-medium">Captain</p>}
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${isUserHost ? 'bg-violet-500' : 'bg-cyan-500'} animate-pulse`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
