import { Smartphone, Monitor, Crown, User } from 'lucide-react';
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
      <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
        {!connected && <p className="text-center py-2 text-xs text-muted-foreground">Connecting...</p>}
        {connected && users.length === 0 && <p className="text-center py-2 text-xs text-muted-foreground">No users yet</p>}
        {users.map((user: any) => {
          const DeviceIcon = getDeviceIcon(user.deviceName || user.name || '');
          const isUserHost = user.isHost || room?.hostId === user.id;
          return (
            <div key={user.id} className={`flex items-center gap-2 p-2 rounded-lg bg-muted/40 ${isUserHost ? 'ring-1 ring-yellow-500/40' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isUserHost ? 'bg-yellow-500/20' : 'bg-muted'}`}>
                {isUserHost ? <Crown className="w-3.5 h-3.5 text-yellow-500" /> : <DeviceIcon className="w-3.5 h-3.5" />}
              </div>
              <span className="flex-1 text-sm truncate">{user.deviceName || user.name || 'Unknown'}</span>
              {isUserHost && <span className="text-[10px] text-yellow-600 bg-yellow-500/20 px-1.5 py-0.5 rounded">Host</span>}
              <span className={`w-2 h-2 rounded-full ${isUserHost ? 'bg-yellow-500' : 'bg-green-500'}`} />
            </div>
          );
        })}
      </div>
    );
  }

  // Full mode for desktop sidebar
  return (
    <div className="bg-card rounded-xl p-5 border border-border h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base">Users</h3>
        <span className="text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{users.length} online</span>
      </div>
      
      {!connected && <p className="text-center py-6 text-base text-muted-foreground">Connecting...</p>}
      {connected && users.length === 0 && <p className="text-center py-6 text-base text-muted-foreground">No users yet</p>}
      
      <div className="space-y-3 max-h-72 overflow-y-auto">
        {users.map((user: any) => {
          const DeviceIcon = getDeviceIcon(user.deviceName || user.name || '');
          const isUserHost = user.isHost || room?.hostId === user.id;
          return (
            <div key={user.id} className={`flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors ${isUserHost ? 'ring-1 ring-yellow-500/40' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUserHost ? 'bg-yellow-500/20' : 'bg-muted'}`}>
                {isUserHost ? <Crown className="w-5 h-5 text-yellow-500" /> : <DeviceIcon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium truncate">{user.deviceName || user.name || 'Unknown'}</p>
                {isUserHost && <p className="text-xs text-yellow-600">Room Host</p>}
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${isUserHost ? 'bg-yellow-500' : 'bg-green-500'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
