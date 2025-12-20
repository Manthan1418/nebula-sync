import { Music2, Heart, Sparkles } from 'lucide-react';

export const AboutSection = () => {
  return (
    <section id="about" className="py-16 sm:py-24 lg:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-foreground">
              About SyncSound
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground">
              Bringing people together through synchronized music
            </p>
          </div>
          
          <div className="space-y-8 sm:space-y-12">
            <div className="flex gap-4 sm:gap-6 items-start animate-slide-in-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-foreground">Our Mission</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  We believe music is best enjoyed together. SyncSound breaks down the barriers 
                  of distance and technology to create shared listening experiences.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 sm:gap-6 items-start animate-slide-in-right">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-foreground">Built with Passion</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Created by music lovers for music lovers. Every feature is designed to 
                  make group listening seamless, intuitive, and magical.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 sm:gap-6 items-start animate-slide-in-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-foreground">The Future</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  This is just the beginning. We're constantly working on new features to 
                  enhance your listening experience and make music more social.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
