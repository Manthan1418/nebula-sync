"use client";

import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Player } from "../components/Player";
import { MainView } from "../components/MainView";
import { RoomView } from "../components/RoomView";
import { QueueView } from "../components/QueueView";
import { Search, Bell, Mic, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [showQueue, setShowQueue] = useState(false);
  const [showMobileRoom, setShowMobileRoom] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-background text-on-background overflow-hidden selection:bg-primary/30 relative">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Left Dock (Desktop) / Bottom Nav (Mobile) */}
      <div className="z-50 md:z-10 fixed bottom-0 left-0 w-full h-[70px] md:relative md:w-auto md:h-full">
        <Sidebar />
      </div>
      
      {/* Center Main Area */}
      <div className="flex-1 flex flex-col relative z-10 px-2 py-4 md:py-8 pb-[160px] md:pb-8 overflow-hidden">
        
        {/* Top Search & Actions */}
        <div className="h-16 w-full flex items-center justify-between px-4 md:px-8 mb-4">
          <div className="relative group flex-1 md:w-96 max-w-md">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-surface-container-high rounded-full px-4 py-2 border border-outline/30">
              <Search size={18} className="text-on-surface-variant mr-3 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-transparent text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant font-medium"
              />
              <Mic size={16} className="text-on-surface-variant hover:text-on-surface cursor-pointer ml-2 hidden md:block" />
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 ml-4">
            <button 
              onClick={() => setShowMobileRoom(!showMobileRoom)}
              className="md:hidden w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:text-white transition-all border border-outline/20"
            >
              <Users size={18} />
            </button>
            <button className="hidden md:flex w-10 h-10 rounded-full bg-surface-container-high items-center justify-center text-on-surface-variant hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all border border-outline/20">
              <Bell size={18} />
            </button>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] cursor-pointer shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <img src="https://ui-avatars.com/api/?name=U&background=2b2320&color=d4a373" alt="User" className="w-full h-full rounded-full border-2 border-surface" />
            </div>
          </div>
        </div>

        {/* Scrollable Main View */}
        <MainView />
      </div>

      {/* Right Side Hub (Desktop) / Floating Player Overlay (Mobile) */}
      <div className="fixed bottom-[80px] left-2 right-2 md:relative md:bottom-0 md:left-0 md:right-0 md:w-96 md:h-full md:py-8 md:pr-4 flex flex-col z-40 pointer-events-none md:pointer-events-auto">
        <div className="w-full h-full pointer-events-auto flex flex-col">
          <Player onToggleQueue={() => setShowQueue(!showQueue)} />
          
          <div className="hidden md:flex flex-1 mt-4">
            <RoomView />
          </div>
        </div>

        {/* Mobile Room Overlay */}
        <AnimatePresence>
          {showMobileRoom && (
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 h-[60vh] z-50 md:hidden pointer-events-auto flex"
            >
              <RoomView onClose={() => setShowMobileRoom(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Queue View */}
        <AnimatePresence>
          {showQueue && <QueueView onClose={() => setShowQueue(false)} />}
        </AnimatePresence>
      </div>

    </div>
  );
}
