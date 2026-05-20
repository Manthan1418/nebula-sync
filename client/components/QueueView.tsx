"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Play, Trash2, Disc3 } from "lucide-react"
import { useNebula } from "@/lib/context"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function QueueView({ onClose }: { onClose: () => void }) {
  const { queue, history, currentTrack, roomId, isHost, removeFromQueue, clearQueue, selectTrack } = useNebula()
  const canPlayLocally = !roomId || isHost

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 250 }}
      className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-full max-w-lg bg-surface-container-high/95 backdrop-blur-2xl border border-outline/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ maxHeight: "60vh" }}>
      <div className="flex items-center justify-between p-4 border-b border-outline/10">
        <h2 className="text-sm font-bold text-on-surface">Queue</h2>
        <div className="flex items-center space-x-2">
          {isHost && queue.length > 0 && (
            <button onClick={clearQueue}
              className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-error">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {currentTrack && (
          <>
            <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Now Playing
            </div>
            <div className="flex items-center p-2.5 rounded-xl bg-surface-container mb-3 mx-1">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
                {currentTrack.thumbnail ? (
                  <img src={currentTrack.thumbnail} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Disc3 size={16} className="text-primary" />
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold text-primary truncate">{currentTrack.title}</span>
                <span className="text-xs text-on-surface-variant truncate">{currentTrack.artist}</span>
              </div>
              <span className="text-xs text-on-surface-variant ml-2">{formatTime(currentTrack.duration)}</span>
            </div>
          </>
        )}

        <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Next Up {queue.length > 0 && `(${queue.length})`}
        </div>

        {queue.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant text-sm">
            <Disc3 size={24} className="mx-auto mb-2 opacity-30" />
            <p>Queue is empty</p>
            <p className="text-xs mt-1 opacity-60">Search and add tracks</p>
          </div>
        ) : (
          <div className="space-y-0.5 mx-1">
            <AnimatePresence>
              {queue.map((item, idx) => (
                <motion.div key={`${item.track.id}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center p-2 rounded-xl hover:bg-surface-container transition-colors group">
                  <div className="w-8 flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={12} fill="currentColor"
                      onClick={() => { if (canPlayLocally) selectTrack(item.track) }}
                      className="text-on-surface hover:text-primary cursor-pointer" />
                  </div>
                  <div className="w-9 h-9 rounded-md bg-surface-container-highest overflow-hidden mr-3 flex-shrink-0">
                    {item.track.thumbnail ? (
                      <img src={item.track.thumbnail} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 size={12} className="text-on-surface-variant/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm text-on-surface truncate">{item.track.title}</span>
                    <span className="text-xs text-on-surface-variant truncate">{item.track.artist}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant ml-2">{formatTime(item.track.duration)}</span>
                  {isHost && (
                    <button onClick={() => removeFromQueue(item.track.id)}
                      className="ml-2 p-1 text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-error transition-all">
                      <X size={12} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {history.length > 0 && (
          <>
            <div className="px-3 py-2 pt-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Recently Played
            </div>
            <div className="space-y-0.5 mx-1 pb-2">
              {history.slice(-5).reverse().map((track, idx) => (
                <div key={`hist-${idx}`}
                  className="flex items-center p-2 rounded-xl opacity-50">
                  <div className="w-9 h-9 rounded-md bg-surface-container-highest overflow-hidden mr-3 flex-shrink-0">
                    {track.thumbnail ? (
                      <img src={track.thumbnail} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 size={12} className="text-on-surface-variant/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm text-on-surface truncate">{track.title}</span>
                    <span className="text-xs text-on-surface-variant truncate">{track.artist}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant ml-2">{formatTime(track.duration)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
