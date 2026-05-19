"use client";

import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Player } from "../components/Player";
import { MainView } from "../components/MainView";
import { RoomView } from "../components/RoomView";
import { Search, Bell, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [showRoom, setShowRoom] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-background text-on-background overflow-hidden selection:bg-primary/30">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-surface-bright/20 to-background">
          
          {/* Top Bar */}
          <div className="h-16 w-full flex items-center justify-between px-6 z-10">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-white transition-colors opacity-50 cursor-not-allowed">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="What do you want to listen to?" 
                  className="w-80 bg-surface-container border border-transparent rounded-full py-2 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-outline/30 focus:bg-surface-container-high transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowRoom(!showRoom)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full font-semibold text-sm transition-colors border ${showRoom ? "bg-secondary text-white border-secondary" : "bg-transparent text-on-surface hover:border-outline border-outline/30"}`}
              >
                <Users size={16} />
                <span>Room</span>
              </button>
              <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors">
                <Bell size={18} />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] cursor-pointer shadow-lg shadow-primary/20">
                <img src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" alt="User" className="w-full h-full rounded-full" />
              </div>
            </div>
          </div>

          {/* Main scrollable view */}
          <MainView />

          {/* Sliding Room Sidebar */}
          <AnimatePresence>
            {showRoom && <RoomView onClose={() => setShowRoom(false)} />}
          </AnimatePresence>

        </div>
      </div>
      
      {/* Persistent Bottom Player */}
      <Player />
    </div>
  );
}
