import { Button } from './ui/button';
import { ChevronDown, Users, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBg from '@/assets/hero-bg.jpg';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20">
      {/* Hero background image */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-5xl mx-auto animate-fade-in">
          {/* Main heading */}
          <h1 className="text-7xl md:text-9xl font-bold mb-6 glow-text-purple leading-tight">
            SyncSound
          </h1>
          
          {/* Tagline */}
          <p className="text-2xl md:text-4xl mb-12 glow-text-cyan font-light">
            Multiple devices. One sound.
          </p>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
            Experience music together in perfect harmony. Create a room, invite friends, 
            and sync your listening across all devices.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              onClick={() => navigate('/create')}
              size="lg"
              className="group relative overflow-hidden text-lg px-10 py-7 glow-border-purple hover:scale-105 transition-all duration-300 bg-primary hover:bg-primary/90"
            >
              <Users className="mr-2 w-6 h-6" />
              Create Room
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-accent to-secondary opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </Button>
            
            <Button
              onClick={() => navigate('/join')}
              size="lg"
              variant="outline"
              className="group text-lg px-10 py-7 glow-border-cyan hover:scale-105 transition-all duration-300 border-2 border-secondary hover:bg-secondary/10"
            >
              <Radio className="mr-2 w-6 h-6" />
              Join Room
            </Button>
          </div>
          
          {/* Floating shapes */}
          <div className="absolute top-1/4 left-10 w-20 h-20 border-2 border-primary rounded-full animate-float opacity-30" />
          <div className="absolute bottom-1/4 right-10 w-32 h-32 border-2 border-secondary rounded-lg animate-float opacity-30" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-accent rotate-45 animate-float opacity-30" style={{ animationDelay: '2s' }} />
        </div>
      </div>
      
      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#features" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <span className="text-sm">Scroll to explore</span>
          <ChevronDown className="w-6 h-6" />
        </a>
      </div>
    </section>
  );
};
