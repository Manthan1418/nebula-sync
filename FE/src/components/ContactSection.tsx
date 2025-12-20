import { Mail, MessageSquare, Github } from 'lucide-react';
import { Button } from './ui/button';

export const ContactSection = () => {
  return (
    <section id="contact" className="py-16 sm:py-24 lg:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-foreground">
              Get in Touch
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-16">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-16">
            <div className="p-4 sm:p-6 bg-card border border-border rounded-xl sm:rounded-2xl hover:border-primary transition-all hover:scale-[1.02] sm:hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-foreground">Email</h3>
              <p className="text-sm sm:text-base text-muted-foreground">hello@syncsound.app</p>
            </div>
            
            <div className="p-4 sm:p-6 bg-card border border-border rounded-xl sm:rounded-2xl hover:border-primary transition-all hover:scale-[1.02] sm:hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-foreground">Discord</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Join our community</p>
            </div>
            
            <div className="p-4 sm:p-6 bg-card border border-border rounded-xl sm:rounded-2xl hover:border-primary transition-all hover:scale-[1.02] sm:hover:scale-105">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Github className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-foreground">GitHub</h3>
              <p className="text-sm sm:text-base text-muted-foreground">View the source</p>
            </div>
          </div>
          
          <Button 
            size="lg"
            className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-7 hover:scale-105 transition-all bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          >
            Send us a message
          </Button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center mt-16 sm:mt-32 text-sm sm:text-base text-muted-foreground px-4">
        <p>© 2025 SyncSound. Bringing music lovers together.</p>
      </div>
    </section>
  );
};
