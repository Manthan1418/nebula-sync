import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createMusicRouter } from "./server/routes/musicRoutes.js";
import {
  addToQueue,
  createRoomState,
  advanceTrack,
  generateRoomCode,
  getCurrentTimestamp,
  clearQueue,
  rooms,
  serializeRoom,
  moveToPreviousTrack,
  removeFromQueue,
  setCurrentTrack,
  updatePlayback,
} from "./server/lib/rooms.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex <= 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, '.env'));

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io - optimized for low-powered servers
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB max payload
});

app.use(express.json({ limit: "1mb" }));
app.use("/api", createMusicRouter({ rooms, io }));

// Health & static
app.get("/health", (_, res) => res.json({ status: "ok" }));

const publicDir = path.join(__dirname, "public");
const indexPath = path.join(publicDir, "index.html");

// Log startup info
console.log("Public dir:", publicDir);
console.log("Public dir exists:", fs.existsSync(publicDir));
console.log("Index.html exists:", fs.existsSync(indexPath));

app.use(express.static(publicDir, { maxAge: "1d" }));

app.get("*", (_, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.warn("index.html not found at", indexPath);
    res.status(404).json({ error: "Frontend not built. Run: npm run build" });
  }
});

io.on("connection", (socket) => {
  let currentRoom = null;
  const userId = socket.id.slice(0, 8);

  // Time sync - minimal response
  socket.on("timeSync", (data, cb) => {
    const now = Date.now();
    cb?.({ t0: data?.t0, t1: now, t2: now });
  });

  socket.on("createRoom", (data, cb) => {
    const roomId = generateRoomCode();
    const now = Date.now();
    rooms.set(roomId, createRoomState({
      roomId,
      user: { id: userId, socketId: socket.id, deviceName: data?.deviceName || "Host", isHost: true },
    }));
    socket.join(roomId);
    currentRoom = roomId;
    cb?.({ success: true, room: serializeRoom(rooms.get(roomId)), serverTime: now });
  });

  socket.on("joinRoom", (data, cb) => {
    const room = rooms.get(data.roomId?.toUpperCase());
    if (!room) return cb?.({ success: false, error: "Room not found" });

    room.users.set(userId, { id: userId, socketId: socket.id, deviceName: data.deviceName || "Device", isHost: false });
    socket.join(room.id);
    currentRoom = room.id;

    const now = Date.now();
    const pos = getCurrentTimestamp(room);

    cb?.({ success: true, room: serializeRoom(room), serverTime: now, timestamp: pos });
    io.to(room.id).emit("userJoined", { user: room.users.get(userId), users: Array.from(room.users.values()) });

    if (room.currentTrack) {
      socket.emit("syncState", { room: serializeRoom(room), track: room.currentTrack, isPlaying: room.isPlaying, timestamp: pos, serverTime: now });
    }
  });

  socket.on("leaveRoom", (_, cb) => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.users.delete(userId);
      socket.leave(currentRoom);
      io.to(currentRoom).emit("userLeft", { userId, users: Array.from(room.users.values()) });
      if (room.users.size === 0) rooms.delete(currentRoom);
      currentRoom = null;
    }
    cb?.({ success: true });
  });

  socket.on("setTrack", (data, cb) => {
    if (!currentRoom) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    const { track } = data;
    if (!track?.streamUrl && !track?.url) return cb?.({ success: false, error: "Invalid track" });

    const now = Date.now();
    const currentTrack = setCurrentTrack(room, track, { autoplay: true });

    cb?.({ success: true, serverTime: now, room: serializeRoom(room) });
    io.to(currentRoom).emit("trackChanged", { track: currentTrack, isPlaying: true, timestamp: 0, serverTime: now, room: serializeRoom(room) });
  });

  socket.on("play", (_, cb) => {
    if (!currentRoom) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room) return cb?.({ success: false, error: "Room not found" });
    const user = room.users.get(userId);
    if (!user?.isHost) return cb?.({ success: false, error: "Not host" });

    const now = Date.now();
    updatePlayback(room, { isPlaying: true, timestamp: room.playbackState.timestamp, startedAt: now });

    cb?.({ success: true, serverTime: now, timestamp: room.playbackState.timestamp, room: serializeRoom(room) });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: true, timestamp: room.playbackState.timestamp, serverTime: now, room: serializeRoom(room) });
  });

  socket.on("pause", (_, cb) => {
    if (!currentRoom) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room) return cb?.({ success: false, error: "Room not found" });
    const user = room.users.get(userId);
    if (!user?.isHost) return cb?.({ success: false, error: "Not host" });

    const now = Date.now();
    const timestamp = getCurrentTimestamp(room);
    updatePlayback(room, { isPlaying: false, timestamp });

    cb?.({ success: true, serverTime: now, timestamp: room.playbackState.timestamp, room: serializeRoom(room) });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: false, timestamp: room.playbackState.timestamp, serverTime: now, room: serializeRoom(room) });
  });

  socket.on("seek", (data, cb) => {
    if (!currentRoom) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    const now = Date.now();
    room.playbackState.timestamp = data.timestamp;
    if (room.isPlaying) room.playbackState.startedAt = now;
    room.lastMutationAt = now;

    cb?.({ success: true, serverTime: now, room: serializeRoom(room) });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: room.isPlaying, timestamp: data.timestamp, serverTime: now, seeked: true, room: serializeRoom(room) });
  });

  socket.on("requestSync", (_, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    const now = Date.now();
    cb?.({ success: true, room: serializeRoom(room), track: room.currentTrack, isPlaying: room.isPlaying, timestamp: getCurrentTimestamp(room), serverTime: now });
  });

  socket.on("hostSync", (data, cb) => {
    if (!currentRoom) return cb?.({ success: false });
    const room = rooms.get(currentRoom);
    if (!room) return cb?.({ success: false });
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false });

    const now = Date.now();
    let pos = data.position;

    // Store the exact position from host
    room.playbackState.timestamp = pos;
    room.isPlaying = data.isPlaying;
    room.playbackState.startedAt = data.isPlaying ? now : null;
    room.playbackState.lastHostSync = now;
    room.lastMutationAt = now;

    // Send sync beacon to all listeners with server timestamp for latency compensation
    socket.to(currentRoom).emit("syncBeacon", { 
      timestamp: pos, 
      isPlaying: data.isPlaying, 
      serverTime: now,
      hostTime: data.serverTime || now,
      room: serializeRoom(room)
    });
    cb?.({ success: true, serverTime: now });
  });

  socket.on("queue:add", (data, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!data?.track) return cb?.({ success: false, error: "Invalid track" });

    const queued = addToQueue(room, data.track);
    io.to(currentRoom).emit("queueUpdated", { room: serializeRoom(room), queue: room.queue, history: room.history });
    cb?.({ success: true, queued, room: serializeRoom(room) });
  });

  socket.on("queue:remove", (data, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    removeFromQueue(room, data?.trackId);
    io.to(currentRoom).emit("queueUpdated", { room: serializeRoom(room), queue: room.queue, history: room.history });
    cb?.({ success: true, room: serializeRoom(room) });
  });

  socket.on("queue:clear", (_, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    clearQueue(room);
    io.to(currentRoom).emit("queueUpdated", { room: serializeRoom(room), queue: room.queue, history: room.history });
    cb?.({ success: true, room: serializeRoom(room) });
  });

  socket.on("track:next", (_, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    const nextTrack = advanceTrack(room);
    io.to(currentRoom).emit("trackChanged", { track: room.currentTrack, isPlaying: room.isPlaying, timestamp: 0, serverTime: Date.now(), room: serializeRoom(room) });
    io.to(currentRoom).emit("queueUpdated", { room: serializeRoom(room), queue: room.queue, history: room.history });
    cb?.({ success: true, track: nextTrack, room: serializeRoom(room) });
  });

  socket.on("track:previous", (_, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    const previousTrack = moveToPreviousTrack(room);
    io.to(currentRoom).emit("trackChanged", { track: room.currentTrack, isPlaying: room.isPlaying, timestamp: 0, serverTime: Date.now(), room: serializeRoom(room) });
    io.to(currentRoom).emit("queueUpdated", { room: serializeRoom(room), queue: room.queue, history: room.history });
    cb?.({ success: true, track: previousTrack, room: serializeRoom(room) });
  });

  socket.on("track:end", (_, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    const nextTrack = advanceTrack(room);
    io.to(currentRoom).emit("trackChanged", { track: room.currentTrack, isPlaying: room.isPlaying, timestamp: 0, serverTime: Date.now(), room: serializeRoom(room) });
    io.to(currentRoom).emit("queueUpdated", { room: serializeRoom(room), queue: room.queue, history: room.history });
    cb?.({ success: true, track: nextTrack, room: serializeRoom(room) });
  });

  socket.on("room:repeat", (data, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    room.repeatMode = data?.repeatMode || (room.repeatMode === 'off' ? 'all' : room.repeatMode === 'all' ? 'one' : 'off');
    room.lastMutationAt = Date.now();
    io.to(currentRoom).emit("roomState", serializeRoom(room));
    cb?.({ success: true, room: serializeRoom(room) });
  });

  socket.on("room:shuffle", (data, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    room.shuffleMode = typeof data?.shuffleMode === "boolean" ? data.shuffleMode : !room.shuffleMode;
    room.lastMutationAt = Date.now();
    io.to(currentRoom).emit("roomState", serializeRoom(room));
    cb?.({ success: true, room: serializeRoom(room) });
  });

  socket.on("room:volume", (data, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });

    room.volume = Math.max(0, Math.min(100, Number(data?.volume ?? room.volume)));
    room.lastMutationAt = Date.now();
    io.to(currentRoom).emit("roomState", serializeRoom(room));
    cb?.({ success: true, room: serializeRoom(room) });
  });

  // Chat - send to all users in room
  socket.on("chat:send", (data) => {
    if (!currentRoom || !rooms.has(currentRoom)) return;
    const room = rooms.get(currentRoom);
    const user = room.users.get(userId);
    if (!user || !data?.text?.trim()) return;

    const msg = {
      id: `${Date.now()}-${userId}`,
      userId,
      userName: user.deviceName || 'User',
      text: data.text.trim().slice(0, 500),
      timestamp: Date.now()
    };
    io.to(currentRoom).emit("chat:message", msg);
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.users.delete(userId);
      io.to(currentRoom).emit("userLeft", { userId, users: Array.from(room.users.values()) });
      if (room.users.size === 0) rooms.delete(currentRoom);
    }
  });
});

server.listen(PORT, () => console.log(`Nebula Sync running on port ${PORT}`));
