import { Button } from './ui/button';
import { Users, Radio, Star, Orbit, Headphones, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 sm:pt-20 overflow-hidden">
      {/* Cosmic background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-background to-fuchsia-500/10" />
      
      {/* Nebula orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      
      {/* Star particles */}
      <div className="absolute top-20 left-20 w-1 h-1 bg-white rounded-full animate-twinkle" />
      <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-violet-300 rounded-full animate-twinkle" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-32 left-40 w-1 h-1 bg-fuchsia-300 rounded-full animate-twinkle" style={{ animationDelay: '1s' }} />
      <div className="absolute top-60 right-20 w-1 h-1 bg-cyan-300 rounded-full animate-twinkle" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 mb-6 sm:mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-400">Sync across the cosmos</span>
          </div>

          {/* Main heading with gradient */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-4 sm:mb-6 leading-tight animate-fade-in">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
              Nebula Sync
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-3xl md:text-4xl mb-6 sm:mb-8 text-muted-foreground font-light animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Multiple devices. <span className="text-violet-400 font-medium">One universe.</span>
          </p>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 sm:mb-14 max-w-2xl mx-auto px-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Experience music together across the cosmos. Create a constellation, invite friends,
            and enjoy perfectly synchronized listening across all your devices.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={() => navigate('/create')}
              size="lg"
              className="group relative overflow-hidden text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-8 transition-all duration-300 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-105 w-full sm:w-auto rounded-2xl"
            >
              <Orbit className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
              Create Constellation
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
            </Button>

            <Button
              onClick={() => navigate('/join')}
              size="lg"
              variant="outline"
              className="group text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-8 transition-all duration-300 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 w-full sm:w-auto rounded-2xl"
            >
              <Radio className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
              Join Constellation
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="mt-16 sm:mt-24 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
                <Wifi className="w-6 h-6 sm:w-7 sm:h-7 text-violet-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Instant Sync</span>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-500/5 flex items-center justify-center">
                <Orbit className="w-6 h-6 sm:w-7 sm:h-7 text-fuchsia-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">YouTube & Audio</span>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
                <Headphones className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Group Sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="hidden lg:block absolute top-1/4 left-16 w-20 h-20 border-2 border-violet-500/20 rounded-2xl animate-float opacity-60 rotate-12" />
      <div className="hidden lg:block absolute bottom-1/3 right-20 w-16 h-16 border-2 border-fuchsia-500/20 rounded-full animate-float opacity-60" style={{ animationDelay: '1s' }} />
      <div className="hidden lg:block absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-xl animate-float opacity-40" style={{ animationDelay: '2s' }} />
    </section>
  );
};
