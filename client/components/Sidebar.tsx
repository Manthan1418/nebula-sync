"use client";

import { Home, Search, Library, PlusCircle, Users } from "lucide-react";
import { motion } from "framer-motion";

export function Sidebar() {
  const navItems = [
    { icon: Home, label: "Home" },
    { icon: Search, label: "Search" },
    { icon: Library, label: "Your Library" },
  ];

  const roomItems = [
    { icon: Users, label: "Join a Room" },
    { icon: PlusCircle, label: "Create Room" },
  ];

  return (
    <div className="w-64 h-full bg-surface-container flex flex-col p-4 space-y-6">
      <div className="text-primary font-bold text-2xl tracking-tighter mb-4 px-2">
        Lumina<span className="text-secondary">Sonic</span>
      </div>

      <div className="space-y-4">
        {navItems.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-4 text-on-surface-variant hover:text-on-surface cursor-pointer p-2 rounded-lg transition-colors"
          >
            <item.icon size={24} />
            <span className="font-semibold text-sm">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-outline/30 space-y-4">
        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-2 mb-2">
          Social
        </div>
        {roomItems.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-4 text-on-surface-variant hover:text-on-surface cursor-pointer p-2 rounded-lg transition-colors"
          >
            <item.icon size={24} />
            <span className="font-semibold text-sm">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto mt-4 pt-4 border-t border-outline/30">
         {/* Playlists or active rooms could go here */}
         <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-2 mb-4">
          Your Playlists
        </div>
        <div className="space-y-2 text-sm text-on-surface-variant px-2">
          <div className="hover:text-on-surface cursor-pointer truncate transition-colors">Chill Vibes</div>
          <div className="hover:text-on-surface cursor-pointer truncate transition-colors">Deep Focus</div>
          <div className="hover:text-on-surface cursor-pointer truncate transition-colors">Synthwave 2026</div>
          <div className="hover:text-on-surface cursor-pointer truncate transition-colors">Late Night Coding</div>
        </div>
      </div>
    </div>
  );
}
