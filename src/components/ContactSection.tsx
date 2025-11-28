import { Mail, MessageSquare, Github } from 'lucide-react';
import { Button } from './ui/button';

export const ContactSection = () => {
  return (
    <section id="contact" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 glow-text-purple">
              Get in Touch
            </h2>
            <p className="text-xl text-muted-foreground mb-16">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-6 glassmorphism rounded-2xl hover:glow-border-purple transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-muted-foreground">hello@syncsound.app</p>
            </div>
            
            <div className="p-6 glassmorphism rounded-2xl hover:glow-border-cyan transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Discord</h3>
              <p className="text-muted-foreground">Join our community</p>
            </div>
            
            <div className="p-6 glassmorphism rounded-2xl hover:glow-border-purple transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Github className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">GitHub</h3>
              <p className="text-muted-foreground">View the source</p>
            </div>
          </div>
          
          <Button 
            size="lg"
            className="glow-border-cyan text-lg px-10 py-7 hover:scale-105 transition-all duration-300"
          >
            Send us a message
          </Button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center mt-32 text-muted-foreground">
        <p>© 2025 SyncSound. Bringing music lovers together.</p>
      </div>
    </section>
  );
};
