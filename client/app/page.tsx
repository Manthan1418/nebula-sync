"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "../components/Sidebar"
import { Player } from "../components/Player"
import { MainView } from "../components/MainView"
import { RoomView } from "../components/RoomView"
import { QueueView } from "../components/QueueView"
import { AnimatePresence } from "framer-motion"
import { useNebula, setSharedAudioElement, getSharedAudioElement } from "@/lib/context"
import { Users, Disc3 } from "lucide-react"

export default function Home() {
  const [showQueue, setShowQueue] = useState(false)
  const [showMobilePanel, setShowMobilePanel] = useState(false)
  const [rightTab, setRightTab] = useState<"player" | "room">("room")
  const [activeView, setActiveView] = useState("Home")
  const { roomId, currentTrack } = useNebula()

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
  if (typeof window !== "undefined" && sharedAudioRef.current && !getSharedAudioElement()) {
    setSharedAudioElement(sharedAudioRef.current)
  }
  useEffect(() => {
    if (sharedAudioRef.current) setSharedAudioElement(sharedAudioRef.current)
    return () => setSharedAudioElement(null)
  }, [])

  return (
    <div className="h-screen w-full bg-background text-on-surface selection:bg-primary/30 flex relative overflow-hidden">
      <audio ref={sharedAudioRef} preload="auto" />
      <div className="fixed top-[-15%] right-[-10%] w-[40%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[35%] h-[45%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] left-[30%] w-[20%] h-[30%] rounded-full bg-tertiary/5 blur-[100px] pointer-events-none" />
      <div className="hidden md:flex">
        <Sidebar active={activeView} onNavChange={setActiveView} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <MainView view={
          activeView === "Rooms" ? "rooms" :
          activeView === "Library" ? "library" :
          undefined
        } />
      </div>

      {rightPanelContent && (
        <div className="hidden md:flex w-80 flex-shrink-0 border-l border-outline/10">
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

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-surface-container-high/90 backdrop-blur-xl border-t border-outline/10 flex items-center px-3">
        <button onClick={() => setActiveView("Home")}
          className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === "Home" ? "text-primary" : "text-on-surface-variant"}`}>
          Home
        </button>
        <button onClick={() => setActiveView("Library")}
          className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === "Library" ? "text-primary" : "text-on-surface-variant"}`}>
          Library
        </button>
        <button onClick={() => setActiveView("Rooms")}
          className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === "Rooms" ? "text-primary" : "text-on-surface-variant"}`}>
          Rooms
        </button>
        <button onClick={() => setShowMobilePanel(!showMobilePanel)}
          className="flex-1 py-2 text-center flex flex-col items-center justify-center text-on-surface-variant">
          {currentTrack ? (
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 rounded bg-surface-container-highest overflow-hidden">
                <img src={currentTrack.thumbnail || ""} className="w-full h-full object-cover" alt="" />
              </div>
            </div>
          ) : (
            <Disc3 size={18} />
          )}
          <span className="text-[9px] mt-0.5 text-on-surface-variant">Now Playing</span>
        </button>
      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {showMobilePanel && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col">
            <div className="flex-1 bg-black/50" onClick={() => setShowMobilePanel(false)} />
            <div className="h-[65vh] flex-shrink-0 flex flex-col bg-surface-container-high rounded-t-2xl border-t border-outline/10 overflow-hidden">
              {currentTrack && (
                <div className="flex-1 overflow-y-auto">
                  <Player />
                </div>
              )}
              {roomId && (
                <div className="flex-1 min-h-0 border-t border-outline/10">
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
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Queue overlay */}
      <AnimatePresence>
        {showQueue && <QueueView onClose={() => setShowQueue(false)} />}
      </AnimatePresence>
    </div>
  )
}
