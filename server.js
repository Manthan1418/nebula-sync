import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Create uploads directory
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config - simplified
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadsDir),
    filename: (_, file, cb) => cb(null, `${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname).toLowerCase() || ".mp3"}`)
  }),
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"].includes(ext) || file.mimetype.startsWith("audio/"));
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Socket.io - optimized for low-powered servers
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB max payload
});

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir, { maxAge: "1d" }));

// Upload endpoint
app.post("/api/upload", upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file" });
  res.json({ success: true, url: `/uploads/${req.file.filename}`, filename: req.file.originalname });
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large (max 50MB)" });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

// Health & static
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// Room storage with cleanup
const rooms = new Map();
const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function getCurrentTimestamp(room) {
  if (!room?.isPlaying || !room.playbackState?.startedAt) return room?.playbackState?.timestamp || 0;
  return room.playbackState.timestamp + (Date.now() - room.playbackState.startedAt) / 1000;
}

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
    cb?.({ success: true, room: { id: roomId, users: Array.from(rooms.get(roomId).users.values()), isHost: true }, serverTime: now });
  });

  socket.on("joinRoom", (data, cb) => {
    const room = rooms.get(data.roomId?.toUpperCase());
    if (!room) return cb?.({ success: false, error: "Room not found" });
    
    room.users.set(userId, { id: userId, socketId: socket.id, deviceName: data.deviceName || "Device", isHost: false });
    socket.join(room.id);
    currentRoom = room.id;
    
    const now = Date.now();
    const pos = getCurrentTimestamp(room);
    
    cb?.({ success: true, room: { id: room.id, users: Array.from(room.users.values()), currentTrack: room.currentTrack, isPlaying: room.isPlaying, isHost: false }, serverTime: now, timestamp: pos });
    io.to(room.id).emit("userJoined", { user: room.users.get(userId), users: Array.from(room.users.values()) });
    
    if (room.currentTrack) {
      socket.emit("syncState", { track: room.currentTrack, isPlaying: room.isPlaying, timestamp: pos, serverTime: now });
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
    if (!track?.url) return cb?.({ success: false, error: "Invalid track" });
    
    const now = Date.now();
    room.currentTrack = { id: track.id || now.toString(), title: track.title || "Unknown", url: track.url, duration: track.duration || 0 };
    room.isPlaying = true;
    room.playbackState = { timestamp: 0, startedAt: now };
    
    cb?.({ success: true, serverTime: now });
    io.to(currentRoom).emit("trackChanged", { track: room.currentTrack, isPlaying: true, timestamp: 0, serverTime: now });
  });

  socket.on("play", (_, cb) => {
    console.log('Play received, room:', currentRoom, 'userId:', userId);
    if (!currentRoom) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room) return cb?.({ success: false, error: "Room not found" });
    const user = room.users.get(userId);
    console.log('User:', user, 'isHost:', user?.isHost);
    if (!user?.isHost) return cb?.({ success: false, error: "Not host" });
    
    const now = Date.now();
    room.isPlaying = true;
    room.playbackState.startedAt = now;
    
    console.log('Play success, emitting playbackUpdate');
    cb?.({ success: true, serverTime: now, timestamp: room.playbackState.timestamp });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: true, timestamp: room.playbackState.timestamp, serverTime: now });
  });

  socket.on("pause", (_, cb) => {
    console.log('Pause received, room:', currentRoom, 'userId:', userId);
    if (!currentRoom) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room) return cb?.({ success: false, error: "Room not found" });
    const user = room.users.get(userId);
    console.log('User:', user, 'isHost:', user?.isHost);
    if (!user?.isHost) return cb?.({ success: false, error: "Not host" });
    
    const now = Date.now();
    room.playbackState.timestamp = getCurrentTimestamp(room);
    room.playbackState.startedAt = null;
    room.isPlaying = false;
    
    console.log('Pause success, emitting playbackUpdate');
    cb?.({ success: true, serverTime: now, timestamp: room.playbackState.timestamp });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: false, timestamp: room.playbackState.timestamp, serverTime: now });
  });

  socket.on("seek", (data, cb) => {
    if (!currentRoom) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false, error: "Not host" });
    
    const now = Date.now();
    room.playbackState.timestamp = data.timestamp;
    if (room.isPlaying) room.playbackState.startedAt = now;
    
    cb?.({ success: true, serverTime: now });
    io.to(currentRoom).emit("playbackUpdate", { isPlaying: room.isPlaying, timestamp: data.timestamp, serverTime: now, seeked: true });
  });

  socket.on("requestSync", (_, cb) => {
    if (!currentRoom || !rooms.has(currentRoom)) return cb?.({ success: false, error: "Not in room" });
    const room = rooms.get(currentRoom);
    const now = Date.now();
    cb?.({ success: true, track: room.currentTrack, isPlaying: room.isPlaying, timestamp: getCurrentTimestamp(room), serverTime: now });
  });

  socket.on("hostSync", (data, cb) => {
    if (!currentRoom) return cb?.({ success: false });
    const room = rooms.get(currentRoom);
    if (!room.users.get(userId)?.isHost) return cb?.({ success: false });
    
    const now = Date.now();
    let pos = data.position;
    
    // Adjust for network latency if client sent server time estimate
    if (data.serverTime && data.isPlaying) {
      const elapsed = (now - data.serverTime) / 1000;
      if (elapsed > 0 && elapsed < 1) pos += elapsed;
    }
    
    room.playbackState.timestamp = pos;
    room.isPlaying = data.isPlaying;
    room.playbackState.startedAt = data.isPlaying ? now : null;
    
    socket.to(currentRoom).emit("syncBeacon", { timestamp: pos, isPlaying: data.isPlaying, serverTime: now });
    cb?.({ success: true, serverTime: now });
  });

  // Chat - send to all users in room
  socket.on("chat:send", (data) => {
    console.log('Chat received:', data, 'Room:', currentRoom);
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
    console.log('Broadcasting message:', msg);
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
