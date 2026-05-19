"use client";

import { motion } from "framer-motion";
import { Play, TrendingUp, Sparkles, Headphones } from "lucide-react";

export function MainView() {
  const cards = [
    { title: "Neon Genesis", subtitle: "Synthwave Essentials", img: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=400&fit=crop" },
    { title: "Deep Focus", subtitle: "Flow state beats", img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop" },
    { title: "Midnight Drive", subtitle: "Late night cruising", img: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=400&h=400&fit=crop" },
  ];

  const tracks = [
    { title: "Starboy", artist: "The Weeknd", duration: "3:50", trending: true },
    { title: "Blinding Lights", artist: "The Weeknd", duration: "3:20", trending: false },
    { title: "Levitating", artist: "Dua Lipa", duration: "3:23", trending: true },
    { title: "As It Was", artist: "Harry Styles", duration: "2:47", trending: false },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-hide flex flex-col space-y-12">
      
      {/* Immersive Hero Section */}
      <div className="relative w-full h-[40vh] min-h-[300px] rounded-[2.5rem] overflow-hidden shadow-2xl group">
        <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=600&fit=crop" alt="Hero" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" />
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        
        <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between z-10">
          <div className="max-w-xl">
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center space-x-2 bg-primary/20 text-primary backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
               <Sparkles size={14} />
               <span>Curated for you</span>
             </motion.div>
             <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2 leading-none">
               Sonic <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Voyage</span>
             </motion.h1>
             <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-on-surface-variant text-lg max-w-md">
               Dive into a handpicked selection of spatial audio and deep house grooves.
             </motion.p>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_40px_rgba(59,130,246,0.6)]"
          >
            <Play size={28} className="ml-1" fill="currentColor" />
          </motion.button>
        </div>
      </div>

      {/* Grid Layout for Playlists */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
          <Headphones className="mr-3 text-secondary" /> Soundscapes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8 }}
              className="group relative h-48 rounded-3xl overflow-hidden cursor-pointer shadow-lg"
            >
              <img src={card.img} alt={card.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
                <p className="text-xs text-gray-300 font-medium">{card.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending Tracks */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
          <TrendingUp className="mr-3 text-primary" /> Trending Now
        </h2>
        <div className="bg-surface-container/30 backdrop-blur-md rounded-3xl border border-outline/10 p-2">
          {tracks.map((track, idx) => (
            <div key={idx} className="flex items-center p-3 rounded-2xl hover:bg-surface-container-high transition-colors group cursor-pointer">
              <div className="w-10 text-center text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                {idx + 1}
              </div>
              <div className="w-12 h-12 bg-surface-container-highest rounded-xl mr-4 overflow-hidden relative">
                <img src={`https://picsum.photos/seed/${idx*100}/100/100`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt=""/>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                  <Play size={16} className="text-white" fill="currentColor" />
                </div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">{track.title}</div>
                <div className="text-xs text-on-surface-variant font-medium">{track.artist}</div>
              </div>
              {track.trending && (
                <div className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-wider mr-4">
                  Hot
                </div>
              )}
              <div className="text-sm font-medium text-on-surface-variant w-12 text-right pr-4">{track.duration}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
