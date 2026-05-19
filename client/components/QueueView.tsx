"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, GripVertical, Play, Trash2 } from "lucide-react"
import { useNebula } from "@/lib/context"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function QueueView({ onClose }: { onClose: () => void }) {
  const { queue, history, currentTrack, isHost, removeFromQueue, clearQueue, selectTrack } = useNebula()

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute bottom-24 right-6 w-96 max-h-[60vh] bg-surface-container-high/95 backdrop-blur-3xl border border-outline/20 rounded-2xl z-40 flex flex-col shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-outline/20 flex items-center justify-between bg-surface-container-highest">
        <h2 className="font-bold text-on-surface">Play Queue</h2>
        <div className="flex items-center space-x-2">
          {isHost && queue.length > 0 && (
            <button onClick={clearQueue}
              className="p-1.5 rounded-md hover:bg-surface-container transition-colors text-on-surface-variant hover:text-red-400">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {currentTrack && (
          <>
            <div className="px-3 pb-2 pt-1 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Now Playing
            </div>
            <div className="flex items-center p-2 rounded-lg bg-surface-container-highest mb-4 group">
              <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center mr-3 relative overflow-hidden">
                {currentTrack.thumbnail ? (
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover opacity-50" alt="" />
                ) : null}
                <Play size={16} className="text-primary absolute" fill="currentColor" />
              </div>
              <div className="flex flex-col flex-1 truncate">
                <span className="text-sm font-bold text-primary truncate">{currentTrack.title}</span>
                <span className="text-xs text-on-surface-variant truncate">{currentTrack.artist}</span>
              </div>
              <span className="text-xs text-on-surface-variant ml-2">{formatTime(currentTrack.duration)}</span>
            </div>
          </>
        )}

        <div className="px-3 pb-2 pt-1 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Next Up {queue.length > 0 && `(${queue.length})`}
        </div>

        {queue.length === 0 ? (
          <div className="px-3 py-6 text-center text-on-surface-variant text-sm">
            <p>Queue is empty</p>
            <p className="text-xs mt-1">Search and add tracks from the main view</p>
          </div>
        ) : (
          <AnimatePresence>
            {queue.map((item, idx) => (
              <motion.div key={`${item.track.id}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center p-2 rounded-lg hover:bg-surface-container transition-colors group cursor-pointer">
                <div className="w-8 flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={14} fill="currentColor" className="text-on-surface hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); if (isHost) selectTrack(item.track) }} />
                </div>
                <div className="flex flex-col flex-1 truncate ml-1">
                  <span className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                    {item.track.title}
                  </span>
                  <span className="text-xs text-on-surface-variant truncate">{item.track.artist}</span>
                </div>
                <span className="text-xs text-on-surface-variant ml-2">{formatTime(item.track.duration)}</span>
                {isHost && (
                  <button onClick={() => removeFromQueue(item.track.id)}
                    className="ml-2 text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {history.length > 0 && (
          <>
            <div className="px-3 pb-2 pt-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Recently Played
            </div>
            {history.slice(-5).reverse().map((track, idx) => (
              <div key={`hist-${idx}`}
                className="flex items-center p-2 rounded-lg opacity-60">
                <div className="flex flex-col flex-1 truncate ml-1">
                  <span className="text-sm text-on-surface truncate">{track.title}</span>
                  <span className="text-xs text-on-surface-variant truncate">{track.artist}</span>
                </div>
                <span className="text-xs text-on-surface-variant ml-2">{formatTime(track.duration)}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  )
}
