const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...opts?.headers },
    ...opts,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function searchTracks(query: string, limit = 12) {
  return fetchJSON<{ success: boolean; results: any[] }>(
    `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
  )
}

export async function getTrending(limit = 12, lang = "Hindi") {
  return fetchJSON<{ success: boolean; results: any[] }>(
    `/api/trending?limit=${limit}&lang=${encodeURIComponent(lang)}`
  )
}

export async function getNewReleases(limit = 12, lang = "Hindi") {
  return fetchJSON<{ success: boolean; results: any[] }>(
    `/api/newreleases?limit=${limit}&lang=${encodeURIComponent(lang)}`
  )
}

export async function getCharts(limit = 12) {
  return fetchJSON<{ success: boolean; results: any[] }>(
    `/api/charts?limit=${limit}`
  )
}

export async function getTrack(trackId: string) {
  return fetchJSON<{ success: boolean; track?: any }>(
    `/api/tracks/${trackId}`
  )
}

export async function createRoom(name: string) {
  return fetchJSON<{ success: boolean; room: any; user_id: string }>(
    `/api/rooms?name=${encodeURIComponent(name)}`,
    { method: "POST" }
  )
}

export async function joinRoom(roomId: string, name: string) {
  return fetchJSON<{ success: boolean; room?: any; user_id?: string; error?: string }>(
    `/api/rooms/join?room_id=${encodeURIComponent(roomId)}&name=${encodeURIComponent(name)}`,
    { method: "POST" }
  )
}

export async function getRoomInfo(roomId: string) {
  return fetchJSON<{ success: boolean; room?: any; error?: string }>(
    `/api/rooms/${roomId}`
  )
}
