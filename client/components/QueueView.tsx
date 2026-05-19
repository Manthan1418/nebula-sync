"use client";

import { motion } from "framer-motion";
import { X, GripVertical, Play } from "lucide-react";

export function QueueView({ onClose }: { onClose: () => void }) {
  const queue = [
    { title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", time: "4:03", active: true },
    { title: "Resonance", artist: "HOME", album: "Odyssey", time: "3:32", active: false },
    { title: "Nightcall", artist: "Kavinsky", album: "OutRun", time: "4:19", active: false },
    { title: "A Real Hero", artist: "College, Electric Youth", album: "Drive OST", time: "4:27", active: false },
    { title: "Under Your Spell", artist: "Desire", album: "Desire", time: "4:52", active: false },
  ];

  return (
    <motion.div 
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute bottom-24 right-6 w-96 max-h-[60vh] bg-surface-container-high/95 backdrop-blur-3xl border border-outline/20 rounded-2xl z-40 flex flex-col shadow-2xl overflow-hidden"
    >
      <div className="p-4 border-b border-outline/20 flex items-center justify-between bg-surface-container-highest">
        <h2 className="font-bold text-on-surface">Play Queue</h2>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        <div className="px-3 pb-2 pt-1 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Now Playing
        </div>
        {queue.filter(q => q.active).map((track, idx) => (
          <div key={`now-${idx}`} className="flex items-center p-2 rounded-lg bg-surface-container-highest mb-4 group">
            <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center mr-3 relative">
               <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop" className="w-full h-full object-cover rounded opacity-50" alt="" />
               <Play size={16} className="text-primary absolute" fill="currentColor" />
            </div>
            <div className="flex flex-col flex-1 truncate">
              <span className="text-sm font-bold text-primary truncate">{track.title}</span>
              <span className="text-xs text-on-surface-variant truncate">{track.artist}</span>
            </div>
            <span className="text-xs text-on-surface-variant ml-2">{track.time}</span>
          </div>
        ))}

        <div className="px-3 pb-2 pt-1 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Next Up
        </div>
        {queue.filter(q => !q.active).map((track, idx) => (
          <div key={`next-${idx}`} className="flex items-center p-2 rounded-lg hover:bg-surface-container transition-colors group cursor-pointer">
            <div className="w-8 flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
              <Play size={14} fill="currentColor" className="text-on-surface hover:text-primary" />
            </div>
            <div className="flex flex-col flex-1 truncate -ml-2 group-hover:ml-0 transition-all">
              <span className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{track.title}</span>
              <span className="text-xs text-on-surface-variant truncate">{track.artist}</span>
            </div>
            <span className="text-xs text-on-surface-variant ml-2">{track.time}</span>
            <div className="ml-3 text-on-surface-variant opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
              <GripVertical size={16} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
