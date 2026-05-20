# Nebula Sync — Project Context

> Real-time collaborative music listening app (Spotify Jam clone).  
> Multiple users create/join "Constellations" (rooms) and sync playback in real time.

---

## Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Frontend | Next.js 16 (App Router) | 16.2.6 |
| Language | TypeScript | ^5 |
| UI | React 19 + Tailwind CSS v4 + Framer Motion | 19.2.4 |
| Icons | Lucide React | ^1.16.0 |
| HLS | hls.js | ^1.6.16 |
| Backend | FastAPI (Python) | >=0.100.0 |
| Server | Uvicorn + websockets | |
| HTTP | aiohttp / httpx | |
| Gaana API | PyCryptodome (AES stream decrypt) | >=3.20.0 |
| Testing | pytest | >=7.0.0 |

---

## Directory Structure

```
nebula-sync/
├── client/                        # Next.js 16 frontend
│   ├── app/
│   │   ├── globals.css            # Tailwind v4 theme tokens (dark Spotify-like)
│   │   ├── layout.tsx             # Root layout (fonts, metadata, Providers wrapper)
│   │   └── page.tsx               # Main page: sidebar + main view + player/room panels
│   ├── components/
│   │   ├── MainView.tsx           # Home/Library/Rooms views, TrackCards, search
│   │   ├── Player.tsx             # Player UI + AudioEngine (HLS, sync, drift correction)
│   │   ├── Providers.tsx          # Context provider wrapper
│   │   ├── QueueView.tsx          # Queue overlay (now playing, up next, history)
│   │   ├── RoomView.tsx           # Room chat + user list ("Crew")
│   │   └── Sidebar.tsx            # Nav sidebar with connection status
│   ├── lib/
│   │   ├── api.ts                 # REST API client (search, trending, rooms, etc.)
│   │   ├── context.tsx            # NebulaProvider — WebSocket + state management
│   │   └── types.ts              # All TS interfaces (Track, User, Room, QueueItem, etc.)
│   ├── public/                    # Static assets (SVGs)
│   └── config files               # next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs
│
├── server/                        # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                # FastAPI app: REST endpoints + WS handler (362 lines)
│   │   ├── models.py              # Pydantic v2 models (Track, User, Room, PlaybackState, etc.)
│   │   ├── rooms.py               # Room CRUD logic, queue mgmt, sync state, code generation
│   │   ├── music.py               # Music catalog (GaanaPy bridge → 6 mock tracks fallback)
│   │   └── gaanapy_service.py     # GaanaPy response → Track model normalizer
│   ├── tests/
│   │   └── test_api.py            # Stale tests (test nonexistent /items endpoints)
│   ├── GaanaPy/                   # Embedded third-party Gaana.com API wrapper
│   │   ├── app.py                 # Standalone FastAPI app (port 8001)
│   │   ├── api/
│   │   │   ├── gaanapy.py         # Main class (multiple inheritance from all modules)
│   │   │   ├── endpoints.py       # Gaana API URLs (apiv2.gaana.com)
│   │   │   ├── functions.py       # AES-CBC decrypt, artist/genre extraction
│   │   │   ├── errors.py          # Error response helpers
│   │   │   ├── songs/             # Search, info, stream URL decryption
│   │   │   ├── albums/            # Album search/info/tracks
│   │   │   ├── artists/           # Artist search/info/similar/top tracks
│   │   │   ├── playlists/         # Playlist info
│   │   │   ├── trending/          # Trending by language
│   │   │   ├── newreleases/       # New releases by language
│   │   │   └── charts/            # Top charts
│   │   ├── tests/                 # pytest tests (AsyncMock, no network calls)
│   │   ├── Dockerfile             # python:alpine, exposes 8000
│   │   └── docker-compose.yml     # Pre-built image zingytomato/gaanapy:main
│   ├── run.sh                     # uvicorn app.main:app --reload on port 8000
│   └── requirements.txt
│
└── RECOMMENDATION_PLAN.md         # Future ML recommendation system roadmap
```

---

## Architecture & Data Flow

```
User → Next.js (:3000) → API proxy (rewrites) → FastAPI (:8000) → GaanaPy (:8001) → Gaana.com
                              ↕ WebSocket (:8000/ws/{room_id})
                         Real-time state sync (host → server → all clients)
```

**REST** for CRUD (search, rooms, queue). **WebSocket** for real-time sync (playback, chat, beacons).

---

## Key Architectural Decisions

1. **No database** — All room state stored in-memory (`rooms: dict[str, Room]`).
2. **Host-based control** — Only room host can play/pause/seek/skip. Server is source of truth.
3. **Sync beacons** — Host sends position every 2s; non-hosts apply drift correction (>2s threshold).
4. **Shared `<audio>` singleton** — Module-level `_audioElement` accessed via `getSharedAudioElement()`.
5. **HLS support** — hls.js for `.m3u8` streams (Gaana format), native `<audio>` fallback.
6. **Mock fallback** — 6 hardcoded mock tracks (Starboy, Blinding Lights, etc.) used when GaanaPy fails.
7. **WebSocket state pattern** — Dual tracking: React state (re-renders) + `stateRef` (stale-closure-safe).
8. **Session persistence** — Room sessions saved to `sessionStorage` (key: `nebula_session`).

---

## Client State Management (`context.tsx`)

`NebulaProvider` holds all app state:
- `roomId, userId, isHost, connected, users, messages, queue, history`
- `currentTrack, isPlaying, position, volume, repeatMode, shuffleMode`
- 17+ actions: `createRoom`, `joinRoom`, `leaveRoom`, `play`, `pause`, `seek`, `nextTrack`, `previousTrack`, `selectTrack`, `addToQueue`, `removeFromQueue`, `clearQueue`, `sendMessage`, `toggleRepeat`, `toggleShuffle`, `setVolume`, `sendBeacon`

WebSocket message types handled: `connected`, `user:joined`, `user:left`, `chat:message`, `queue:updated`, `track:changed`, `player:state`, `player:seeked`, `sync:state`, `sync:beacon`, `room:state`, `error`.

---

## Room Logic (`rooms.py`)

- Room codes: 6-char (uppercase + digits, excluding I/O/0/1 for readability)
- Host transfer on host leave
- Room auto-deletes when empty
- Queue respects repeat modes (off/all/one)
- History capped at 50

---

## Ports

| Service | Port |
|---|---|
| Next.js (client) | 3000 |
| FastAPI (server) | 8000 |
| GaanaPy standalone | 8001 |

---

## Commands

```sh
# Client
cd client && npm run dev          # Start Next.js dev server
npm run build                     # Production build
npm run lint                      # ESLint

# Server
cd server && uvicorn app.main:app --reload   # Dev (port 8000)
pytest -q                                     # Run server tests

# GaanaPy
cd server/GaanaPy && uvicorn app:app --reload  # Standalone (port 8001)
pytest                                         # Run GaanaPy tests
docker compose up                              # Via Docker
```
