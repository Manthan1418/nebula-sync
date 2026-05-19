"use client";

import { Home, Search, Library, Users, Disc3, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function Sidebar() {
  const [active, setActive] = useState("Home");
  const navItems = [
    { icon: Home, label: "Home" },
    { icon: Search, label: "Explore" },
    { icon: Library, label: "Library" },
    { icon: Disc3, label: "Mixes" },
    { icon: Users, label: "Rooms" },
  ];

  return (
    <div className="h-full w-full flex items-center justify-center md:py-8 md:pl-4 md:pr-2">
      <motion.div 
        className="w-full md:w-20 h-full md:h-full bg-surface-container-high/90 md:bg-surface-container-high/60 backdrop-blur-3xl md:rounded-3xl flex flex-row md:flex-col items-center justify-around md:py-8 border-t md:border border-outline/20 shadow-2xl overflow-hidden relative px-4 md:px-0"
      >
        <div className="hidden md:flex w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl items-center justify-center shadow-lg shadow-primary/30 mb-12">
          <Disc3 size={24} className="text-surface-container-lowest animate-spin-slow" />
        </div>

        <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-8 flex-1 w-full justify-around md:justify-start relative z-10">
          {navItems.map((item, idx) => {
            const isActive = active === item.label;
            return (
              <div key={idx} className="relative flex justify-center cursor-pointer group" onClick={() => setActive(item.label)}>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 md:border-r-2 md:border-b-0 border-b-2 border-primary w-full h-full rounded-lg md:rounded-none" 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-2xl transition-colors relative z-20 ${isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"}`}
                >
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
              </div>
            );
          })}
        </div>

        <motion.div
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:block text-on-surface-variant hover:text-on-surface cursor-pointer p-3 rounded-2xl mt-auto"
        >
          <Settings size={24} />
        </motion.div>
      </motion.div>
    </div>
  );
}
