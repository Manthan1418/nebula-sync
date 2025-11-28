import { Music } from 'lucide-react';
import { NavLink } from './NavLink';

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glassmorphism border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Music className="w-8 h-8" />
            <span className="text-2xl font-bold">SyncSound</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#home" 
              className="text-muted-foreground hover:text-foreground transition-all duration-300"
            >
              Home
            </a>
            <a 
              href="#features" 
              className="text-muted-foreground hover:text-foreground transition-all duration-300"
            >
              Features
            </a>
            <a 
              href="#about" 
              className="text-muted-foreground hover:text-foreground transition-all duration-300"
            >
              About
            </a>
            <a 
              href="#contact" 
              className="text-muted-foreground hover:text-foreground transition-all duration-300"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};
