import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { roomManager } from './roomManager.js';
import { syncEngine } from './syncEngine.js';
import { setupEventHandlers } from './eventHandlers.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: roomManager.getRoomCount(),
  });
});

// Get room info endpoint
app.get('/room/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    roomId: room.id,
    userCount: room.users.size,
    currentTrack: room.currentTrack,
    isPlaying: room.isPlaying,
  });
});

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // Setup all event handlers
  setupEventHandlers(socket, io, roomManager, syncEngine);

  // Handle disconnection
  socket.on('disconnect', () => {
    const userRoom = roomManager.getUserRoom(socket.id);
    if (userRoom) {
      roomManager.removeUser(userRoom.id, socket.id);
      const room = roomManager.getRoom(userRoom.id);
      if (room) {
        io.to(userRoom.id).emit('deviceUpdateList', {
          devices: Array.from(room.users.values()),
        });
      }
    }
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// Cleanup interval - remove empty rooms every 60 seconds
setInterval(() => {
  roomManager.cleanup();
}, 60000);

// Sync correction broadcast every 5 seconds
setInterval(() => {
  const rooms = roomManager.getAllRooms();
  rooms.forEach((room) => {
    if (room.isPlaying && room.users.size > 0) {
      const correction = syncEngine.calculateCorrection(room);
      if (Math.abs(correction) > 50) {
        io.to(room.id).emit('syncUpdate', {
          correctedTimestamp: syncEngine.getCurrentTimestamp(room),
          correction,
        });
      }
    }
  });
}, 5000);

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🎵 SyncSound Backend Server        ║
║     Ready for synchronized music       ║
╚════════════════════════════════════════╝

  Server running on port ${PORT}
  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
  
  Endpoints:
    GET  /health
    GET  /room/:roomId
    WS   ws://localhost:${PORT}

  WebSocket Events:
    ➔ createRoom
    ➔ joinRoom
    ➔ leaveRoom
    ➔ setTrack
    ➔ playRequest
    ➔ pauseRequest
    ➔ seekRequest
    ➔ deviceHeartbeat
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down gracefully...');
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
