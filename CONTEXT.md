# Nebula Sync — Full Project Context

> **Description:** A real-time synchronized music listening platform where multiple devices listen to music in perfect sync.  
> **Alias:** SyncSound  
> **Author:** Manthan1418 (Manthan Arora)  
> **License:** ISC (Node app), GPL v3 (GaanaPy submodule)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Tree](#2-directory-tree)
3. [Configuration Files](#3-configuration-files)
4. [Backend: Node.js/Express (server.js)](#4-backend)
5. [Backend: Room Library (server/lib/rooms.js)](#5-room-library)
6. [Backend: REST API Routes (server/routes/musicRoutes.js)](#6-rest-api-routes)
7. [Backend: GaanaPy Service (server/services/gaanapyService.js)](#7-gaanapy-service)
8. [Backend: Build Script (scripts/copy-static.js)](#8-build-script)
9. [Frontend: Entry & App](#9-frontend-entry--app)
10. [Frontend: Pages](#10-frontend-pages)
11. [Frontend: Components](#11-frontend-components)
12. [Frontend: Hooks](#12-frontend-hooks)
13. [Frontend: Lib Utilities](#13-frontend-lib-utilities)
14. [Frontend: UI Components (shadcn)](#14-frontend-ui-components)
15. [GaanaPy (Python Submodule)](#15-gaanapy-python-submodule)
16. [WebSocket Event Reference](#16-websocket-event-reference)
17. [REST API Reference](#17-rest-api-reference)
18. [Environment Variables](#18-environment-variables)
19. [Build & Deploy](#19-build--deploy)
20. [Session Persistence](#20-session-persistence)
21. [Sync Algorithm](#21-sync-algorithm)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React)                    │
│  ┌───────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Socket.io  │  │  React   │  │  sessionStorage   │  │
│  │  Client     │  │  Router  │  │  (persistence)    │  │
│  └─────┬─────┘  └──────────┘  └───────────────────┘  │
│        │                                              │
├────────┼──────────────────────────────────────────────┤
│  Vite Dev Server :8080  │  Proxy /api → :3000         │
└────────┼──────────────────────────────────────────────┘
         │ WebSocket + HTTP
         ▼
┌─────────────────────────────────────────────────────┐
│          Node.js/Express Server :3000                │
│  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  Socket.io   │  │  REST API (/api/*)            │  │
│  │  (real-time) │  │  search/trending/charts/queue │  │
│  └──────┬───────┘  └──────────────┬───────────────┘  │
│         │                          │                  │
│  ┌──────▼──────────────────────────▼───────────────┐  │
│  │  rooms.js (In-Memory Map)                       │  │
│  │  Room state, queue, playback, users, sync       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP (proxy)
                      ▼
┌─────────────────────────────────────────────────────┐
│        GaanaPy Python/FastAPI Server :8000           │
│  Gaana.com unofficial API (AES-decrypted streams)    │
└─────────────────────────────────────────────────────┘
```

**Key decisions:**
- **No database** — all room state lives in an in-memory `Map`
- **No authentication** — rooms are public, 6-char alphanumeric codes
- **Host-authoritative** — only host controls playback; clients sync to host
- **sessionStorage** (not localStorage) — tab-scoped, cleared on close
- **GaanaPy submodule** — separate Python service for music scraping/streaming

---

## 2. Directory Tree

```
nebula-sync/
├── .env                          # Root env vars
├── .gitignore
├── .vercelignore
├── CONTEXT.md                    # THIS FILE
├── README.md
├── SESSION_PERSISTENCE.md
├── package.json                  # Root: Node.js backend
├── package-lock.json
├── vercel.json                   # Vercel deployment config
├── server.js                     # Main entry point (Express + Socket.io)
│
├── scripts/
│   └── copy-static.js            # Build: copies FE/dist → public/
│
├── server/
│   ├── lib/
│   │   └── rooms.js              # Room CRUD, queue, playback state
│   ├── routes/
│   │   └── musicRoutes.js        # Express REST API routes
│   └── services/
│       └── gaanapyService.js     # GaanaPy HTTP client
│
├── public/                       # Built frontend (from FE/dist)
│   ├── index.html
│   ├── favicon.ico
│   ├── placeholder.svg
│   ├── robots.txt
│   └── assets/
│       ├── index-xxxxx.css
│       └── index-xxxxx.js
│
├── FE/                           # Frontend (React + Vite + TypeScript)
│   ├── .env
│   ├── components.json           # shadcn/ui config
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── dist/                     # Build output
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── vite-env.d.ts
│       ├── context/
│       │   └── SocketContext.tsx   # Central state + socket provider
│       ├── hooks/
│       │   ├── useRoom.ts         # Room lifecycle (create/join/leave)
│       │   └── usePlayback.ts     # Playback controls
│       ├── lib/
│       │   ├── jamendo.ts         # GaanaPy API client
│       │   ├── sessionStorage.ts  # Session persistence utils
│       │   ├── socket.ts          # Socket.io singleton
│       │   ├── timeSync.ts        # NTP-like clock sync
│       │   └── utils.ts           # cn() utility
│       ├── pages/
│       │   ├── Index.tsx          # Landing / hero
│       │   ├── CreateRoom.tsx     # Room creation
│       │   ├── JoinRoom.tsx       # Room joining
│       │   ├── Room.tsx           # Main room view
│       │   └── NotFound.tsx       # 404
│       └── components/
│           ├── layout/
│           │   ├── Navigation.tsx
│           │   └── HeroSection.tsx
│           ├── music/
│           │   └── JamendoSearch.tsx
│           ├── room/
│           │   ├── ChatPanel.tsx
│           │   ├── ConnectedDevices.tsx
│           │   ├── MusicPlayer.tsx
│           │   └── TrackQueue.tsx
│           └── ui/                # shadcn/ui primitives
│               ├── button.tsx
│               ├── input.tsx
│               ├── slider.tsx
│               ├── sonner.tsx
│               └── tooltip.tsx
│
└── GaanaPy/                      # Git submodule → zingytomato/GaanaPy
    ├── .gitignore
    ├── LICENSE
    ├── README.md
    ├── app.py                    # FastAPI entry point
    ├── docker-compose.yml
    ├── Dockerfile
    ├── requirements.txt
    ├── api/
    │   ├── endpoints.py          # Gaana API URL constants
    │   ├── errors.py             # Error response helpers
    │   ├── functions.py          # AES decryption, formatting
    │   ├── gaanapy.py            # Main GaanaPy class (inherits all)
    │   ├── songs/songs.py
    │   ├── albums/albums.py
    │   ├── artists/artists.py
    │   ├── charts/charts.py
    │   ├── trending/trending.py
    │   ├── newreleases/newreleases.py
    │   └── playlists/playlists.py
    └── tests/
        ├── __init__.py
        ├── test_songs.py
        ├── test_albums.py
        ├── test_artists.py
        ├── test_charts.py
        └── test_functions.py
```

---

## 3. Configuration Files

### Root `package.json`
```json
{
  "name": "nebula-sync",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "npm run build-fe && npm run copy-static",
    "build-fe": "cd FE && npm install && npm run build && cd ..",
    "copy-static": "node scripts/copy-static.js",
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "@vercel/node": "^3.0.0"
  }
}
```

### Root `.env`
```
PORT=3000
CLIENT_ORIGIN=*
JAMENDO_CLIENT_ID=85af66af
JAMENDO_CLIENT_SECRET=1bd38557263d63fc8704c5e82554b96c
GAANAPY_BASE_URL=http://127.0.0.1:8000
```

### Root `.gitignore`
```
logs, *.log, node_modules, dist, dist-ssr, *.local, .env, build, uploads, .vscode/*, .idea, .DS_Store, .vercel, .env*.local
```

### Root `.vercelignore`
```
.vercel, .env.local, node_modules/, *.log, .git, .gitignore, FE/node_modules/, uploads/
```

### `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "env": { "NODE_ENV": "production" },
  "public": false
}
```

### FE `.env`
```
VITE_SOCKET_URL=http://localhost:3000
```

### FE `package.json` (key dependencies)
```json
{
  "dependencies": {
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@tanstack/react-query": "^5.83.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.39.0",
    "lucide-react": "^0.462.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "socket.io-client": "^4.8.1",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vite": "^5.4.19"
  }
}
```

### FE `vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}));
```

### FE `tailwind.config.ts`
- Dark mode via `class`
- Custom CSS variables for theming
- Keyframes: `float`, `pulse-glow`, `fade-in`, `slide-in-left/right`, `glow-pulse`, `waveform`
- Font families: Inter, Space Grotesk (Google Fonts)
- Plugins: `tailwindcss-animate`

### FE `tsconfig.json`
- Path alias `@/*` → `./src/*`
- Strict mode disabled (`strictNullChecks: false`, `noImplicitAny: false`)
- Composite project referencing `tsconfig.app.json` + `tsconfig.node.json`

### FE `index.html`
```html
<html lang="en" class="dark">
<head>
  <title>SyncSound - Group Music Listening Platform</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
```

---

## 4. Backend: `server.js`

**Purpose:** Main entry point — Express HTTP server + Socket.io WebSocket server + REST API + static file serving.

**Key behaviors:**
- Loads `.env` manually via `loadEnvFile()` (checks `__dirname + .env`)
- Creates `http.Server` + `socket.io Server` with CORS `origin: true`, transports `["websocket", "polling"]`
- Serves static files from `public/` directory (max-age 1 day)
- Fallback `*` route serves `public/index.html` (for client-side routing)
- All Socket.io event handlers defined inline

**Socket.io event handlers (all in `io.on("connection")`):**

| Event | Handler |
|-------|---------|
| `timeSync` | NTP-like; responds with `{ t0, t1, t2 }` |
| `createRoom` | Generates 6-char code, creates room state, joins socket, calls back with `{ success, room, serverTime }` |
| `joinRoom` | Looks up room by code (uppercased), adds user, sends `userJoined` broadcast, sends `syncState` if track active |
| `leaveRoom` | Removes user, broadcasts `userLeft`, deletes room if empty |
| `setTrack` | Host-only; normalizes and sets current track, broadcasts `trackChanged` |
| `play` / `pause` | Host-only; updates playback state, broadcasts `playbackUpdate` |
| `seek` | Host-only; sets `timestamp`, broadcasts `playbackUpdate` with `seeked: true` |
| `requestSync` | Returns full room state with current timestamp |
| `hostSync` | Host-only; stores position from host audio element, broadcasts `syncBeacon` to non-host sockets (with serverTime for latency comp) |
| `queue:add` | Any user can add; deduplicates; broadcasts `queueUpdated` |
| `queue:remove` / `queue:clear` | Host-only; broadcasts `queueUpdated` |
| `track:next` / `track:previous` / `track:end` | Host-only; advances track, broadcasts `trackChanged` + `queueUpdated` |
| `room:repeat` / `room:shuffle` / `room:volume` | Host-only; toggles/sets value, broadcasts `roomState` |
| `chat:send` | Any user; trims to 500 chars, broadcasts `chat:message` with `{ id, userId, userName, text, timestamp }` |
| `disconnect` | Removes user, broadcasts `userLeft`, deletes empty rooms |

---

## 5. Room Library: `server/lib/rooms.js`

**Purpose:** Pure functions for room CRUD, track management, queue, playback state, sync logic.

### Exported constants
- `rooms` — `new Map()` — all active rooms keyed by room code

### `generateRoomCode()`
- Characters: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no I/O/0/1 to avoid confusion)
- Generates 6-char codes, collision-checked against existing rooms
- Loop continues until unique code found (in practice first attempt always succeeds)

### `normalizeTrack(track)`
Maps various track shapes (Jamendo, GaanaPy, YouTube, generic) to canonical shape:
```ts
{
  id, title, artistName, albumName, thumbnail, duration, streamUrl,
  audioDownloadUrl, shareUrl, licenseUrl, source, jamendoId, isYouTube, videoId,
}
```
- Covers field aliases: `track.jamendoId || track.id`, `track.streamUrl || track.audio || track.url`, `track.artistName || track.artist_name`
- Defaults: `title = 'Unknown Track'`, `id = Date.now()`, `duration = 0`, `source = 'jamendo'`

### `createRoomState({ roomId, user })`
```ts
{
  id: roomId,              // string
  users: Map,              // Map<string, User>
  hostId: user.id,
  currentTrack: null,
  queue: [],               // Track[]
  history: [],             // Track[]
  isPlaying: false,
  repeatMode: 'off',       // 'off' | 'all' | 'one'
  shuffleMode: false,
  volume: 70,
  playbackState: { timestamp: 0, startedAt: null },  // timestamp in seconds
  lastMutationAt: Date.now(),
}
```

### `getCurrentTimestamp(room)`
Calculates current playback position:
- If not playing or no `startedAt`: returns `playbackState.timestamp` (paused position)
- If playing: returns `playbackState.timestamp + (Date.now() - playbackState.startedAt) / 1000`

### `serializeRoom(room)`
Converts Map to plain objects for JSON serialization:
```ts
{ id, hostId, users: User[], currentTrack, queue, history, isPlaying, repeatMode, shuffleMode, volume, masterTimestamp, lastSyncTime }
```
- `masterTimestamp` = current calculated position
- `lastSyncTime` = `playbackState.startedAt || lastMutationAt || Date.now()`

### Queue functions
- `addToQueue(room, track)` — normalizes, deduplicates by id/streamUrl
- `removeFromQueue(room, trackId)` — removes by id
- `clearQueue(room)` — empties queue array

### `setCurrentTrack(room, track, { autoplay = true })`
- Pushes current track to history (max 50), sets new track
- Resets playback state to position 0
- Autoplay starts `startedAt` clock

### `updatePlayback(room, { isPlaying, timestamp, startedAt })`
- Sets playing state, stores timestamp and startedAt

### `moveToPreviousTrack(room)`
- Shifts from history, pushes current track back to front of queue
- Resets playback to position 0

### `advanceTrack(room)`
Complex logic for next track:
1. If shuffle and queue.length > 1: random pick
2. Else: `queue.shift()`
3. If nothing in queue:
   - `repeatMode === 'one'`: restart current track (position 0, same track)
   - `repeatMode === 'all'`: pop from history
   - Otherwise: stop playback (isPlaying=false)
4. Pushes current to history (max 50)
5. Resets playback position to 0, starts playing

---

## 6. REST API Routes: `server/routes/musicRoutes.js`

**Mount point:** `app.use("/api", createMusicRouter({ rooms, io }))`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=&limit=` | Search GaanaPy tracks |
| GET | `/api/track/:id` | Get track details by seokey |
| GET | `/api/trending?lang=&limit=` | Trending tracks |
| GET | `/api/newreleases?lang=&limit=` | New releases |
| GET | `/api/charts?limit=` | Top charts |
| GET | `/api/current?roomId=` | Current room state |
| GET | `/api/queue?roomId=` | Room queue + history + repeat/shuffle state |
| POST | `/api/queue` | Queue actions: `add`, `remove`, `clear`, `next`, `previous`, `toggleRepeat`, `toggleShuffle` |
| GET | `/health` | `{ status: "ok" }` |

All music endpoints return `{ success: true, results: [...] }` or `{ success: true, track: {...} }`.  
On GaanaPy failure, they return `{ success: true, results: [], fallback: true }` (soft failure — UI still works).

POST `/api/queue` body: `{ roomId, action, track?, trackId? }`. Broadcasts room state to all room members via `io.to(roomId)` after mutation.

---

## 7. GaanaPy Service: `server/services/gaanapyService.js`

**Purpose:** HTTP client that wraps the GaanaPy Python API (port 8000).

`GAANAPY_BASE_URL` from env (default `http://127.0.0.1:8000`).

### Key functions
- `searchTracks(query, limit=24)` → `GET /songs/search/?query=&limit=`
- `getTrackById(trackId)` → `GET /songs/info/?seokey=`
- `getTrendingTracks(limit=12, language='Hindi')` → `GET /trending?language=&limit=`
- `getNewReleaseTracks(limit=12, language='Hindi')` → `GET /newreleases?language=&limit=`
- `getCharts(limit=12)` → `GET /charts?limit=`

### `normalizeTrack(track)` (GaanaPy → canonical)
Maps GaanaPy's JSON format:
```ts
{
  id: track.track_id || track.seokey,
  seokey, trackId, title, artistName: track.artists,
  albumName: track.album, duration, thumbnail,
  streamUrl: stream_urls.urls.very_high_quality || ...high_quality || ...medium_quality || ...low_quality,
  source: 'gaanapy',
  albumUrl, songUrl, popularity, language,
}
```

### Helper: `requestJson(path, params)` — generic fetch with query params
### Helper: `fetchTracks(path, params)` — request + unwrap + normalize + filter (drops tracks without streamUrl)
### Helper: `unwrapResults(body)` — extracts array from various response shapes (`body.results`, `body.tracks`, `body.albums`, `body.artists`, `body.entities`, or `body` itself)

---

## 8. Build Script: `scripts/copy-static.js`

Run after FE builds. Copies `FE/dist/` → `public/` recursively (removes old public first).

---

## 9. Frontend: Entry & App

### `FE/src/main.tsx`
```tsx
createRoot(document.getElementById("root")!).render(<App />);
```

### `FE/src/App.tsx`
```tsx
<QueryClientProvider>
  <SocketProvider>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreateRoom />} />
          <Route path="/join" element={<JoinRoom />} />
          <Route path="/room/:roomCode" element={<Room />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </SocketProvider>
</QueryClientProvider>
```
- Forces `dark` class on `document.documentElement`

### `FE/src/context/SocketContext.tsx`
Central provider that:
1. Initializes socket on mount (calls `initializeSocket()`)
2. Uses `useRoom()` + `usePlayback()` hooks
3. Runs high-precision `requestAnimationFrame` loop for position tracking:
   - Calculates `position = masterTimestamp + (Date.now() - lastSyncTime) / 1000` when playing
   - Updates state at most every 100ms
4. Exposes everything via context: `{ room, loading, error, connected, isHost, playback, createRoom, joinRoom, leaveRoom, setTrack, play, pause, seek, enqueueTrack, removeQueueTrack, clearQueue, nextTrack, previousTrack, toggleRepeat, toggleShuffle, setVolume, sendHeartbeat, sendMessage }`

`playback` state shape:
```ts
{ currentTrack, isPlaying, position, queue, history, repeatMode, shuffleMode, volume }
```

---

## 10. Frontend: Pages

### `Index.tsx` (`/`)
- Renders `Navigation` + `HeroSection`
- Auto-navigates to `/room/:roomCode` if active session exists in sessionStorage

### `CreateRoom.tsx` (`/create`)
- Device name input + "Launch Constellation" button
- Connection status indicator (green/red)
- Calls `createRoom()` from SocketContext
- Navigates to `/room/:id` on success
- Checks existing session on mount → redirects

### `JoinRoom.tsx` (`/join`)
- Room code input (6 chars, uppercase, monospace) + device name input
- Connection status indicator + error display
- Calls `joinRoom()` from SocketContext
- Navigates to `/room/:id` on success
- Checks existing session on mount → redirects

### `Room.tsx` (`/room/:roomCode`)
- Sticky header: back button, room name with host crown, live indicator, copyable room code
- Main content: `MusicPlayer` (2/3 width) + sidebar (1/3 width)
- Desktop sidebar: `ConnectedDevices` + `ChatPanel`
- Mobile: tab switcher between chat and crew (users)
- Leave room button → `leaveRoom()` → navigate to `/`
- 3-second timeout: if no room data, shows error and navigates home
- Room code copy button with checkmark animation

### `NotFound.tsx` (`*`)
- Simple 404 page with link to home

---

## 11. Frontend: Components

### `layout/Navigation.tsx`
- Fixed top navbar with logo ("Nebula Sync" + Orbit icon)
- Desktop: nav links (Home, Features, About, Contact) + "Launch" button
- Mobile: hamburger menu with Framer Motion slide-down animation
- Styling: dark blue/violet gradient, glassmorphism

### `layout/HeroSection.tsx`
- Full-viewport landing section
- Animated background: pulsing glowing orbs (blue + violet), floating 3D elements
- Scroll parallax via `useScroll()` + `useTransform()`
- Hero title "Nebula Sync" in large text with gradient
- Tagline: "Multiple devices. One universe."
- Two CTAs: "Create Constellation" (primary blue) + "Join Constellation" (outline violet)
- 3D feature grid: Instant Sync, Spatial Audio, Group Sessions
- Framer Motion animations on entrance

### `room/MusicPlayer.tsx`
The most complex component. Key behaviors:
- **Audio element** (`<audio ref={audioRef}>`) — handles actual playback
- **Host sync interval**: Every 2 seconds, host sends `hostSync` event with `{ position, isPlaying, serverTime }`
- **Track loading**: When `currentTrackUrl` changes, sets `audio.src`, calls `audio.load()`, and auto-seeks/plays
- **Drift correction** (non-host clients):
  - If drift > 2s: hard seek to `playback.position`
  - If drift > 300ms: adjust `playbackRate` (0.97x or 1.03x)
  - If drift < 100ms: reset to 1x
  - Runs on every `playback.position` update (debounced via `lastSyncRef`)
- **Play/Pause**: Host only; calls `audio.play()`/`.pause()` + emits play/pause event
- **Seek**: Slider with `onValueCommit` — sets `audio.currentTime` + emits seek event
- **Volume/Mute**: Local state, synced to room only by host
- **Track ended**: If host, calls `nextTrack()`
- **Controls**: Play/Pause, Prev/Next, Repeat (off/all/one), Shuffle, Volume slider
- Integrates `JamendoSearch` + `TrackQueue` sub-components

### `room/ChatPanel.tsx`
- Real-time chat with message persistence in sessionStorage (keyed by room code)
- Messages stored as `Message[]` with `{ id, userId, userName, text, timestamp, isSystem? }`
- **Avatar colors**: Deterministic based on name hash (6 gradient options)
- **Own messages**: Right-aligned with violet/fuchsia gradient background
- **Other messages**: Left-aligned with subtle white/10 background
- **System messages**: Centered with decorative dividers
- **Timestamps**: Relative ("now", "5m", or time)
- **Compact mode**: Smaller layout for mobile tabs
- Full mode: Dedicated panel with header showing "Transmissions" + live badge
- Empty state: Radio icon + Sparkles animation + "No transmissions yet"
- Send input with Enter key support, send button with hover effects

### `room/ConnectedDevices.tsx`
- Shows list of connected users in the room
- **Device icon detection**: Based on device name (phone/android → Smartphone, laptop/desktop/mac → Monitor, else → User icon)
- **Host indicator**: Crown icon + "Captain" badge + violet background gradient
- **Compact mode**: Smaller layout for mobile tabs
- Full mode: "Crew" header with online count badge
- Shows "Connecting..." when disconnected, "No users yet" when empty

### `room/TrackQueue.tsx`
- Queue section: numbered track list with title, artist, duration, remove button
- Recently played section: shows last 5 played tracks
- Control buttons: Prev, Next, Repeat (cycles off→all→one), Shuffle
- Clear queue button (host only)
- Empty states for both queue and history
- Styling: emerald/cyan accents

### `music/JamendoSearch.tsx`
- Search input with 300ms debounce
- Calls `searchJamendoTracks()` API on input, `getTrendingJamendoTracks()` on mount
- Shows loading spinner, error state, empty state
- Result cards: thumbnail (or fallback), title, artist, album, duration
- Two action buttons per track: "Queue" and "Play" (Play disabled if not host)
- "Queued" badge for tracks already in queue
- Tracks from GaanaPy with Flame badge "Free streaming"

---

## 12. Frontend: Hooks

### `useRoom.ts`
**Purpose:** Room lifecycle management (create, join, leave, auto-rejoin).

**Interfaces:**
```ts
User { socketId, deviceName, isHost }
Track { id, title, url?, streamUrl?, duration?, artistName?, albumName?, thumbnail?, isYouTube?, videoId?, ... }
Room { id, hostId?, users, currentTrack, queue, history, isPlaying, isHost, repeatMode?, shuffleMode?, volume?, masterTimestamp?, lastSyncTime? }
```

**State:** `{ room, loading, error, connected }`

**Auto-rejoin:**
- On socket `connect`, checks `getRoomSession()` from sessionStorage
- If saved session exists: re-joins room (hosts rejoin as regular users since room code cannot be recreated)
- Shows success toast on rejoin, clears session on failure

**Event listeners (mounted once):**
| Server Event | Handler |
|---|---|
| `userJoined` | Updates room.users |
| `userLeft` | Updates room.users |
| `roomState` | Merges into room |
| `queueUpdated` | Merges room + queue data |
| `trackChanged` | Sets currentTrack, shows toast "Now playing:..." |
| `playbackUpdate` | Updates isPlaying, masterTimestamp |
| `syncState` | Full state sync (on join) |
| `syncBeacon` | Latency-compensated position update |
| `chat:message` | Handled in ChatPanel component |

**syncBeacon handler detail:**
```ts
const offset = getClockOffset();
const latency = (now - (d.serverTime - offset)) / 1000;
if (d.isPlaying && latency > 0 && latency < 2) {
  adjustedPos = d.timestamp + latency;
}
```
This compensates for network latency by adding the estimated travel time.

**createRoom:** Emits `createRoom` → saves session to sessionStorage on success
**joinRoom:** Emits `joinRoom` → saves session on success
**leaveRoom:** Emits `leaveRoom` → clears session on success

### `usePlayback.ts`
**Purpose:** Playback control methods.

All methods emit socket events and handle error responses:
- `setTrack(track)` — emits `setTrack`
- `enqueueTrack(track)` — emits `queue:add`
- `removeQueueTrack(trackId)` — emits `queue:remove`
- `clearQueue()` — emits `queue:clear`
- `nextTrack()` / `previousTrack()` — emits `track:next` / `track:previous`
- `toggleRepeat()` / `toggleShuffle()` — emits `room:repeat` / `room:shuffle`
- `setVolume(volume)` — emits `room:volume`
- `play(timestamp?)` / `pause()` / `seek(timestamp)` — emits play/pause/seek
- `sendHeartbeat()` — emits `deviceHeartbeat`

Error handling: On failure, shows toast. For "Not in room" / "Room not found" → redirects to `/`. For "Not host" → reloads page.

---

## 13. Frontend: Lib Utilities

### `lib/socket.ts`
Socket.io singleton:
- `initializeSocket()` — creates if null, connects to `window.location.origin` in prod or `VITE_SOCKET_URL` in dev
- Config: reconnection enabled, delay 1s→5s max, 10 attempts, transports `['websocket', 'polling']`
- `getSocket()` — returns existing or initializes
- `closeSocket()` — disconnect + null

### `lib/timeSync.ts`
NTP-like clock synchronization:
- Formula: `offset = ((t1 - t0) + (t2 - t3)) / 2`
- Takes 3 samples, uses median
- `calibrateTime()` — runs 3 measurements with 100ms spacing
- `getServerTime()` — `Date.now() + offset`
- `getClockOffset()` — returns current offset in ms
- `startAutoSync()` — calibrates immediately, then recalibrates every 30s
- `stopAutoSync()` — clears interval

### `lib/sessionStorage.ts`
Session persistence utilities:
- Key: `'nebula_room'`
- `saveRoomSession({ roomId, deviceName, isHost, roomName })`
- `getRoomSession()` → `RoomSession | null`
- `clearRoomSession()`
- `hasActiveSession()` → boolean
- All functions wrapped in try/catch

### `lib/jamendo.ts`
GaanaPy API client and formatting:
- `searchJamendoTracks(query, limit=24)` — `GET /api/search?q=&limit=`
- `getTrendingJamendoTracks(limit=12)` — `GET /api/trending?limit=`
- `formatDuration(seconds)` — `"M:SS"` format
- Returns `JamendoTrack[]` with fields: `{ id, jamendoId?, title, artistName, albumName?, duration, thumbnail?, streamUrl, audioDownloadUrl?, shareUrl?, licenseUrl?, source?, isYouTube?, videoId? }`

### `lib/utils.ts`
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 14. Frontend: UI Components (shadcn)

### `ui/button.tsx`
- Radix `Slot` for `asChild` prop
- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`
- Uses `cn()` for class merging

### `ui/input.tsx`
- Simple styled input with ring focus, disabled state, file support
- Rounded-md border, ring-offset-2 on focus

### `ui/slider.tsx`
- Radix `SliderPrimitive.Root`
- Track + Range (filled portion) + Thumb
- h-2 track, h-5 thumb with border-2 and ring on focus

### `ui/sonner.tsx`
```tsx
export const Toaster = SonnerToaster;
```
(Named re-export of Sonner's Toaster)

### `ui/tooltip.tsx`
- Radix `TooltipPrimitive`
- Exports `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`
- Content with animation + slide-in-from-side

---

## 15. GaanaPy (Python Submodule)

**License:** GPL v3  
**Source:** https://github.com/ZingyTomato/GaanaPy (commit 92d35b5)  
**Purpose:** Unofficial JSON API for Gaana.com music streaming. Uses AES-CBC decryption to extract stream URLs from encrypted Gaana data.

### Setup
```bash
cd GaanaPy
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Or with Docker:
```bash
docker compose up -d
```

### Dependencies
```
pycryptodome==3.23.0
fastapi==0.136.1
aiohttp==3.13.5
uvicorn==0.47.0
```

### `app.py` — FastAPI entry point
Routes:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Home with docs + github link |
| GET | `/songs/search/?query=&limit=` | Search songs |
| GET | `/songs/info/?seokey=` | Song details |
| GET | `/albums/search/?query=&limit=` | Search albums |
| GET | `/albums/info/?seokey=` | Album details |
| GET | `/artists/search/?query=&limit=` | Search artists |
| GET | `/artists/info/?seokey=` | Artist details |
| GET | `/artists/similar/?artist_id=&limit=` | Similar artists |
| GET | `/trending?language=&limit=` | Trending songs |
| GET | `/newreleases?language=&limit=` | New releases |
| GET | `/charts?limit=` | Top charts (playlists) |
| GET | `/playlists/info/?seokey=` | Playlist details |

### `api/endpoints.py` — Gaana API URL constants
All endpoints hit `gaana.com/apiv2` with various query parameters.

### `api/functions.py` — Utilities
- `decryptLink(encrypted_data)` — AES-CBC decryption with key `b'gy1t#b@jl(b$wtme'`, extracts offset, IV, ciphertext
- `findArtistNames()`, `findArtistSeoKeys()`, `findArtistIds()` — joins artist arrays
- `findGenres()` — joins genre arrays
- `isExplicit(explicit)` — boolean conversion

### `api/gaanapy.py` — Main class
Inherits from `Songs, Albums, Artists, Trending, NewReleases, Charts, Playlists`.
Manages `aiohttp.ClientSession` lifecycle via `ensure_session()`.

### `api/songs/songs.py`
- `search_songs(query, limit)` — Searches, extracts track seokeys from response, fetches track info
- `get_track_info(track_ids)` — Fetches details for each track seokey
- `format_json_songs(result)` — Formats song with: track_id, title, artists, album, duration, popularity, language, images, stream_urls (decrypted at 4 quality levels: 16/64/128/320 kbps)
- Stream URL decryption: `decryptLink(results['urls']['medium']['message'])` then string replacement for quality

### `api/albums/albums.py`
- `search_albums(query, limit)` — Search + fetch album info
- `get_album_info(album_ids, info)` — If `info=True`, fetches album tracks too
- `get_album_tracks(album_id)` — Gets track seokeys within album, fetches track info
- `format_json_albums(result)` — Album metadata + images

### `api/artists/artists.py`
- `search_artists(query, limit)` — Search + fetch artist info
- `get_artist_info(artist_ids, info)` — If `info=True`, fetches top tracks too
- `get_top_tracks(artist_id)` — Gets artist's top tracks
- `get_similar_artists(artist_id, limit)` — Mobile endpoint
- `format_json_artists(result)` / `format_json_similar_artists(result)`

### `api/trending/trending.py`
- Sets language cookie (`__ul`), fetches trending songs
- Extracts track seokeys, fetches track info

### `api/newreleases/newreleases.py`
- Fetches new releases, separates tracks (`TR`) and albums (`AL`) by entity_type
- Returns `{ tracks: [...], albums: [...] }`

### `api/charts/charts.py`
- Fetches chart playlists, formats with title, language, play/favorite count, images

### `api/playlists/playlists.py`
- Fetches playlist tracks by seokey, returns track info array

---

## 16. WebSocket Event Reference

### Client → Server

| Event | Payload | Response | Notes |
|-------|---------|----------|-------|
| `timeSync` | `{ t0 }` | `{ t0, t1, t2 }` | NTP-like |
| `createRoom` | `{ deviceName? }` | `{ success, room, serverTime }` | Auto-generates code |
| `joinRoom` | `{ roomId, deviceName? }` | `{ success, room, serverTime, timestamp }` | Broadcasts `userJoined` |
| `leaveRoom` | `{}` | `{ success }` | Broadcasts `userLeft` |
| `setTrack` | `{ track }` | `{ success, serverTime, room }` | Host only |
| `play` | `{ timestamp? }` | `{ success, serverTime, timestamp, room }` | Host only |
| `pause` | `{}` | `{ success, serverTime, timestamp, room }` | Host only |
| `seek` | `{ timestamp }` | `{ success, serverTime, room }` | Host only |
| `requestSync` | `{}` | `{ success, room, track, isPlaying, timestamp, serverTime }` | |
| `hostSync` | `{ position, isPlaying, serverTime }` | `{ success, serverTime }` | Host only, every 2s |
| `queue:add` | `{ track }` | `{ success, queued, room }` | |
| `queue:remove` | `{ trackId }` | `{ success, room }` | Host only |
| `queue:clear` | `{}` | `{ success, room }` | Host only |
| `track:next` | `{}` | `{ success, track, room }` | Host only |
| `track:previous` | `{}` | `{ success, track, room }` | Host only |
| `track:end` | `{}` | `{ success, track, room }` | Host only |
| `room:repeat` | `{ repeatMode? }` | `{ success, room }` | Cycles off→all→one→off |
| `room:shuffle` | `{ shuffleMode? }` | `{ success, room }` | Toggles if no value |
| `room:volume` | `{ volume }` | `{ success, room }` | Clamped 0-100 |
| `chat:send` | `{ text }` | — (broadcast only) | Trimmed 500 chars |
| `disconnect` | — | — | Cleanup on close |

### Server → Client

| Event | Payload | Condition |
|-------|---------|-----------|
| `roomCreated` | `{ room }` | Room created (via callback, not broadcast) |
| `userJoined` | `{ user, users }` | Another user joined the room |
| `userLeft` | `{ userId, users }` | User left |
| `trackChanged` | `{ track, isPlaying, timestamp, serverTime, room }` | Host set/next/prev track |
| `playbackUpdate` | `{ isPlaying, timestamp, serverTime, seeked?, room }` | Play/pause/seek |
| `syncBeacon` | `{ timestamp, isPlaying, serverTime, hostTime, room }` | Host sync (to non-hosts) |
| `syncState` | `{ room, track, isPlaying, timestamp, serverTime }` | On join (if track active) |
| `queueUpdated` | `{ room, queue, history }` | Queue mutation |
| `roomState` | `{ ...room }` | Repeat/shuffle/volume change |
| `chat:message` | `{ id, userId, userName, text, timestamp }` | Chat message |

---

## 17. REST API Reference

### Music Search (proxied to GaanaPy)

| Endpoint | Params | Returns |
|----------|--------|---------|
| `GET /api/search` | `q` (required), `limit` (default 24) | `{ success, query, results: Track[] }` |
| `GET /api/track/:id` | `id` (seokey) | `{ success, track: Track }` |
| `GET /api/trending` | `lang` or `language` (default "Hindi"), `limit` (default 12) | `{ success, results: Track[] }` |
| `GET /api/newreleases` | `lang` or `language` (default "Hindi"), `limit` (default 12) | `{ success, results: Track[], language }` |
| `GET /api/charts` | `limit` (default 12) | `{ success, results: Track[] }` |

### Room State (HTTP)

| Endpoint | Params | Returns |
|----------|--------|---------|
| `GET /api/current` | `roomId` | `{ success, room: SerializedRoom }` |
| `GET /api/queue` | `roomId` | `{ success, queue, history, repeatMode, shuffleMode }` |
| `POST /api/queue` | `{ roomId, action, track?, trackId? }` | `{ success, room, track? }` |

### Health

| Endpoint | Returns |
|----------|---------|
| `GET /health` | `{ status: "ok" }` |

---

## 18. Environment Variables

### Root `.env`
| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP server port |
| `CLIENT_ORIGIN` | `*` | CORS origin |
| `JAMENDO_CLIENT_ID` | `85af66af` | Jamendo API client ID (legacy/unused) |
| `JAMENDO_CLIENT_SECRET` | `1bd38557263d63fc8704c5e82554b96c` | Jamendo API secret (legacy/unused) |
| `GAANAPY_BASE_URL` | `http://127.0.0.1:8000` | GaanaPy service URL |

### FE `.env`
| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_SOCKET_URL` | `http://localhost:3000` | Backend socket URL for dev |

---

## 19. Build & Deploy

### Build pipeline
```bash
npm run build            # Full build
npm run build-fe         # Build frontend only (FE/)
npm run copy-static      # Copy FE/dist to public/
npm start                # Start production server
npm run dev              # Start dev server
```

Build steps:
1. `cd FE && npm install && npm run build` → produces `FE/dist/`
2. `node scripts/copy-static.js` → recursively copies `FE/dist/` → `public/`

### Production architecture
- `server.js` serves the app (static files from `public/`)
- GaanaPy runs separately (port 8000), typically via Docker
- Vite proxy NOT used in production — static files served directly by Express

### Vercel deployment
- `vercel.json` uses `npm run build` as build command
- Output is a Node.js serverless function via `@vercel/node`
- `.vercelignore` excludes unnecessary files

---

## 20. Session Persistence

**Storage:** `sessionStorage` (not localStorage) — cleared on tab close.

**Storage key:** `'nebula_room'`

**Stored data:**
```ts
{ roomId: string, deviceName: string, isHost: boolean, roomName: string }
```

**Flow:**
1. **Create/Join room** → `saveRoomSession()` writes to sessionStorage
2. **Page refresh** → `useRoom` checks `getRoomSession()` and auto-rejoins
3. **Hosts** → Cannot recreate room with same code, so rejoin as regular user but maintain `isHost: true` in local state
4. **Explicit leave** → `clearRoomSession()` cleans up
5. **Tab close** → Browser automatically clears sessionStorage

**Where session is checked:**
- `useRoom.ts` — on socket connect
- `Index.tsx` — auto-navigate to room
- `CreateRoom.tsx` / `JoinRoom.tsx` — redirect if already in room
- `Room.tsx` — read room info from session for display

---

## 21. Sync Algorithm

### Architecture
- **Master timestamp model**: Server calculates `position = playbackState.timestamp + (Date.now() - playbackState.startedAt) / 1000`
- **Host authority**: Only the host's audio element drives `position` values
- **Drift tolerance**: < 100ms ideal target

### Sync flow

```
1. HOST audio plays normally
2. Every 2 seconds, HOST emits 'hostSync' with:
   - audio.currentTime (position in seconds)
   - audio.paused (isPlaying)
   - getServerTime() (NTP-calibrated timestamp)
3. Server stores position, forwards 'syncBeacon' to ALL non-host clients
4. Non-host clients receive syncBeacon:
   a. Calculate latency: (now - (serverTime - clockOffset)) / 1000
   b. Adjust position: pos = timestamp + latency (if latency < 2s and playing)
   c. Store adjusted position + timestamp in room state
5. MusicPlayer (non-host) compares audio.currentTime vs playback.position:
   - If drift > 2s → hard seek audio.currentTime = playback.position
   - If drift > 300ms → rate adjust (0.97x if ahead, 1.03x if behind)
   - If drift < 100ms → reset playbackRate to 1x
```

### Latency compensation
- `timeSync.ts` implements NTP-like clock offset calculation
- 3 samples taken, median selected as offset
- `getServerTime()` = `Date.now() + offset`
- Sync beacons include both server time and host time for double-checking

### Time sync formula
```
offset = ((t1 - t0) + (t2 - t3)) / 2
where:
  t0 = client send time
  t1 = server receive time
  t2 = server response time (= t1 in this implementation since response is immediate)
  t3 = client receive time
```
