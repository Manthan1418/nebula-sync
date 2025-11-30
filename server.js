import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase() || ".mp3";
    cb(null, `${uniqueId}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/mp4", "audio/x-m4a"];
  const allowedExts = [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: MP3, WAV, OGG, FLAC, AAC, M4A"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

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

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Log connections in production for debugging
io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err.message);
});

// File upload endpoint using multer
app.post("/api/upload", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log(`File uploaded: ${req.file.originalname} -> ${fileUrl}`);

    return res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// Handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 50MB" });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
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
