import { Orbit, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground group cursor-pointer">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow">
              <Orbit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">Nebula Sync</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#home" className="text-muted-foreground hover:text-violet-400 transition-all text-sm lg:text-base font-medium">Home</a>
            <a href="#features" className="text-muted-foreground hover:text-violet-400 transition-all text-sm lg:text-base font-medium">Features</a>
            <a href="#about" className="text-muted-foreground hover:text-violet-400 transition-all text-sm lg:text-base font-medium">About</a>
            <a href="#contact" className="text-muted-foreground hover:text-violet-400 transition-all text-sm lg:text-base font-medium">Contact</a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground rounded-lg hover:bg-muted/50 transition-colors" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden pt-4 pb-2 flex flex-col gap-1 border-t border-border/50 mt-3 animate-fade-in">
            <a href="#home" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-violet-400 hover:bg-violet-500/5 py-3 px-3 rounded-lg transition-all">Home</a>
            <a href="#features" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-violet-400 hover:bg-violet-500/5 py-3 px-3 rounded-lg transition-all">Features</a>
            <a href="#about" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-violet-400 hover:bg-violet-500/5 py-3 px-3 rounded-lg transition-all">About</a>
            <a href="#contact" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-violet-400 hover:bg-violet-500/5 py-3 px-3 rounded-lg transition-all">Contact</a>
          </div>
        )}
      </div>
    </nav>
  );
};
