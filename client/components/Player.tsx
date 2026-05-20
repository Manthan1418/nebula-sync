"use client"

import { motion } from "framer-motion"
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle,
  Volume2, Volume1, VolumeX, Disc3, X,
} from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useNebula, getSharedAudioElement } from "@/lib/context"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function Player() {
  const {
    currentTrack, isPlaying, position, volume, repeatMode, shuffleMode,
    isHost, roomId, play, pause, seek, nextTrack, previousTrack,
    toggleRepeat, toggleShuffle, setVolume,
    queue, removeFromQueue, selectTrack,
  } = useNebula()

  const [localPlaying, setLocalPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [localVolume, setLocalVolume] = useState(volume)

  const trackUrl = currentTrack?.stream_url || ""
  const canControlPlayback = isHost || !roomId

  // Sync volume from context
  useEffect(() => {
    setLocalVolume(volume)
    const audio = getSharedAudioElement()
    if (audio) audio.volume = volume / 100
  }, [volume])

  // Read audio state from shared element
  useEffect(() => {
    const audio = getSharedAudioElement()
    if (!audio) return
    const sync = () => {
      setCurrentTime(audio.currentTime)
      setDuration(audio.duration || 0)
      setLocalPlaying(!audio.paused)
    }
    const id = setInterval(sync, 250)
    return () => clearInterval(id)
  }, [])

  const isEffectivelyPlaying = canControlPlayback ? localPlaying : isPlaying

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControlPlayback) return
    const audio = getSharedAudioElement()
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const newPos = pct * (currentTrack?.duration || duration || 0)
    audio.currentTime = newPos
    seek(newPos)
  }, [canControlPlayback, currentTrack?.duration, duration, seek])

  const handlePlayPause = useCallback(() => {
    if (!canControlPlayback || !trackUrl) return
    const audio = getSharedAudioElement()
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => { setLocalPlaying(true); play() }).catch(() => {})
    } else {
      audio.pause(); setLocalPlaying(false); pause()
    }
  }, [canControlPlayback, trackUrl, play, pause])

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = getSharedAudioElement()
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const vol = Math.round((x / rect.width) * 100)
    const clamped = Math.max(0, Math.min(100, vol))
    setLocalVolume(clamped)
    audio.volume = clamped / 100
    if (canControlPlayback) setVolume(clamped)
  }, [canControlPlayback, setVolume])

  const displayTime = canControlPlayback ? currentTime : (position || 0)
  const displayDuration = currentTrack?.duration || duration || 0
  const progressPct = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0
  const VolumeIcon = localVolume === 0 ? VolumeX : localVolume < 50 ? Volume1 : Volume2

  // Keep UI synced when track/props change from other Player instance
  useEffect(() => {
    const audio = getSharedAudioElement()
    if (!audio) return
    setCurrentTime(audio.currentTime)
    setDuration(audio.duration || 0)
    setLocalPlaying(!audio.paused)
  }, [currentTrack?.id])

  if (!currentTrack) return null

  return (
    <div className="h-full w-full flex flex-col bg-surface-container-high/30 p-4 select-none">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-5 shadow-xl shadow-black/30 group">
        {currentTrack.thumbnail ? (
          <img src={currentTrack.thumbnail} alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
            <Disc3 size={48} className="text-on-surface-variant/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
          className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg">
          {isEffectivelyPlaying
            ? <Pause size={20} fill="currentColor" />
            : <Play size={20} fill="currentColor" className="ml-1" />}
        </motion.button>
      </div>

      <div className="mb-5">
        <h2 className="text-base font-bold font-space-grotesk text-on-surface truncate">
          {currentTrack.title}
        </h2>
        <p className="text-sm text-on-surface-variant truncate mt-0.5">
          {currentTrack.artist}
        </p>
      </div>

      <div className="mb-5 space-y-1.5">
        <div
          onClick={canControlPlayback ? handleSeek : undefined}
          className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden cursor-pointer group/progress">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary relative transition-all duration-200"
            style={{ width: `${progressPct}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/progress:opacity-100 shadow-lg" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-medium text-on-surface-variant">
          <span>{formatTime(displayTime)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={canControlPlayback ? toggleShuffle : undefined}
          className={`p-2 rounded-xl transition-all ${shuffleMode ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"}`}>
          <Shuffle size={16} />
        </button>

        <button onClick={canControlPlayback ? previousTrack : undefined}
          className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <SkipBack size={20} fill="currentColor" />
        </button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/30">
          {isEffectivelyPlaying
            ? <Pause size={24} fill="currentColor" />
            : <Play size={24} fill="currentColor" className="ml-1" />}
        </motion.button>

        <button onClick={canControlPlayback ? nextTrack : undefined}
          className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <SkipForward size={20} fill="currentColor" />
        </button>

        <button onClick={canControlPlayback ? toggleRepeat : undefined}
          className={`p-2 rounded-xl transition-all ${repeatMode !== "off" ? "text-primary bg-primary/10" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"}`}>
          <Repeat size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide -mx-4 px-4">
        {queue.length > 0 && (
          <div className="space-y-0.5 py-2">
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1 pb-1.5">
              Up Next ({queue.length})
            </div>
            {queue.map((item, idx) => (
              <div key={`${item.track.id}-${idx}`}
                className="flex items-center p-1.5 rounded-xl hover:bg-surface-container/50 transition-colors group cursor-pointer"
                onClick={() => selectTrack(item.track)}>
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest overflow-hidden mr-2 flex-shrink-0">
                  {item.track.thumbnail ? (
                    <img src={item.track.thumbnail} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 size={10} className="text-on-surface-variant/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-on-surface truncate">{item.track.title}</div>
                  <div className="text-[10px] text-on-surface-variant truncate">{item.track.artist}</div>
                </div>
                <span className="text-[10px] text-on-surface-variant mr-1">{formatTime(item.track.duration)}</span>
                {isHost && (
                  <button onClick={(e) => { e.stopPropagation(); removeFromQueue(item.track.id) }}
                    className="p-1 text-on-surface-variant/40 hover:text-error opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 space-y-2 pt-2 border-t border-outline/10">
        <div className="flex items-center space-x-3 px-1">
          <VolumeIcon size={14} className="text-on-surface-variant flex-shrink-0" />
          <div
            onClick={handleVolumeChange}
            className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer group/vol">
            <div
              className="h-full rounded-full bg-on-surface-variant group-hover/vol:bg-primary transition-colors"
              style={{ width: `${localVolume}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
