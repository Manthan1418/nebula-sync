"use client";

import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Mic2, ListMusic, Volume2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QueueView } from "./QueueView";

export function Player() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  return (
    <>
      <AnimatePresence>
        {showQueue && <QueueView onClose={() => setShowQueue(false)} />}
      </AnimatePresence>

      <div className="h-24 w-full bg-surface-container-high/80 backdrop-blur-xl border-t border-outline/20 flex items-center justify-between px-6 z-50">
        
        {/* Track Info */}
        <div className="flex items-center space-x-4 w-1/3">
          <div className="w-14 h-14 bg-surface-bright rounded-md overflow-hidden relative shadow-lg shadow-black/40">
            <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" alt="Album Art" className="object-cover w-full h-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-surface truncate">Midnight City</span>
            <span className="text-xs text-on-surface-variant truncate hover:underline cursor-pointer">M83</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center justify-center space-y-2 w-1/3">
          <div className="flex items-center space-x-6">
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <Shuffle size={20} />
            </button>
            <button className="text-on-surface hover:text-primary transition-colors">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-on-surface flex items-center justify-center text-background hover:bg-primary hover:text-on-primary transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </motion.button>
            <button className="text-on-surface hover:text-primary transition-colors">
              <SkipForward size={24} fill="currentColor" />
            </button>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <Repeat size={20} />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-xs text-on-surface-variant">1:42</span>
            <div className="h-1 flex-1 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer group">
              <div className="h-full w-1/3 bg-primary group-hover:bg-secondary transition-colors relative">
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
              </div>
            </div>
            <span className="text-xs text-on-surface-variant">4:03</span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="flex items-center justify-end space-x-4 w-1/3 text-on-surface-variant">
          <button className="hover:text-on-surface transition-colors"><Mic2 size={20} /></button>
          <button onClick={() => setShowQueue(!showQueue)} className={`transition-colors ${showQueue ? "text-primary" : "hover:text-on-surface"}`}><ListMusic size={20} /></button>
          <div className="flex items-center space-x-2 w-24">
            <Volume2 size={20} />
            <div className="h-1 flex-1 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer group">
              <div className="h-full w-2/3 bg-on-surface group-hover:bg-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
