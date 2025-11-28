import { Smartphone, Monitor, Tablet, Headphones } from 'lucide-react';

const devices = [
  { id: 1, name: 'John\'s iPhone', icon: Smartphone, color: 'from-primary to-accent' },
  { id: 2, name: 'Sarah\'s Laptop', icon: Monitor, color: 'from-secondary to-primary' },
  { id: 3, name: 'Mike\'s iPad', icon: Tablet, color: 'from-accent to-secondary' },
  { id: 4, name: 'Alex\'s Headphones', icon: Headphones, color: 'from-primary to-secondary' }
];

export const ConnectedDevices = () => {
  return (
    <div className="glassmorphism rounded-3xl p-6 glow-border-cyan">
      <h3 className="text-xl font-bold mb-6 glow-text-cyan">
        Connected Devices ({devices.length})
      </h3>
      
      <div className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="glassmorphism p-4 rounded-xl hover:glow-border-purple transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${device.color} flex items-center justify-center group-hover:animate-pulse-glow`}>
                <device.icon className="w-6 h-6 text-background" />
              </div>
              
              <div className="flex-1">
                <p className="font-medium">{device.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-primary to-secondary rounded-full animate-waveform"
                      style={{
                        height: `${8 + Math.random() * 12}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
