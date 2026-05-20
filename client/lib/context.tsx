"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import type { Track, User, ChatMessage, QueueItem, PlaybackState, Room, WSMessage } from "./types"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"

let _audioElement: HTMLAudioElement | null = null
export function setSharedAudioElement(el: HTMLAudioElement | null) {
  _audioElement = el
}
export function getSharedAudioElement(): HTMLAudioElement | null {
  return _audioElement
}

interface NebulaState {
  roomId: string | null
  userId: string | null
  isHost: boolean
  connected: boolean
  users: User[]
  messages: ChatMessage[]
  queue: QueueItem[]
  history: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  position: number
  volume: number
  repeatMode: string
  shuffleMode: boolean
  error: string | null
  roomName: string | null
}

interface NebulaContext extends NebulaState {
  createRoom: (name: string) => Promise<void>
  joinRoom: (roomId: string, name: string) => Promise<void>
  leaveRoom: () => void
  play: () => void
  pause: () => void
  seek: (position: number) => void
  nextTrack: () => void
  previousTrack: () => void
  selectTrack: (track: Track) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (trackId: string) => void
  clearQueue: () => void
  sendMessage: (text: string) => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  setVolume: (vol: number) => void
  sendBeacon: (position: number, isPlaying: boolean) => void
}

const NebulaContext = createContext<NebulaContext | null>(null)

export function useNebula() {
  const ctx = useContext(NebulaContext)
  if (!ctx) throw new Error("useNebula must be used within NebulaProvider")
  return ctx
}

