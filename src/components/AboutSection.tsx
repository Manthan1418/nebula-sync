import { Music2, Heart, Sparkles } from 'lucide-react';

export const AboutSection = () => {
  return (
    <section id="about" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 glow-text-cyan">
              About SyncSound
            </h2>
            <p className="text-xl text-muted-foreground">
              Bringing people together through synchronized music
            </p>
          </div>
          
          <div className="space-y-12">
            <div className="flex gap-6 items-start animate-slide-in-left">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 glow-border-purple">
                <Music2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We believe music is best enjoyed together. SyncSound breaks down the barriers 
                  of distance and technology to create shared listening experiences that bring 
                  people closer.
                </p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start animate-slide-in-right">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 glow-border-cyan">
                <Heart className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Built with Passion</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Created by music lovers for music lovers. Every feature is designed with 
                  the goal of making group listening seamless, intuitive, and magical.
                </p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start animate-slide-in-left">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 glow-border-purple">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">The Future</h3>
                <p className="text-muted-foreground leading-relaxed">
                  This is just the beginning. We're constantly working on new features to 
                  enhance your listening experience and make music even more social.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
