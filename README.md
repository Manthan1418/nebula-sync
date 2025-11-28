# 🎵 SyncSound - Group Music Listening Platform

A real-time synchronized music listening platform that allows multiple devices to listen to music in perfect sync. Built with React, Node.js/Express, and Socket.io.

## 🎯 Features

✨ **Synchronization**
- Real-time audio synchronization across multiple devices
- Automatic drift detection and correction (< 100ms tolerance)
- Timestamp-based sync with server authority
- Smooth playback experience with minimal latency

🚀 **Room Management**
- Auto-generated 6-digit alphanumeric room codes
- One-click room creation and easy joining
- Support for unlimited devices per room
- Automatic cleanup of empty rooms

🎶 **Playback Control**
- Synchronized play/pause/seek across all devices
- Track management and real-time updates
- Device list with connection status
- Host-based control system

⚡ **Real-time Communication**
- WebSocket-based Socket.io for instant messaging
- Dual transport support (websocket + polling)
- Graceful reconnection handling
- Device heartbeat monitoring

## 📁 Project Structure

```
nebula-sync/
├── FE/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components (CreateRoom, JoinRoom, Room)
│   │   ├── hooks/               # Custom hooks (useRoom, usePlayback)
│   │   ├── lib/                 # Utilities (socket connection)
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── BE/                          # Backend (Node.js + Express)
│   ├── server.js                # Main server file
│   ├── roomManager.js           # Room management logic
│   ├── syncEngine.js            # Synchronization engine
│   ├── eventHandlers.js         # WebSocket event handlers
│   ├── utils.js                 # Utility functions
│   ├── package.json
│   ├── .env                     # Environment variables
│   ├── .env.example
│   └── README.md
│
├── FRONTEND_INTEGRATION.md      # Frontend integration guide
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### 1. Start Backend

```bash
cd BE
npm install
npm start
```

Backend will run on `http://localhost:3000`

### 2. Start Frontend

```bash
cd FE
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Create or Join a Room

- **Create Room**: Enter device name and click "Create Room" to generate a new room
- **Join Room**: Enter room code and device name to join an existing room

## 📝 API Reference

### HTTP Endpoints

**Health Check**
```
GET /health
```
Returns server status and active room count.

**Get Room Info**
```
GET /room/:roomId
```
Returns information about a specific room.

### WebSocket Events

#### Client → Server
- `createRoom` - Create new room
- `joinRoom` - Join existing room
- `leaveRoom` - Leave current room
- `setTrack` - Set current track
- `playRequest` - Start playback
- `pauseRequest` - Pause playback
- `seekRequest` - Seek to timestamp
- `deviceHeartbeat` - Keep-alive signal

#### Server → Client
- `roomCreated` - Room created notification
- `trackChanged` - Track changed notification
- `playStarted` - Playback started
- `pauseStarted` - Playback paused
- `seekUpdated` - Position updated
- `syncBeacon` - Sync information broadcast
- `syncUpdate` - Sync correction signal
- `deviceUpdateList` - Device list updated

See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for detailed integration guide.

## 🔧 Configuration

### Backend Environment Variables

```env
# Server port
PORT=3000

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Node environment
NODE_ENV=development
```

### Frontend Environment Variables

```env
# Backend socket URL
VITE_SOCKET_URL=http://localhost:3000
```

## 🎨 Color Scheme

The project uses a subtle black/white/gray color palette:

- **Light Mode**: 98% white background, 12% dark text
- **Dark Mode**: 8% black background, 95% white text
- **Accents**: Subtle grays (20%, 50%, 80%) instead of vibrant neons

## 🔄 Synchronization Algorithm

### Master Timestamp Model
1. Server maintains master playback timestamp
2. Every 5 seconds, server broadcasts sync beacon with:
   - Current playback position
   - Server time (for latency compensation)
   - Track duration
   - Playing state
3. If device drifts > 100ms:
   - Server calculates correction
   - Sends `syncUpdate` event
   - Client automatically seeks to correction
4. All devices remain within 100ms tolerance

### Sync Flow
```
Multiple devices playing
    ↓
Server calculates drift
    ↓
Drift > 100ms?
    ├─ Yes → Send syncUpdate with target timestamp
    │        Clients seek to target
    └─ No  → Continue normal playback
```

## 🛠️ Development

### Adding New Features

1. **Backend**: Add handler in `BE/eventHandlers.js`
2. **Frontend**: Create hook in `FE/src/hooks/`
3. **Integration**: Update `FRONTEND_INTEGRATION.md`

### Testing

```bash
# Terminal 1 - Backend
cd BE && npm run dev

# Terminal 2 - Frontend
cd FE && npm run dev

# Terminal 3 - Second device (different browser profile)
# Open http://localhost:5173
```

### Debug Commands

Backend exposes debug event:
```javascript
socket.emit('_debug_getRoomStats', {}, (response) => {
  console.log(response.stats);
});
```

## 📊 Performance

- **Memory**: ~1KB per room + 100 bytes per user
- **Bandwidth**: ~2KB per sync beacon per room
- **Latency**: Optimized for < 100ms sync tolerance
- **Scalability**: Thousands of rooms with horizontal scaling

## 🔐 Architecture Notes

- **No Authentication**: Rooms are public and code-based
- **In-Memory Storage**: Room data stored in RAM (not persistent)
- **Server-Authoritative**: Backend controls sync state
- **Drift Correction**: Automatic adjustment via Socket.io events

## 📱 Supported Devices

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Tablets (iPad, Android tablets)
- Any device with WebSocket support

## 🐛 Troubleshooting

### Connection Issues
- Check backend is running on port 3000
- Verify frontend can reach backend URL
- Check firewall allows WebSocket connections

### Sync Issues
- Ensure network latency is acceptable
- Check drift threshold in backend config
- Monitor sync beacons in console

### Room Issues
- Room codes are case-insensitive
- Empty rooms are cleaned up after 5 minutes
- Max attempts to generate code is 100

## 📚 Documentation

- **Backend**: See `/BE/README.md`
- **Frontend Integration**: See `/FRONTEND_INTEGRATION.md`
- **API Reference**: See backend README for detailed WebSocket events

## 🚢 Deployment

### Backend Deployment
```bash
# Set environment variables
export PORT=3000
export FRONTEND_URL=https://your-frontend-domain.com
export NODE_ENV=production

# Start server
npm start
```

### Frontend Deployment
```bash
# Build frontend
npm run build

# Deploy dist/ folder to static hosting (Vercel, Netlify, etc.)
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY BE/ .
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

Feel free to open issues and submit pull requests for improvements.

## 📄 License

MIT License - feel free to use this project for personal and commercial purposes.

## 🎵 What's Playing?

Try these test URLs for audio:
- [Sample MP3](https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3)
- [Sample WAV](https://www.soundhelix.com/examples/wav/SoundHelix-Song-1.wav)

---

**Built with ❤️ for synchronized music experiences**

Questions? Check the documentation or open an issue!