export function NebulaProvider({ children }: { children: ReactNode }) {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<any>(null)
  const stateRef = useRef<NebulaState>({
    roomId: null, userId: null, isHost: false, connected: false,
    users: [], messages: [], queue: [], history: [],
    currentTrack: null, isPlaying: false, position: 0,
    volume: 70, repeatMode: "off", shuffleMode: false,
    error: null, roomName: null,
  })

  const [state, setState] = useState<NebulaState>(stateRef.current)

  const update = useCallback((partial: Partial<NebulaState>) => {
    setState(prev => {
      const next = { ...prev, ...partial }
      stateRef.current = next
      return next
    })
  }, [])

  const connectWebSocket = useCallback((roomId: string, userId: string, userName: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.close()
    }
    const url = `${WS_URL}/ws/${roomId}?user_id=${userId}&user_name=${encodeURIComponent(userName)}`
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onopen = () => {
      update({ connected: true, error: null })
    }

    socket.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        handleMessage(msg)
      } catch (e) {
        console.error("WS parse error:", e)
      }
    }

    socket.onclose = () => {
      update({ connected: false })
    }

    socket.onerror = () => {
      update({ connected: false, error: "WebSocket connection failed" })
    }
  }, [])

  const handleMessage = useCallback((msg: WSMessage) => {
    const { type, payload } = msg
    const s = stateRef.current

    switch (type) {
      case "connected":
        update({
          userId: payload.user_id,
          roomId: payload.room_id,
          isHost: payload.is_host,
          users: payload.users || [],
          queue: payload.queue || [],
          history: payload.history || [],
          roomName: `Room ${payload.room_id}`,
        })
        if (payload.sync?.track) {
          update({
            currentTrack: payload.sync.track,
            isPlaying: payload.sync.is_playing,
            position: payload.sync.position,
          })
        }
        break
      case "user:joined":
        update({ users: payload.users || [] })
        break
      case "user:left":
        update({ users: payload.users || [] })
        if (payload.new_host) {
          update({ isHost: s.userId === payload.new_host })
        }
        break
      case "chat:message":
        update({ messages: [...s.messages, payload] })
        break
      case "queue:updated":
        update({ queue: payload.queue || [] })
        break
      case "track:changed":
        update({
          currentTrack: payload.track,
          isPlaying: payload.sync?.is_playing ?? false,
          position: payload.sync?.position ?? 0,
        })
        if (payload.sync) {
          update({
            repeatMode: payload.sync.repeat_mode || "off",
            shuffleMode: payload.sync.shuffle_mode ?? false,
            volume: payload.sync.volume ?? 70,
          })
        }
        break
      case "player:state":
        update({ isPlaying: payload.is_playing, position: payload.position })
        break
      case "player:seeked":
        update({ position: payload.position })
        break
      case "sync:state":
        if (payload.track) update({ currentTrack: payload.track })
        update({ isPlaying: payload.is_playing, position: payload.position })
        break
      case "sync:beacon":
        if (!s.isHost) {
          const latency = (Date.now() - (payload.server_time * 1000)) / 1000
          let adjustedPos = payload.position
          if (payload.is_playing && latency > 0 && latency < 2) {
            adjustedPos = payload.position + latency
          }
          update({ position: adjustedPos, isPlaying: payload.is_playing })
        }
        break
      case "room:state":
        update({
          repeatMode: payload.repeat_mode || "off",
          shuffleMode: payload.shuffle_mode ?? false,
          volume: payload.volume ?? 70,
        })
        break
      case "error":
        update({ error: payload.message })
        break
    }
  }, [])

  const send = useCallback((type: string, payload: any = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }))
    }
  }, [])

  const createRoom = useCallback(async (name: string) => {
    try {
      const res = await import("./api").then(m => m.createRoom(name))
      if (res.success) {
        const uid = res.user_id
        update({
          roomId: res.room.id, userId: uid, isHost: true,
          roomName: res.room.name, users: res.room.users,
        })
        saveToStorage({ roomId: res.room.id, roomName: res.room.name, deviceName: name, isHost: true, userId: uid })
        connectWebSocket(res.room.id, uid, name)
      }
    } catch (err: any) {
      update({ error: err.message })
    }
  }, [connectWebSocket])

  const joinRoom = useCallback(async (roomId: string, name: string) => {
    try {
      const res = await import("./api").then(m => m.joinRoom(roomId, name))
      if (res.success) {
        const uid = res.user_id!
        update({
          roomId: res.room!.id, userId: uid, isHost: false,
          roomName: res.room!.name, users: res.room!.users,
        })
        saveToStorage({ roomId: res.room!.id, roomName: res.room!.name, deviceName: name, isHost: false, userId: uid })
        connectWebSocket(res.room!.id, uid, name)
      } else {
        update({ error: res.error || "Failed to join room" })
      }
    } catch (err: any) {
      update({ error: err.message })
    }
  }, [connectWebSocket])

  const leaveRoom = useCallback(() => {
    if (ws.current) { ws.current.close(); ws.current = null }
    clearFromStorage()
    setState({
      roomId: null, userId: null, isHost: false, connected: false,
      users: [], messages: [], queue: [], history: [],
      currentTrack: null, isPlaying: false, position: 0,
      volume: 70, repeatMode: "off", shuffleMode: false,
      error: null, roomName: null,
    })
  }, [])

  const play = useCallback(() => send("player:play"), [send])
  const pause = useCallback(() => send("player:pause"), [send])
  const seek = useCallback((position: number) => send("player:seek", { position }), [send])
  const nextTrack = useCallback(() => {
    const s = stateRef.current
    if (!s.roomId) {
      if (s.queue.length > 0) {
        const next = s.queue[0].track
        const rest = s.queue.slice(1)
        update({
          currentTrack: next, isPlaying: true, position: 0,
          queue: rest,
          history: s.currentTrack ? [...s.history, s.currentTrack] : s.history,
        })
      }
      return
    }
    send("track:next")
  }, [send])

  const previousTrack = useCallback(() => {
    const s = stateRef.current
    if (!s.roomId) {
      if (s.history.length > 0) {
        const prev = s.history[s.history.length - 1]
        update({
          currentTrack: prev, isPlaying: true, position: 0,
          history: s.history.slice(0, -1),
          queue: s.currentTrack ? [{ track: s.currentTrack, added_by: "", added_at: Date.now() }, ...s.queue] : s.queue,
        })
      }
      return
    }
    send("track:previous")
  }, [send])

  const selectTrack = useCallback((track: Track) => {
    const isLocalPlayback = !stateRef.current.roomId

    if (isLocalPlayback || stateRef.current.isHost) {
      const s = stateRef.current
      const wasInQueue = s.queue.find(q => q.track.id === track.id)
      update({
        currentTrack: track, isPlaying: true, position: 0,
        history: s.currentTrack && track.id !== s.currentTrack.id ? [...s.history, s.currentTrack] : s.history,
        queue: wasInQueue ? s.queue.filter(q => q.track.id !== track.id) : s.queue,
      })
      if (isLocalPlayback) {
        return
      }
    }
    send("track:select", { track })
  }, [send])

  const addToQueue = useCallback((track: Track) => {
    const s = stateRef.current
    if (!s.roomId) {
      const already = s.queue.find(q => q.track.id === track.id)
      if (!already) {
        update({ queue: [...s.queue, { track, added_by: s.userId || "local", added_at: Date.now() }] })
      }
      return
    }
    send("queue:add", { track })
  }, [send])

  const removeFromQueue = useCallback((trackId: string) => {
    const s = stateRef.current
    if (!s.roomId) {
      update({ queue: s.queue.filter(q => q.track.id !== trackId) })
      return
    }
    send("queue:remove", { track_id: trackId })
  }, [send])

  const clearQueue = useCallback(() => {
    const s = stateRef.current
    if (!s.roomId) {
      update({ queue: [] })
      return
    }
    send("queue:clear")
  }, [send])
  const sendMessage = useCallback((text: string) => send("chat:send", { text }), [send])
  const toggleRepeat = useCallback(() => send("room:repeat"), [send])
  const toggleShuffle = useCallback(() => send("room:shuffle"), [send])
  const setVolume = useCallback((vol: number) => send("room:volume", { volume: vol }), [send])
  const sendBeacon = useCallback((position: number, isPlaying: boolean) => {
    send("sync:beacon", { position, is_playing: isPlaying, server_time: Date.now() / 1000 })
  }, [send])

  useEffect(() => {
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (ws.current) ws.current.close()
    }
  }, [])

  return (
    <NebulaContext.Provider value={{
      ...state,
      createRoom, joinRoom, leaveRoom,
      play, pause, seek, nextTrack, previousTrack, selectTrack,
      addToQueue, removeFromQueue, clearQueue,
      sendMessage, toggleRepeat, toggleShuffle, setVolume, sendBeacon,
    }}>
      {children}
    </NebulaContext.Provider>
  )
}

const STORAGE_KEY = "nebula_session"

function saveToStorage(session: { roomId: string; roomName: string; deviceName: string; isHost: boolean; userId: string }) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)) } catch { }
}

function clearFromStorage() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { }
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
