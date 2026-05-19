"use client";

import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, ListMusic } from "lucide-react";
import { useState } from "react";

export function Player({ onToggleQueue }: { onToggleQueue: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="w-full bg-surface-container-high/60 backdrop-blur-3xl rounded-3xl p-6 flex flex-col border border-outline/20 shadow-2xl relative overflow-hidden group">
      
      {/* Background glow based on album art */}
      <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px] -z-10 group-hover:bg-primary/10 transition-colors duration-1000" />

      {/* Album Art (Large & Immersive) */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="w-full aspect-square rounded-2xl overflow-hidden mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative"
      >
        <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop" alt="Album Art" className="object-cover w-full h-full" />
        
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Quick actions on art */}
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={onToggleQueue} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary/80 transition-colors">
              <ListMusic size={18} />
           </button>
        </div>
      </motion.div>

      {/* Track Info */}
      <div className="flex flex-col items-center text-center mb-6">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight">Midnight City</h2>
        <p className="text-sm text-on-surface-variant mt-1 font-medium">M83 • Hurry Up, We're Dreaming</p>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col space-y-2 mb-6">
        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden cursor-pointer flex group/progress">
          <div className="h-full w-1/3 bg-gradient-to-r from-primary to-secondary relative">
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-[0_0_10px_white]" />
          </div>
        </div>
        <div className="flex justify-between text-[11px] font-bold tracking-wider text-on-surface-variant">
          <span>1:42</span>
          <span>4:03</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between px-2 mb-6">
        <button className="text-on-surface-variant hover:text-on-surface transition-colors">
          <Shuffle size={20} />
        </button>
        <div className="flex items-center space-x-4">
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors">
            <SkipBack size={24} fill="currentColor" />
          </button>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1.5" />}
          </motion.button>
          
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors">
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>
        <button className="text-on-surface-variant hover:text-on-surface transition-colors">
          <Repeat size={20} />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center space-x-3 text-on-surface-variant mt-auto">
        <Volume2 size={16} />
        <div className="h-1 flex-1 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer group/vol">
          <div className="h-full w-2/3 bg-on-surface group-hover/vol:bg-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}
