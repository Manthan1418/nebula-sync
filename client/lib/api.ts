const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

// --- Cache layer ---
const CACHE_PREFIX = "nebula_cache_"

function cacheKey(endpoint: string, params: Record<string, string>): string {
  return CACHE_PREFIX + endpoint + "?" + new URLSearchParams(params).toString()
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw).data as T
  } catch { return null }
}

function cacheSet(key: string, data: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() })) } catch {}
}

function cacheClear() {
  try {
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(CACHE_PREFIX))
    keys.forEach(k => sessionStorage.removeItem(k))
  } catch {}
}

async function fetchCached<T>(url: string, cacheKeyStr: string, opts?: RequestInit): Promise<T> {
  const cached = cacheGet<T>(cacheKeyStr)
  if (cached) return cached
  const data = await rawFetch<T>(url, opts)
  cacheSet(cacheKeyStr, data)
  return data
}

async function rawFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...opts?.headers },
    ...opts,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// --- Public API ---

export function clearCache() {
  cacheClear()
}

export async function searchTracks(query: string, limit = 12) {
  return fetchCached<{ success: boolean; results: any[] }>(
    `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    cacheKey("search", { q: query, limit: String(limit) }),
  )
}

export async function getTrending(limit = 12, lang = "Hindi") {
  return fetchCached<{ success: boolean; results: any[] }>(
    `/api/trending?limit=${limit}&lang=${encodeURIComponent(lang)}`,
    cacheKey("trending", { limit: String(limit), lang }),
  )
}

export async function getNewReleases(limit = 12, lang = "Hindi") {
  return fetchCached<{ success: boolean; results: any[] }>(
    `/api/newreleases?limit=${limit}&lang=${encodeURIComponent(lang)}`,
    cacheKey("newreleases", { limit: String(limit), lang }),
  )
}

export async function getCharts(limit = 12) {
  return fetchCached<{ success: boolean; results: any[] }>(
    `/api/charts?limit=${limit}`,
    cacheKey("charts", { limit: String(limit) }),
  )
}

export async function getTrack(trackId: string) {
  return rawFetch<{ success: boolean; track?: any }>(
    `/api/tracks/${trackId}`
  )
}

export async function createRoom(name: string) {
  return rawFetch<{ success: boolean; room: any; user_id: string }>(
    `/api/rooms?name=${encodeURIComponent(name)}`,
    { method: "POST" }
  )
}

export async function joinRoom(roomId: string, name: string) {
  return rawFetch<{ success: boolean; room?: any; user_id?: string; error?: string }>(
    `/api/rooms/join?room_id=${encodeURIComponent(roomId)}&name=${encodeURIComponent(name)}`,
    { method: "POST" }
  )
}

export async function getRoomInfo(roomId: string) {
  return rawFetch<{ success: boolean; room?: any; error?: string }>(
    `/api/rooms/${roomId}`
  )
}
