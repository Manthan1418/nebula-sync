export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  thumbnail: string
  stream_url: string
  source: string
}

export interface User {
  id: string
  name: string
  is_host: boolean
  joined_at: number
}

export interface ChatMessage {
  id: string
  user_id: string
  user_name: string
  text: string
  timestamp: number
}

export interface QueueItem {
  track: Track
  added_by: string
  added_at: number
}

export interface PlaybackState {
  track: Track | null
  is_playing: boolean
  position: number
  server_time?: number
  volume?: number
  repeat_mode?: string
  shuffle_mode?: boolean
}

export interface Room {
  id: string
  name: string
  host_id?: string
  users: User[]
  queue: QueueItem[]
  history: Track[]
  playback: PlaybackState
  repeat_mode?: string
  shuffle_mode?: boolean
  volume?: number
}

export interface RoomSession {
  roomId: string
  roomName: string
  deviceName: string
  isHost: boolean
  userId?: string
}

export interface WSMessage {
  type: string
  payload: any
}
