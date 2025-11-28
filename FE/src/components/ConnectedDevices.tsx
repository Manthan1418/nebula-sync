import { Smartphone, Monitor, Crown, User } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

export const ConnectedDevices = () => {
  const { room, connected } = useSocket();
  
  // Get users from room, fallback to empty array
  const users = room?.users || [];

  // Helper to get device icon
  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('phone') || name.includes('iphone') || name.includes('android')) {
      return Smartphone;
    }
    if (name.includes('laptop') || name.includes('desktop') || name.includes('pc') || name.includes('mac')) {
      return Monitor;
    }
    return User;
  };

  return (
    <div className="bg-card rounded-3xl p-6 border border-border">
      <h3 className="text-xl font-bold mb-6 text-foreground">
        Connected Devices ({users.length})
      </h3>
      
      {!connected && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Connecting to server...</p>
        </div>
      )}

      {connected && users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No users in the room yet</p>
        </div>
      )}
      
      <div className="space-y-4">
        {users.map((user: any) => {
          const DeviceIcon = getDeviceIcon(user.deviceName || user.name || '');
          const isUserHost = user.isHost || room?.hostId === user.id;
          
          return (
            <div
              key={user.id}
              className={`bg-card p-4 rounded-xl transition-all duration-300 hover:scale-105 group border ${
                isUserHost ? 'border-yellow-500/50' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isUserHost ? 'bg-yellow-500/20' : 'bg-secondary'
                }`}>
                  {isUserHost ? (
                    <Crown className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <DeviceIcon className="w-6 h-6 text-background" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.deviceName || user.name || 'Unknown'}</p>
                    {isUserHost && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                        Host
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-muted rounded-full animate-waveform"
                        style={{
                          height: `${8 + Math.random() * 12}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  isUserHost ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
