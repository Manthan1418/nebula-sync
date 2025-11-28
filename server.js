import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

// Socket.io with production-ready CORS
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN.split(",").map(s => s.trim()),
    methods: ["GET", "POST"],
    credentials: CLIENT_ORIGIN !== "*",
  },
  // Allow both transports for reliability
  transports: ["websocket", "polling"],
  // Ping timeout for production
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({ 
  origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN.split(",").map(s => s.trim()),
  credentials: CLIENT_ORIGIN !== "*",
}));
app.use(express.json());

// Log connections in production for debugging
io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err.message);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Minimal room logic for MVP (in-memory) ---
const rooms = new Map();
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}

io.on("connection", (socket) => {
  let currentRoom = null;
  let userId = socket.id.substring(0, 8);

  socket.on("createRoom", (data, cb) => {
    const roomId = generateRoomCode();
    rooms.set(roomId, {
      id: roomId,
      users: new Map([[userId, { id: userId, socketId: socket.id, deviceName: data?.deviceName || "Host", isHost: true }]]),
      hostId: userId,
      currentTrack: null,
      isPlaying: false,
      playbackState: { timestamp: 0, startedAt: null },
    });
    socket.join(roomId);
    currentRoom = roomId;
    cb?.({ success: true, room: { id: roomId, users: Array.from(rooms.get(roomId).users.values()), isHost: true } });
    io.to(roomId).emit("roomCreated", { roomId });
  });

  socket.on("joinRoom", (data, cb) => {
    const { roomId, deviceName } = data;
    const room = rooms.get(roomId?.toUpperCase());
    if (!room) return cb?.({ success: false, error: "Room not found" });
    room.users.set(userId, { id: userId, socketId: socket.id, deviceName: deviceName || "Device", isHost: false });
    socket.join(room.id);
    currentRoom = room.id;
    cb?.({ success: true, room: { id: room.id, users: Array.from(room.users.values()), currentTrack: room.currentTrack, isPlaying: room.isPlaying, isHost: false } });
    io.to(room.id).emit("userJoined", { user: room.users.get(userId), users: Array.from(room.users.values()) });
    if (room.currentTrack) {
      socket.emit("syncState", { track: room.currentTrack, isPlaying: room.isPlaying, timestamp: getCurrentTimestamp(room) });
    }
  });

  socket.on("leaveRoom", (data, cb) => {
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
    if (!currentRoom) return cb?.({ success: false, error: "Not in a room" });
    const room = rooms.get(currentRoom);
    const user = room.users.get(userId);
    if (!user?.isHost) return cb?.({ success: false, error: "Only host can set track" });
    const { track } = data;
    if (!track?.url) return cb?.({ success: false, error: "Invalid track" });
    room.currentTrack = { id: track.id || Date.now().toString(), title: track.title || "Unknown Track", url: track.url, duration: track.duration || 0 };
    room.isPlaying = true;
    room.playbackState = { timestamp: 0, startedAt: Date.now() };
    cb?.({ success: true });
    io.to(currentRoom).emit("trackChanged", { track: room.currentTrack, isPlaying: true, timestamp: 0 });
  });

  socket.on("play", (data, cb) => {
    if (!currentRoom) return cb?.({ success: false, error: "Not in a room" });
    const room = rooms.get(currentRoom);
    const user = room.users.get(userId);
    if (!user?.isHost) return cb?.({ success: false, error: "Only host can control playback" });
    room.isPlaying = true;
    room.playbackState.startedAt = Date.now();
    cb?.({ success: true });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: true, timestamp: getCurrentTimestamp(room) });
  });

  socket.on("pause", (data, cb) => {
    if (!currentRoom) return cb?.({ success: false, error: "Not in a room" });
    const room = rooms.get(currentRoom);
    const user = room.users.get(userId);
    if (!user?.isHost) return cb?.({ success: false, error: "Only host can control playback" });
    room.playbackState.timestamp = getCurrentTimestamp(room);
    room.playbackState.startedAt = null;
    room.isPlaying = false;
    cb?.({ success: true });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: false, timestamp: room.playbackState.timestamp });
  });

  socket.on("seek", (data, cb) => {
    if (!currentRoom) return cb?.({ success: false, error: "Not in a room" });
    const room = rooms.get(currentRoom);
    const user = room.users.get(userId);
    if (!user?.isHost) return cb?.({ success: false, error: "Only host can seek" });
    const { timestamp } = data;
    room.playbackState.timestamp = timestamp;
    if (room.isPlaying) room.playbackState.startedAt = Date.now();
    cb?.({ success: true });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: room.isPlaying, timestamp, seeked: true });
  });

  socket.on("requestSync", (data, cb) => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      cb?.({ success: true, track: room.currentTrack, isPlaying: room.isPlaying, timestamp: getCurrentTimestamp(room) });
    } else {
      cb?.({ success: false, error: "Not in a room" });
    }
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

function getCurrentTimestamp(room) {
  if (!room || !room.isPlaying || !room.playbackState.startedAt) return room?.playbackState?.timestamp || 0;
  const elapsed = Date.now() - room.playbackState.startedAt;
  return room.playbackState.timestamp + elapsed / 1000;
}

server.listen(PORT, () => {
  console.log(`Nebula Sync server running on port ${PORT}`);
});
