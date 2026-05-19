"use client"

import { motion } from "framer-motion"
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, ListMusic, Disc3 } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import HLS from "hls.js"
import { useNebula, setSharedAudioElement } from "@/lib/context"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function isExpectedPlayInterrupt(error: unknown) {
  if (!(error instanceof DOMException)) return false
  return error.name === "AbortError" || error.name === "NotAllowedError"
}

export function Player({ onToggleQueue }: { onToggleQueue: () => void }) {
  const {
    currentTrack, isPlaying, position, volume, repeatMode, shuffleMode,
    isHost, roomId, play, pause, seek, nextTrack, previousTrack,
    toggleRepeat, toggleShuffle, setVolume, sendBeacon,
  } = useNebula()

  const audioRef = useRef<HTMLAudioElement>(null)
  const hlsRef = useRef<HLS | null>(null)
  const [localPlaying, setLocalPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [localVolume, setLocalVolume] = useState(volume)
  const beaconInterval = useRef<any>(null)
  const lastSeekRef = useRef(0)

  const trackUrl = currentTrack?.stream_url || ""
  const canControlPlayback = isHost || !roomId

  useEffect(() => {
    setLocalVolume(volume)
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  // Register audio element for direct gesture-based play from selectTrack
  useEffect(() => {
    setSharedAudioElement(audioRef.current)
    return () => setSharedAudioElement(null)
  }, [])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => {
      setLocalPlaying(false)
      if (canControlPlayback) nextTrack()
    }
    const onPlay = () => setLocalPlaying(true)
    const onPause = () => setLocalPlaying(false)
    // For HLS streams, HLS.js handles errors; for regular streams, log audio errors
    const onError = () => {
      const isHlsStream = audio.src.includes(".m3u8")
      if (!isHlsStream) {
        console.error("Audio error:", audio.error?.message)
      }
    }

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("error", onError)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("error", onError)
    }
  }, [isHost, nextTrack])

  // Set audio source when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !trackUrl) return

    const isHlsStream = trackUrl.includes(".m3u8")

    if (isHlsStream) {
      if (hlsRef.current) hlsRef.current.destroy()
      if (HLS.isSupported()) {
        const hls = new HLS({
          debug: false,
        })
        hlsRef.current = hls
        
        hls.on(HLS.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            console.error("HLS fatal error:", data.type, data.reason)
          }
        })
        
        hls.loadSource(trackUrl)
        hls.attachMedia(audio)
        // HLS.js handles all loading, don't call audio.load()
      } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        // Fallback for Safari
        audio.src = trackUrl
        audio.load()
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      audio.src = trackUrl
      audio.load()
    }
  }, [trackUrl])

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  // Play/pause sync for host
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !trackUrl) return

    if (canControlPlayback) {
      if (isPlaying && !localPlaying) {
        audio.play().then(() => {
          setLocalPlaying(true)
        }).catch((e) => {
          if (!isExpectedPlayInterrupt(e)) {
            console.error("Host auto-play failed:", e instanceof Error ? e.message : e)
          }
        })
      } else if (!isPlaying && localPlaying) {
        audio.pause()
      }
    }
  }, [isPlaying, canControlPlayback, trackUrl, localPlaying])

  // Drift correction for host
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !canControlPlayback || !trackUrl) return
    const diff = Math.abs(audio.currentTime - (position || 0))
    if (diff > 1.5 && position > 0 && audio.currentTime > 0) {
      audio.currentTime = position
      lastSeekRef.current = Date.now()
    }
  }, [canControlPlayback, position, trackUrl])

  // Non-host: sync to remote state (set src, seek, play/pause)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !trackUrl || canControlPlayback) return

    if (isPlaying && !localPlaying) {
      const seekTo = position || 0
      if (Math.abs(audio.currentTime - seekTo) > 1) {
        audio.currentTime = seekTo
      }
      audio.play().then(() => {
        setLocalPlaying(true)
      }).catch((e) => {
        if (!isExpectedPlayInterrupt(e)) {
          console.error("Non-host play failed:", e instanceof Error ? e.message : e)
        }
      })
    } else if (!isPlaying && localPlaying) {
      audio.pause()
    }
  }, [isPlaying, position, trackUrl, canControlPlayback, localPlaying])

  // Non-host: drift correction from sync beacons
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || canControlPlayback || !trackUrl || !isPlaying) return
    const diff = Math.abs(audio.currentTime - (position || 0))
    if (diff > 2 && position > 0 && audio.currentTime > 0) {
      audio.currentTime = position
      lastSeekRef.current = Date.now()
    }
  }, [position, canControlPlayback, trackUrl, isPlaying])

  // Host: send sync beacons every 2s
  useEffect(() => {
    if (!isHost || !roomId) {
      if (beaconInterval.current) clearInterval(beaconInterval.current)
      return
    }
    beaconInterval.current = setInterval(() => {
      const audio = audioRef.current
      if (audio) {
        sendBeacon(audio.currentTime, !audio.paused)
      }
    }, 2000)
    return () => {
      if (beaconInterval.current) clearInterval(beaconInterval.current)
    }
  }, [isHost, roomId, sendBeacon])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControlPlayback) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const newPos = pct * (currentTrack?.duration || duration || 0)
    if (audioRef.current) audioRef.current.currentTime = newPos
    seek(newPos)
  }, [canControlPlayback, currentTrack?.duration, duration, seek])

  const handlePlayPause = useCallback(() => {
    if (!canControlPlayback || !trackUrl) return
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => {
        setLocalPlaying(true)
        play()
      }).catch((e) => {
        console.error("Play button failed:", e.message)
      })
    } else {
      audio.pause()
      setLocalPlaying(false)
      pause()
    }
  }, [canControlPlayback, trackUrl, play, pause])

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const vol = Math.round((x / rect.width) * 100)
    const clamped = Math.max(0, Math.min(100, vol))
    setLocalVolume(clamped)
    if (audioRef.current) audioRef.current.volume = clamped / 100
    if (canControlPlayback) setVolume(clamped)
  }, [canControlPlayback, setVolume])

  const displayTime = canControlPlayback ? currentTime : (position || 0)
  const displayDuration = currentTrack?.duration || duration || 0

  return (
    <div className="w-full bg-surface-container-high/60 backdrop-blur-3xl rounded-3xl p-6 flex flex-col border border-outline/20 shadow-2xl relative overflow-hidden group">
      <audio ref={audioRef} preload="auto" />

      <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px] -z-10 group-hover:bg-primary/10 transition-colors duration-1000" />

      <motion.div whileHover={{ scale: 1.02 }}
        className="w-full aspect-square rounded-2xl overflow-hidden mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative">
        {currentTrack?.thumbnail ? (
          <img src={currentTrack.thumbnail} alt={currentTrack.title} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
            <Disc3 size={64} className="text-on-surface-variant/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {canControlPlayback && (
          <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onToggleQueue}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary/80 transition-colors">
              <ListMusic size={18} />
            </button>
          </div>
        )}
      </motion.div>

      <div className="flex flex-col items-center text-center mb-6">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight">
          {currentTrack?.title || "No Track"}
        </h2>
        <p className="text-sm text-on-surface-variant mt-1 font-medium">
          {currentTrack?.artist || "Select a track to play"}
          {currentTrack?.album ? ` • ${currentTrack.album}` : ""}
        </p>
      </div>

      <div className="flex flex-col space-y-2 mb-6">
        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden cursor-pointer flex group/progress"
          onClick={canControlPlayback ? handleSeek : undefined}>
          <div className="h-full bg-gradient-to-r from-primary to-secondary relative transition-all duration-200"
            style={{ width: `${displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-[0_0_10px_white]" />
          </div>
        </div>
        <div className="flex justify-between text-[11px] font-bold tracking-wider text-on-surface-variant">
          <span>{formatTime(displayTime)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 mb-6">
        <button onClick={canControlPlayback ? toggleShuffle : undefined}
          className={`transition-colors ${shuffleMode ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
          <Shuffle size={20} />
        </button>
        <div className="flex items-center space-x-4">
          <button onClick={canControlPlayback ? previousTrack : undefined}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors">
            <SkipBack size={24} fill="currentColor" />
          </button>

          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            {(canControlPlayback ? localPlaying : isPlaying)
              ? <Pause size={28} fill="currentColor" />
              : <Play size={28} fill="currentColor" className="ml-1.5" />}
          </motion.button>

          <button onClick={canControlPlayback ? nextTrack : undefined}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors">
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>
        <button onClick={canControlPlayback ? toggleRepeat : undefined}
          className={`transition-colors ${repeatMode !== "off" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
          <Repeat size={20} />
        </button>
      </div>

      <div className="flex items-center space-x-3 text-on-surface-variant mt-auto">
        <Volume2 size={16} />
        <div className="h-1 flex-1 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer group/vol"
          onClick={handleVolumeChange}>
          <div className="h-full bg-on-surface group-hover/vol:bg-primary transition-colors"
            style={{ width: `${localVolume}%` }} />
        </div>
      </div>
    </div>
  )
}
