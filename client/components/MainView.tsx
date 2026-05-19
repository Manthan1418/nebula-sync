"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Play, TrendingUp, Sparkles, Headphones, Search, Plus, ListMusic } from "lucide-react"
import { useNebula } from "@/lib/context"
import { getTrending, searchTracks } from "@/lib/api"
import type { Track } from "@/lib/types"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function MainView({ view }: { view?: string }) {
  const { currentTrack, isHost, selectTrack, addToQueue, queue } = useNebula()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Track[] | null>(null)

  useEffect(() => {
    getTrending(12).then(res => {
      if (res.success) setTracks(res.results)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    const t = setTimeout(() => {
      searchTracks(query, 12).then(res => {
        if (res.success) setSearchResults(res.results)
      })
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const displayTracks = searchResults ?? tracks
  const queuedIds = new Set(queue.map(q => q.track.id))

  if (view === "rooms") return <RoomsView />

  return (
    <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-hide flex flex-col space-y-12">
      {/* Search */}
      <div className="relative">
        <div className="group relative flex-1">
          <div className="absolute -inset-0.5 rounded-full bg-linear-to-r from-primary to-secondary blur opacity-30 transition duration-1000 group-hover:opacity-100" />
          <div className="relative flex items-center rounded-full border border-outline/30 bg-surface-container-high px-4 py-2.5">
            <Search size={18} className="mr-3 text-on-surface-variant shrink-0" />
            <input type="text" placeholder="Search tracks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-on-surface placeholder:text-on-surface-variant focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Hero - only show when not searching */}
      {!searchResults && !query && (
        <div className="relative w-full h-[35vh] min-h-64 rounded-[2.5rem] overflow-hidden shadow-2xl group">
          <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=600&fit=crop" alt="Hero"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" />
          <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/40 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between z-10">
            <div className="max-w-xl">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="inline-flex items-center space-x-2 bg-primary/20 text-primary backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
                <Sparkles size={14} /><span>Curated for you</span>
              </motion.div>
              <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2 leading-none">
                Sonic <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Voyage</span>
              </motion.h1>
              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-on-surface-variant text-lg max-w-md">
                Dive into a handpicked selection of spatial audio and deep house grooves.
              </motion.p>
            </div>
          </div>
        </div>
      )}

      {/* Trending / Search Results */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center">
          {searchResults ? (
            <><Search className="mr-3 text-primary" /> Results for "{query}"</>
          ) : (
            <><TrendingUp className="mr-3 text-primary" /> Trending Now</>
          )}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="bg-surface-container/30 backdrop-blur-md rounded-3xl border border-outline/10 p-2">
            {displayTracks.map((track, idx) => (
              <div key={track.id}
                className="flex items-center p-3 rounded-2xl hover:bg-surface-container-high transition-colors group cursor-pointer">
                <div className="w-10 text-center text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                  {idx + 1}
                </div>
                <div className="w-12 h-12 bg-surface-container-highest rounded-xl mr-4 overflow-hidden relative shrink-0">
                  {track.thumbnail ? (
                    <img src={track.thumbnail} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-surface-container-highest" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                    <Play size={16} className="text-white" fill="currentColor"
                      onClick={(e) => { e.stopPropagation(); if (isHost) selectTrack(track) }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors truncate">
                    {track.title}
                  </div>
                  <div className="text-xs text-on-surface-variant font-medium truncate">{track.artist}</div>
                </div>
                {queuedIds.has(track.id) ? (
                  <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mr-4 shrink-0">
                    Queued
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); addToQueue(track) }}
                    className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-wider mr-4 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <Plus size={14} className="inline mr-1" />Queue
                  </button>
                )}
                <div className="text-sm font-medium text-on-surface-variant w-12 text-right pr-4 shrink-0">
                  {formatTime(track.duration)}
                </div>
                {isHost && (
                  <button onClick={(e) => { e.stopPropagation(); selectTrack(track) }}
                    className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-primary/40 transition-all shrink-0"
                    title="Play now">
                    <Play size={14} fill="currentColor" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RoomsView() {
  const { roomId, users, isHost, createRoom, joinRoom, leaveRoom, error } = useNebula()
  const [name, setName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [joinName, setJoinName] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCreate = () => {
    if (!name.trim()) return
    createRoom(name.trim())
  }

  const handleJoin = () => {
    if (!joinCode.trim() || !joinName.trim()) return
    joinRoom(joinCode.trim().toUpperCase(), joinName.trim())
  }

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (roomId) {
    return (
      <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-hide">
        <div className="max-w-md mx-auto space-y-8">
          <div className="bg-surface-container-high/60 backdrop-blur-3xl rounded-3xl p-8 border border-outline/20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-on-surface mb-2">Connected to Room</h2>
              <p className="text-on-surface-variant text-sm">{isHost ? "You are the host" : "You are a listener"}</p>
            </div>

            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="px-6 py-3 bg-surface-container-highest rounded-2xl font-mono text-2xl font-bold tracking-[0.3em] text-primary">
                {roomId}
              </div>
              <button onClick={copyRoomCode}
                className="px-4 py-3 rounded-2xl bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
                Crew ({users.length})
              </h3>
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.is_host ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-on-surface">{u.name}</span>
                    </div>
                    {u.is_host && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Captain</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={leaveRoom}
              className="w-full py-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-bold">
              Leave Constellation
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-hide">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2">
            Sync <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Together</span>
          </h2>
          <p className="text-on-surface-variant">Create or join a listening constellation</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="bg-surface-container-high/60 backdrop-blur-3xl rounded-3xl p-8 border border-outline/20">
          <h3 className="text-lg font-bold text-on-surface mb-4">Create a Room</h3>
          <div className="flex flex-col space-y-3">
            <input type="text" placeholder="Your device name"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container/80 border border-outline/20 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50" />
            <button onClick={handleCreate}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm hover:opacity-90 transition-opacity">
              Launch Constellation
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline/20" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs font-bold text-on-surface-variant bg-background">or</span>
          </div>
        </div>

        <div className="bg-surface-container-high/60 backdrop-blur-3xl rounded-3xl p-8 border border-outline/20">
          <h3 className="text-lg font-bold text-on-surface mb-4">Join a Room</h3>
          <div className="flex flex-col space-y-3">
            <input type="text" placeholder="Room code"
              value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full bg-surface-container/80 border border-outline/20 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 font-mono text-center text-lg tracking-[0.3em] uppercase" />
            <input type="text" placeholder="Your device name"
              value={joinName} onChange={(e) => setJoinName(e.target.value)}
              className="w-full bg-surface-container/80 border border-outline/20 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50" />
            <button onClick={handleJoin}
              className="w-full py-3 rounded-2xl border border-primary/50 text-primary hover:bg-primary/10 transition-colors font-bold text-sm">
              Join Constellation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
