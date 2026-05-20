"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import {
  Play, Search, Plus, Music, Radio, Copy, Check,
  LogOut, Users, Disc3, Sparkles,
} from "lucide-react"
import { useNebula } from "@/lib/context"
import { getTrending, getNewReleases, searchTracks } from "@/lib/api"
import type { Track } from "@/lib/types"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function TrackCard({ track, idx, queuedIds, canPlayLocally, isCurrent, onPlay, onQueue }: {
  track: Track; idx: number; queuedIds: Set<string>; canPlayLocally: boolean;
  isCurrent: boolean; onPlay: (t: Track) => void; onQueue: (t: Track) => void;
}) {
  return (
    <motion.div key={track.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="relative group/card cursor-pointer">
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg shadow-black/30 bg-surface-container-highest">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt={track.title}
            className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={32} className="text-on-surface-variant/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onPlay(track) }}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0 hover:bg-white/30">
          <Play size={18} fill="currentColor" className="ml-0.5" />
        </motion.button>
        {isCurrent && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider">
            Now Playing
          </div>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <div className="text-sm font-semibold text-on-surface truncate leading-tight">{track.title}</div>
        <div className="text-xs text-on-surface-variant truncate mt-0.5">{track.artist}</div>
      </div>
      {!isCurrent && !queuedIds.has(track.id) ? (
        <button onClick={(e) => { e.stopPropagation(); onQueue(track) }}
          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-primary hover:bg-black/60 transition-all opacity-0 group-hover/card:opacity-100">
          <Plus size={14} />
        </button>
      ) : !isCurrent && queuedIds.has(track.id) ? (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-bold text-primary">
          Queued
        </div>
      ) : null}
    </motion.div>
  )
}

function TrackRow({ track, idx, queuedIds, canPlayLocally, onPlay, onQueue }: {
  track: Track; idx: number; queuedIds: Set<string>; canPlayLocally: boolean;
  onPlay: (t: Track) => void; onQueue: (t: Track) => void;
}) {
  return (
    <motion.div key={track.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="flex items-center p-2 rounded-xl hover:bg-surface-container transition-colors group cursor-pointer"
      onClick={() => onPlay(track)}>
      <span className="w-6 text-xs text-on-surface-variant font-medium text-center">{idx + 1}</span>
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-highest mx-3 flex-shrink-0">
        {track.thumbnail ? (
          <img src={track.thumbnail} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={14} className="text-on-surface-variant/30" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-on-surface truncate">{track.title}</div>
        <div className="text-xs text-on-surface-variant truncate">{track.artist}</div>
      </div>
      {queuedIds.has(track.id) ? (
        <span className="text-[10px] font-bold text-primary mr-3 flex-shrink-0">Queued</span>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onQueue(track) }}
          className="mr-2 p-1.5 text-on-surface-variant/40 hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <Plus size={14} />
        </button>
      )}
      <span className="text-xs text-on-surface-variant w-10 text-right flex-shrink-0">{formatTime(track.duration)}</span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={(e) => { e.stopPropagation(); onPlay(track) }}
        className="ml-2 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 hover:bg-primary/30">
        <Play size={12} fill="currentColor" />
      </motion.button>
    </motion.div>
  )
}

function SectionHeader({ icon: Icon, title, action }: { icon: any; title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold font-space-grotesk text-on-surface flex items-center">
        <Icon size={18} className="mr-2 text-primary" />
        {title}
      </h2>
      {action && (
        <button onClick={action.onClick}
          className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-wider">
          {action.label}
        </button>
      )}
    </div>
  )
}

export function MainView({ view }: { view?: string }) {
  const { currentTrack, roomId, isHost, selectTrack, addToQueue, queue } = useNebula()
  const queuedIds = new Set(queue.map(q => q.track.id))
  const canPlayLocally = !roomId || isHost

  if (view === "rooms") return <RoomsView />
  if (view === "library") return <LibraryView />
  return <HomeView />
}

function HomeView() {
  const { currentTrack, isHost, roomId, selectTrack, addToQueue, queue, recentTracks } = useNebula()
  const [tracks, setTracks] = useState<Track[]>([])
  const [releases, setReleases] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Track[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchIdRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const queuedIds = new Set(queue.map(q => q.track.id))
  const canPlayLocally = !roomId || isHost

  useEffect(() => {
    Promise.all([
      getTrending(12),
      getNewReleases(8, "Hindi"),
    ]).then(([tr, nr]) => {
      if (tr.success) setTracks(tr.results)
      if (nr.success) setReleases(nr.results)
      setLoading(false)
    }).catch(() => {
      setError("Could not load tracks")
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!query.trim()) { setSearchResults(null); setSearchLoading(false); return }
    setSearchLoading(true)
    const id = ++searchIdRef.current
    const t = setTimeout(async () => {
      try {
        const res = await searchTracks(query, 24)
        if (id === searchIdRef.current) {
          if (res.success) setSearchResults(res.results)
          setSearchLoading(false)
        }
      } catch {
        if (id === searchIdRef.current) setSearchLoading(false)
      }
    }, 500)
    return () => { clearTimeout(t); setSearchLoading(false) }
  }, [query])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "morning"
    if (h < 18) return "afternoon"
    return "evening"
  }

  const isSearching = !!query && (searchResults !== null || searchLoading)

  return (
    <div className="h-full flex flex-col">
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-primary/15 via-secondary/5 to-surface-container-lowest flex-shrink-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[60%] rounded-full bg-secondary/10 blur-[80px]" />
        <div className="relative z-10 px-6 pt-8 pb-8">
          <div className="group relative max-w-2xl">
            <div className="relative flex items-center bg-surface-container border border-outline/20 rounded-full px-5 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-lg shadow-black/20">
              <Search size={18} className="mr-3 text-on-surface-variant shrink-0" />
              <input ref={inputRef} type="text"
                placeholder="What do you want to listen to?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none" />
              {query && (
                <button onClick={() => { setQuery(""); setSearchResults(null) }}
                  className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>
          {!isSearching && (
            <div className="mt-6">
              <h1 className="text-3xl md:text-4xl font-black font-space-grotesk text-on-surface tracking-tight mb-1">
                Good {greeting()}
              </h1>
              <p className="text-sm text-on-surface-variant">Discover something new</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-surface-container/50 rounded-2xl border border-outline/10 p-8 text-center">
            <Music size={32} className="mx-auto mb-3 text-on-surface-variant/30" />
            <p className="text-sm text-on-surface-variant">{error}</p>
          </div>
        ) : isSearching ? (
          <>
            <SectionHeader icon={Search} title={`Results for "${query}"`} />
            {searchLoading ? (
              <div className="bg-surface-container/20 rounded-2xl border border-outline/5 p-2 space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center p-2 animate-pulse">
                    <div className="w-6 h-4 bg-surface-container-highest rounded" />
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest mx-3 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-container-highest rounded w-3/5" />
                      <div className="h-2.5 bg-surface-container-highest rounded w-2/5" />
                    </div>
                    <div className="w-10 h-3 bg-surface-container-highest rounded" />
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest ml-2" />
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
                <Search size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs mt-1 opacity-60">Try a different search term</p>
              </div>
            ) : (
              <div className="bg-surface-container/20 rounded-2xl border border-outline/5 p-2">
                {searchResults?.map((track, idx) => (
                  <TrackRow key={track.id} track={track} idx={idx}
                    queuedIds={queuedIds} canPlayLocally={canPlayLocally}
                    onPlay={selectTrack} onQueue={addToQueue} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {recentTracks.length > 0 && (
              <>
                <SectionHeader icon={Disc3} title="Recently Played" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {recentTracks.map((track, idx) => (
                    <TrackCard key={track.id} track={track} idx={idx}
                      queuedIds={queuedIds} canPlayLocally={canPlayLocally}
                      isCurrent={currentTrack?.id === track.id}
                      onPlay={selectTrack} onQueue={addToQueue} />
                  ))}
                </div>
              </>
            )}

            <SectionHeader icon={Sparkles} title="Trending" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {tracks.slice(0, 6).map((track, idx) => (
                <TrackCard key={track.id} track={track} idx={idx}
                  queuedIds={queuedIds} canPlayLocally={canPlayLocally}
                  isCurrent={currentTrack?.id === track.id}
                  onPlay={selectTrack} onQueue={addToQueue} />
              ))}
            </div>

            <SectionHeader icon={Sparkles} title="New Releases" />
            {releases.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {releases.map((track, idx) => (
                  <TrackCard key={track.id} track={track} idx={idx}
                    queuedIds={queuedIds} canPlayLocally={canPlayLocally}
                    isCurrent={currentTrack?.id === track.id}
                    onPlay={selectTrack} onQueue={addToQueue} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function LibraryView() {
  const { currentTrack, roomId, isHost, selectTrack, addToQueue, queue, recentTracks } = useNebula()
  const queuedIds = new Set(queue.map(q => q.track.id))
  const canPlayLocally = !roomId || isHost

  return (
    <div className="h-full flex flex-col">
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-primary/15 via-secondary/5 to-surface-container-lowest flex-shrink-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative z-10 px-6 pt-10 pb-8">
          <h1 className="text-3xl font-black font-space-grotesk text-on-surface tracking-tight mb-1">Library</h1>
          <p className="text-sm text-on-surface-variant">Your collection</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide space-y-6">
        {recentTracks.length > 0 ? (
          <>
            <SectionHeader icon={Disc3} title="Recently Played" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {recentTracks.map((track, idx) => (
                <TrackCard key={track.id} track={track} idx={idx}
                  queuedIds={queuedIds} canPlayLocally={canPlayLocally}
                  isCurrent={currentTrack?.id === track.id}
                  onPlay={selectTrack} onQueue={addToQueue} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <Disc3 size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No saved tracks yet</p>
            <p className="text-xs mt-1 opacity-60">Tracks you play will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RoomsView() {
  const { roomId, users, isHost, createRoom, joinRoom, leaveRoom, error, connected } = useNebula()
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
      <div className="h-full flex flex-col">
        <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-primary/15 via-secondary/5 to-surface-container-lowest flex-shrink-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full bg-primary/10 blur-[100px]" />
          <div className="relative z-10 px-6 pt-8 pb-8">
            <h1 className="text-3xl font-black font-space-grotesk text-on-surface tracking-tight mb-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Constellation</span> Active
            </h1>
            <p className="text-sm text-on-surface-variant">{isHost ? "You are the host" : "You are connected as a listener"}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide">
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-surface-container/60 backdrop-blur rounded-2xl border border-outline/10 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Room Code</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-2xl font-bold tracking-[0.25em] text-on-surface">{roomId}</span>
                    <button onClick={copyRoomCode}
                      className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors">
                      {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${connected ? "bg-primary" : "bg-error"}`} />
                  <span className="text-xs text-on-surface-variant">{connected ? "Live" : "Offline"}</span>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                  Crew ({users.length})
                </p>
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container/50">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          u.is_host ? "bg-primary text-black" : "bg-surface-container-highest text-on-surface-variant"
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-on-surface truncate block">{u.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{u.is_host ? "Host" : "Listener"}</span>
                        </div>
                      </div>
                      {u.is_host && (
                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Captain</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={leaveRoom}
                className="w-full py-2.5 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors text-sm font-bold flex items-center justify-center space-x-2">
                <LogOut size={14} />
                <span>Leave Constellation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-primary/15 via-secondary/5 to-surface-container-lowest flex-shrink-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative z-10 px-6 pt-8 pb-8">
          <h1 className="text-3xl md:text-4xl font-black font-space-grotesk text-on-surface tracking-tight mb-1">
            Sync <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Together</span>
          </h1>
          <p className="text-sm text-on-surface-variant">Create or join a listening constellation</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide">
        <div className="max-w-lg mx-auto space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center">{error}</div>
          )}

          <div className="bg-surface-container/60 backdrop-blur rounded-2xl border border-outline/10 p-5">
            <h3 className="text-base font-bold font-space-grotesk text-on-surface mb-4 flex items-center">
              <Radio size={16} className="mr-2 text-primary" />
              Create a Room
            </h3>
            <div className="flex flex-col space-y-3">
              <input type="text" placeholder="Your device name"
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/50 transition-colors" />
              <button onClick={handleCreate}
                className="w-full py-2.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary-hover transition-colors">
                Launch Constellation
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline/10" /></div>
            <div className="relative flex justify-center"><span className="px-3 text-xs font-bold text-on-surface-variant bg-background">or</span></div>
          </div>

          <div className="bg-surface-container/60 backdrop-blur rounded-2xl border border-outline/10 p-5">
            <h3 className="text-base font-bold font-space-grotesk text-on-surface mb-4 flex items-center">
              <Users size={16} className="mr-2 text-primary" />
              Join a Room
            </h3>
            <div className="flex flex-col space-y-3">
              <input type="text" placeholder="Room code"
                value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/50 transition-colors font-mono text-center text-xl tracking-[0.3em] uppercase" />
              <input type="text" placeholder="Your device name"
                value={joinName} onChange={(e) => setJoinName(e.target.value)}
                className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/50 transition-colors" />
              <button onClick={handleJoin}
                className="w-full py-2.5 rounded-xl border border-primary/40 text-primary font-bold text-sm hover:bg-primary/10 transition-colors">
                Join Constellation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
