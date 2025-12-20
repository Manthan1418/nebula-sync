import { Waves, Users, Zap, Globe } from 'lucide-react';
import { Card } from './ui/card';

const features = [
  {
    icon: Waves,
    title: 'Perfect Sync',
    description: 'Experience music in perfect harmony across all connected devices with millisecond precision.',
    gradient: 'from-primary to-accent'
  },
  {
    icon: Users,
    title: 'Group Listening',
    description: 'Create rooms and invite friends to share your music journey together, no matter the distance.',
    gradient: 'from-secondary to-primary'
  },
  {
    icon: Zap,
    title: 'Real-time Control',
    description: 'Anyone in the room can control playback, creating a truly collaborative listening experience.',
    gradient: 'from-accent to-secondary'
  },
  {
    icon: Globe,
    title: 'Universal Support',
    description: 'Works with YouTube, Spotify, and direct audio URLs. Your music, your way.',
    gradient: 'from-primary to-secondary'
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16 lg:mb-20 animate-fade-in">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-foreground">
            Features
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for the ultimate group listening experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group p-5 sm:p-8 hover:shadow-md transition-all hover:scale-[1.02] sm:hover:scale-105 animate-fade-in border border-border"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-secondary flex items-center justify-center mb-4 sm:mb-6 group-hover:opacity-80">
                <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-foreground">
                {feature.title}
              </h3>
              
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
