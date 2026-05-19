"use client";

import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Player } from "../components/Player";
import { MainView } from "../components/MainView";
import { RoomView } from "../components/RoomView";
import { QueueView } from "../components/QueueView";
import { Bell, Mic, Search, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [showQueue, setShowQueue] = useState(false);
  const [showMobileRoom, setShowMobileRoom] = useState(false);

  return (
    <div className="relative isolate h-screen w-full overflow-hidden bg-background text-on-background selection:bg-primary/30">
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-secondary/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col md:flex-row">
        <div className="fixed bottom-0 left-0 z-50 h-17.5 w-full md:relative md:h-full md:w-auto">
          <Sidebar />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden px-3 py-4 pb-40 md:px-8 md:py-8 md:pb-8">
          <div className="mb-4 flex h-16 w-full items-center justify-between px-1 md:px-0">
            <div className="group relative flex-1 max-w-md md:w-96">
              <div className="absolute -inset-0.5 rounded-full bg-linear-to-r from-primary to-secondary blur opacity-30 transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
              <div className="relative flex items-center rounded-full border border-outline/30 bg-surface-container-high px-4 py-2">
                <Search size={18} className="mr-3 text-on-surface-variant transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-transparent text-sm font-medium text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                />
                <Mic size={16} className="ml-2 hidden cursor-pointer text-on-surface-variant hover:text-on-surface md:block" />
              </div>
            </div>

            <div className="ml-4 flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setShowMobileRoom(!showMobileRoom)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline/20 bg-surface-container-high text-on-surface transition-all hover:text-white md:hidden"
              >
                <Users size={18} />
              </button>
              <button className="hidden h-10 w-10 items-center justify-center rounded-full border border-outline/20 bg-surface-container-high text-on-surface-variant transition-all hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] md:flex">
                <Bell size={18} />
              </button>
              <div className="h-9 w-9 cursor-pointer rounded-full bg-linear-to-tr from-primary to-secondary p-0.5 shadow-lg shadow-primary/20 transition-transform hover:scale-105 md:h-10 md:w-10">
                <img
                  src="https://ui-avatars.com/api/?name=U&background=2b2320&color=d4a373"
                  alt="User"
                  className="h-full w-full rounded-full border-2 border-surface"
                />
              </div>
            </div>
          </div>

          <MainView />
        </div>

        <div className="pointer-events-none fixed bottom-4 left-2 right-2 z-40 flex flex-col md:relative md:bottom-auto md:left-auto md:right-auto md:w-96 md:shrink-0 md:py-8 md:pr-4 md:pointer-events-auto">
          <div className="pointer-events-auto flex h-full w-full flex-col">
            <Player onToggleQueue={() => setShowQueue(!showQueue)} />

            <div className="mt-4 hidden flex-1 md:flex">
              <RoomView />
            </div>
          </div>

          <AnimatePresence>
            {showMobileRoom && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="absolute bottom-0 left-0 right-0 z-50 flex h-[60vh] pointer-events-auto md:hidden"
              >
                <RoomView onClose={() => setShowMobileRoom(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showQueue && <QueueView onClose={() => setShowQueue(false)} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
