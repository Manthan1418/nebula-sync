import { Button } from './ui/button';
import { ChevronDown, Users, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 sm:pt-20">

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-5xl mx-auto animate-fade-in">
          {/* Main heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-bold mb-4 sm:mb-6 text-foreground leading-tight">
            SyncSound
          </h1>

          {/* Tagline */}
          <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl mb-6 sm:mb-12 text-muted-foreground font-light">
            Multiple devices. One sound.
          </p>

          {/* Description */}
          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-16 max-w-2xl mx-auto px-4">
            Experience music together in perfect harmony. Create a room, invite friends,
            and sync your listening.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center px-4">
            <Button
              onClick={() => navigate('/create')}
              size="lg"
              className="group relative overflow-hidden text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 hover:scale-105 transition-all duration-300 bg-primary hover:bg-white text-white hover:text-primary w-full sm:w-auto"
            >
              <Users className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
              Create Room
            </Button>

            <Button
              onClick={() => navigate('/join')}
              size="lg"
              variant="outline"
              className="group text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 hover:scale-105 transition-all duration-300 border-2 border-primary text-white hover:bg-white hover:text-primary w-full sm:w-auto"
            >
              <Radio className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
              Join Room
            </Button>
          </div>

          {/* Floating shapes - Hidden on mobile */}
          <div className="hidden sm:block absolute top-1/4 left-10 w-20 h-20 border-2 border-border rounded-full animate-float opacity-20" />
          <div className="hidden sm:block absolute bottom-1/4 right-10 w-32 h-32 border-2 border-border rounded-lg animate-float opacity-20" style={{ animationDelay: '1s' }} />
          <div className="hidden sm:block absolute top-1/2 left-1/4 w-16 h-16 border-2 border-border rotate-45 animate-float opacity-20" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    </section>
  );
};
