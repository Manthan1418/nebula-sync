"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function MainView() {
  const greeting = "Good evening";

  const recent = [
    { title: "Liked Songs", img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&h=200&fit=crop" },
    { title: "Daily Mix 1", img: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=200&h=200&fit=crop" },
    { title: "Discover Weekly", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop" },
    { title: "Release Radar", img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=200&fit=crop" },
    { title: "Synthwave 2026", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop" },
    { title: "Lofi Beats", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-32">
      <h1 className="text-3xl font-bold text-on-surface mb-6 font-[family-name:var(--font-geist-sans)] tracking-tight">{greeting}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {recent.map((item, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ scale: 1.02, backgroundColor: "var(--color-surface-container-highest)" }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center bg-surface-container-high rounded-md overflow-hidden cursor-pointer group shadow-md hover:shadow-lg transition-all"
          >
            <img src={item.img} alt={item.title} className="w-20 h-20 object-cover shadow-[4px_0_10px_rgba(0,0,0,0.3)] z-10" />
            <div className="px-4 font-semibold text-on-surface flex-1 truncate">{item.title}</div>
            <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
              <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-transform">
                <Play fill="currentColor" className="ml-1" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-on-surface mb-6">Made For You</h2>
      <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="min-w-[180px] p-4 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors group"
          >
            <div className="w-full aspect-square rounded-md overflow-hidden mb-4 relative shadow-lg">
              <img src={`https://picsum.photos/seed/${i * 10}/200/200`} alt="Cover" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:scale-110 transition-transform">
                  <Play fill="currentColor" className="ml-1 w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="font-semibold text-on-surface truncate mb-1">Daily Mix {i}</div>
            <div className="text-sm text-on-surface-variant line-clamp-2 leading-snug">
              A mix of your favorite tracks and new discoveries.
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
