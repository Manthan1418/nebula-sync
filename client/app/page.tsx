"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "../components/Sidebar"
import { Player, AudioEngine } from "../components/Player"
import { MainView } from "../components/MainView"
import { RoomView } from "../components/RoomView"
import { QueueView } from "../components/QueueView"
import { AnimatePresence, motion } from "framer-motion"
import { useNebula, setSharedAudioElement, getSharedAudioElement } from "@/lib/context"
import { Play, Pause, Disc3 } from "lucide-react"

export default function Home() {
  const [showQueue, setShowQueue] = useState(false)
  const [showMobilePanel, setShowMobilePanel] = useState(false)
  const [rightTab, setRightTab] = useState<"player" | "room">("room")
  const [activeView, setActiveView] = useState("Home")
  const { roomId, currentTrack, isPlaying, play, pause } = useNebula()

  useEffect(() => {
    if (roomId) setActiveView("Rooms")
  }, [roomId])

  useEffect(() => {
    if (currentTrack) setRightTab("player")
  }, [currentTrack])

  const rightPanelContent = rightTab === "player" && currentTrack
    ? { component: Player, props: {} }
    : roomId
    ? { component: RoomView, props: {} }
    : null

  const sharedAudioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    if (sharedAudioRef.current) setSharedAudioElement(sharedAudioRef.current)
    return () => setSharedAudioElement(null)
  }, [])

  return (
    <div className="h-screen w-full bg-background text-on-surface selection:bg-primary/30 flex relative overflow-hidden">
      <audio ref={sharedAudioRef} preload="auto" />
      <AudioEngine />
      <div className="fixed top-[-15%] right-[-10%] w-[40%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[35%] h-[45%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] left-[30%] w-[20%] h-[30%] rounded-full bg-tertiary/5 blur-[100px] pointer-events-none" />
      <div className="hidden md:flex">
        <Sidebar active={activeView} onNavChange={setActiveView} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
        <MainView view={
          activeView === "Rooms" ? "rooms" :
          activeView === "Library" ? "library" :
          undefined
        } />
      </div>

      {rightPanelContent && (
        <div className="hidden md:flex w-80 shrink-0 border-l border-outline/10">
          {rightTab === "player" && currentTrack ? (
            <div className="h-full w-full flex flex-col">
              <Player />
              {roomId && (
                <div className="flex-1 min-h-0 border-t border-outline/10">
                  <RoomView />
                </div>
              )}
            </div>
          ) : roomId ? (
            <RoomView />
          ) : null}
        </div>
      )}

      {/* Mobile mini-player bar */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-2"
            onClick={() => setShowMobilePanel(true)}>
            <div className="bg-surface-container-high/95 backdrop-blur-xl rounded-xl border border-outline/10 shadow-xl shadow-black/30 flex items-center px-3 py-2.5 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-highest shrink-0 shadow-sm">
                {currentTrack.thumbnail ? (
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 size={16} className="text-on-surface-variant/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 mx-3">
                <div className="text-sm font-semibold text-on-surface truncate leading-tight">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-on-surface-variant truncate mt-0.5">
                  {currentTrack.artist}
                </div>
              </div>
              <button onClick={(e) => {
                e.stopPropagation()
                const audio = getSharedAudioElement()
                if (!audio) return
                if (audio.paused) {
                  audio.play().then(() => play()).catch(() => {})
                } else {
                  audio.pause(); pause()
                }
              }}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-black shrink-0 shadow-lg shadow-primary/30 active:scale-90 transition-transform">
                {isPlaying
                  ? <Pause size={16} fill="currentColor" />
                  : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-surface-container-high/90 backdrop-blur-xl border-t border-outline/10 rounded-t-xl flex items-center px-3">
        <button onClick={() => setActiveView("Home")}
          className={`flex-1 py-2 text-center rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === "Home" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
          Home
        </button>
        <button onClick={() => setActiveView("Library")}
          className={`flex-1 py-2 text-center rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === "Library" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
          Library
        </button>
        <button onClick={() => setActiveView("Rooms")}
          className={`flex-1 py-2 text-center rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === "Rooms" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
          Rooms
        </button>
      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {showMobilePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 flex flex-col">
            <div className="flex-1 bg-black/50" onClick={() => setShowMobilePanel(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-[85vh] shrink-0 flex flex-col bg-surface-container-high rounded-t-2xl border-t border-outline/10 overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center py-1.5 pointer-events-none">
                <div className="w-10 h-1 rounded-full bg-white/40" />
              </div>
              {currentTrack && (
                <div className="flex-1 flex flex-col min-h-0">
                  <Player compact />
                  {roomId && (
                    <div className="shrink-0 border-t border-outline/10">
                      <RoomView onClose={() => setShowMobilePanel(false)} />
                    </div>
                  )}
                </div>
              )}
              {!currentTrack && roomId && (
                <div className="flex-1 flex flex-col min-h-0">
                  <RoomView onClose={() => setShowMobilePanel(false)} />
                </div>
              )}
              {!currentTrack && !roomId && (
                <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm p-8 text-center">
                  <div>
                    <Disc3 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No track playing</p>
                    <p className="text-xs mt-1 opacity-60">Search and play a track to get started</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue overlay */}
      <AnimatePresence>
        {showQueue && <QueueView onClose={() => setShowQueue(false)} />}
      </AnimatePresence>
    </div>
  )
}
