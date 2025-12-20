import { Music, Menu, X } from 'lucide-react';
import { NavLink } from './NavLink';
import { useState } from 'react';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glassmorphism border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Music className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-xl sm:text-2xl font-bold">SyncSound</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#home" className="text-muted-foreground hover:text-foreground transition-all text-sm lg:text-base">Home</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-all text-sm lg:text-base">Features</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-all text-sm lg:text-base">About</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-all text-sm lg:text-base">Contact</a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-2 flex flex-col gap-3 border-t border-border mt-3">
            <a href="#home" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground py-2">Home</a>
            <a href="#features" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground py-2">Features</a>
            <a href="#about" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground py-2">About</a>
            <a href="#contact" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground py-2">Contact</a>
          </div>
        )}
      </div>
    </nav>
  );
};
