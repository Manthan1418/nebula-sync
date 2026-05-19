"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import type { Track, User, ChatMessage, QueueItem, PlaybackState, Room, WSMessage } from "./types"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"

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

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

export function NebulaProvider({ children }: { children: ReactNode }) {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<any>(null)
  const [state, setState] = useState<NebulaState>({
    roomId: null,
    userId: null,
    isHost: false,
    connected: false,
    users: [],
    messages: [],
    queue: [],
    history: [],
    currentTrack: null,
    isPlaying: false,
    position: 0,
    volume: 70,
    repeatMode: "off",
    shuffleMode: false,
    error: null,
    roomName: null,
  })

  const update = useCallback((partial: Partial<NebulaState>) => {
    setState(prev => ({ ...prev, ...partial }))
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
      } catch { }
    }

    socket.onclose = () => {
      update({ connected: false })
      reconnectTimer.current = setTimeout(() => {
        if (state.roomId && state.userId) {
          connectWebSocket(state.roomId, state.userId, userName)
        }
      }, 3000)
    }

    socket.onerror = () => {
      update({ connected: false, error: "WebSocket connection failed" })
    }
  }, [state.roomId, state.userId])

  const handleMessage = useCallback((msg: WSMessage) => {
    const { type, payload } = msg
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
          update({ isHost: state.userId === payload.new_host })
        }
        break
      case "chat:message":
        update({ messages: [...state.messages, payload] })
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
            repeatMode: payload.sync.repeat_mode || state.repeatMode,
            shuffleMode: payload.sync.shuffle_mode ?? state.shuffleMode,
            volume: payload.sync.volume ?? state.volume,
          })
        }
        break
      case "player:state":
        update({
          isPlaying: payload.is_playing,
          position: payload.position,
        })
        break
      case "player:seeked":
        update({ position: payload.position })
        break
      case "sync:state":
        if (payload.track) update({ currentTrack: payload.track })
        update({
          isPlaying: payload.is_playing,
          position: payload.position,
        })
        break
      case "sync:beacon":
        if (!state.isHost) {
          const latency = (Date.now() - (payload.server_time * 1000)) / 1000
          let adjustedPos = payload.position
          if (payload.is_playing && latency > 0 && latency < 2) {
            adjustedPos = payload.position + latency
          }
          update({
            position: adjustedPos,
            isPlaying: payload.is_playing,
          })
        }
        break
      case "room:state":
        update({
          repeatMode: payload.repeat_mode || state.repeatMode,
          shuffleMode: payload.shuffle_mode ?? state.shuffleMode,
          volume: payload.volume ?? state.volume,
        })
        break
      case "error":
        update({ error: payload.message })
        break
    }
  }, [state.messages, state.isHost, state.repeatMode, state.shuffleMode, state.volume, state.userId])

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
          roomId: res.room.id,
          userId: uid,
          isHost: true,
          roomName: res.room.name,
          users: res.room.users,
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
          roomId: res.room!.id,
          userId: uid,
          isHost: false,
          roomName: res.room!.name,
          users: res.room!.users,
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
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
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
  const nextTrack = useCallback(() => send("track:next"), [send])
  const previousTrack = useCallback(() => send("track:previous"), [send])
  const selectTrack = useCallback((track: Track) => send("track:select", { track }), [send])
  const addToQueue = useCallback((track: Track) => send("queue:add", { track }), [send])
  const removeFromQueue = useCallback((trackId: string) => send("queue:remove", { track_id: trackId }), [send])
  const clearQueue = useCallback(() => send("queue:clear"), [send])
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
