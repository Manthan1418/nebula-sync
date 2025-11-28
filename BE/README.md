# SyncSound Backend

Real-time synchronized music listening platform backend built with Node.js, Express, and Socket.io.

## Features

✨ **Room Management**
- Auto-generated 6-digit alphanumeric room codes
- Collision-resistant room ID generation
- Automatic cleanup of empty rooms after 5 minutes
- Support for unlimited connected devices per room

🎵 **Audio Synchronization**
- Real-time playback state synchronization
- Drift detection and correction (< 100ms tolerance)
- Timestamp-based synchronization beacon every 5 seconds
- Automatic seek correction for out-of-sync devices

⚡ **Real-time Features**
- WebSocket communication via Socket.io
- Dual transport support (websocket + polling fallback)
- Device heartbeat monitoring
- Graceful disconnection handling

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
cd BE
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Start the server:**

   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```

   Production mode:
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` by default.

## Configuration

### Environment Variables

Create a `.env` file in the `BE` directory:

```
# Server port (default: 3000)
PORT=3000

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Node environment
NODE_ENV=development
```

## API Documentation

### HTTP Endpoints

#### Health Check
```
GET /health
```
Returns server status and active room count.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "activeRooms": 5
}
```

#### Get Room Info
```
GET /room/:roomId
```
Returns information about a specific room.

**Response:**
```json
{
  "roomId": "ABC123",
  "userCount": 3,
  "currentTrack": { "title": "Example Song" },
  "isPlaying": true
}
```

### WebSocket Events

#### Client → Server Events

**createRoom**
Creates a new room and adds the user as host.
```javascript
socket.emit('createRoom', { deviceName: 'My Device' }, (response) => {
  // response: { success: true, room: { id, users, isHost } }
});
```

**joinRoom**
Joins an existing room by room ID.
```javascript
socket.emit('joinRoom', { 
  roomId: 'ABC123',
  deviceName: 'My Device' 
}, (response) => {
  // response: { success: true, room: { ...roomData } }
});
```

**leaveRoom**
Leaves the current room.
```javascript
socket.emit('leaveRoom', {}, (response) => {
  // response: { success: true }
});
```

**setTrack**
Changes the current track for all devices in the room.
```javascript
socket.emit('setTrack', {
  track: {
    id: 'track-123',
    title: 'Song Title',
    artist: 'Artist Name',
    url: 'https://example.com/song.mp3',
    duration: 180 // in seconds
  }
}, (response) => {
  // response: { success: true, ... }
});
```

**playRequest**
Starts playback on all devices.
```javascript
socket.emit('playRequest', { timestamp: 0 }, (response) => {
  // response: { success: true, masterTimestamp, startedAt }
});
```

**pauseRequest**
Pauses playback on all devices.
```javascript
socket.emit('pauseRequest', {}, (response) => {
  // response: { success: true, pausedAt }
});
```

**seekRequest**
Seeks to a specific timestamp in the current track.
```javascript
socket.emit('seekRequest', { timestamp: 45 }, (response) => {
  // response: { success: true, newTimestamp }
});
```

**deviceHeartbeat**
Keep-alive signal to maintain connection and receive sync updates.
```javascript
socket.emit('deviceHeartbeat', {}, (response) => {
  // response: { success: true, sync: { ...syncInfo } }
});
```

**requestRoomState**
Requests the current state of the room (useful for reconnection).
```javascript
socket.emit('requestRoomState', {}, (response) => {
  // response: { success: true, state: { ...fullRoomState } }
});
```

#### Server → Client Events

**roomCreated**
Broadcast when a new room is created.
```javascript
socket.on('roomCreated', (data) => {
  // data: { roomId: 'ABC123' }
});
```

**trackChanged**
Broadcast when a new track is set.
```javascript
socket.on('trackChanged', (data) => {
  // data: { track, isPlaying, masterTimestamp }
});
```

**playStarted**
Broadcast when playback starts.
```javascript
socket.on('playStarted', (data) => {
  // data: { masterTimestamp, startedAt }
});
```

**pauseStarted**
Broadcast when playback is paused.
```javascript
socket.on('pauseStarted', (data) => {
  // data: { pausedAt }
});
```

**seekUpdated**
Broadcast when track position is changed.
```javascript
socket.on('seekUpdated', (data) => {
  // data: { timestamp, masterTimestamp }
});
```

**syncBeacon**
Periodic sync information broadcast (every 5 seconds).
```javascript
socket.on('syncBeacon', (data) => {
  // data: { 
  //   masterTimestamp,
  //   serverTime,
  //   driftThreshold,
  //   isPlaying,
  //   track 
  // }
});
```

**syncUpdate**
Correction signal if devices drift out of sync.
```javascript
socket.on('syncUpdate', (data) => {
  // data: { correctedTimestamp, correction }
});
```

**deviceUpdateList**
Broadcast when devices join or leave a room.
```javascript
socket.on('deviceUpdateList', (data) => {
  // data: { devices: [{ socketId, deviceName, isHost }, ...] }
});
```

## Architecture

### Core Modules

**server.js**
- Express server setup with Socket.io integration
- HTTP endpoints for health checks and room info
- WebSocket connection handler
- Periodic sync broadcasts and room cleanup

**roomManager.js**
- Room creation and management
- User/device tracking
- Collision-resistant room code generation (6-digit alphanumeric)
- Playback state management
- Automatic cleanup of empty rooms

**syncEngine.js**
- Real-time synchronization calculations
- Drift detection and correction
- Playback timestamp management
- Track validation
- Sync beacon generation

**eventHandlers.js**
- WebSocket event handlers for all client events
- Event validation and error handling
- Room state updates and broadcasts
- Debug utilities

## Synchronization Algorithm

The backend uses a **server-authoritative timestamp model** for synchronization:

1. **Master Timestamp**: Server maintains the master playback timestamp
2. **Sync Beacons**: Every 5 seconds, the server broadcasts:
   - Current playback timestamp
   - Server time (for latency compensation)
   - Track duration
   - Playing state
3. **Drift Correction**: If any device drifts > 100ms:
   - Server calculates required correction
   - Sends `syncUpdate` event with target timestamp
   - Client adjusts playback position
4. **Automatic Seeking**: Clients should seek when correction needed

### Sync Update Flow
```
Client A plays at 25.5s
Client B plays at 25.8s
Drift = 300ms (exceeds 100ms threshold)
↓
Server detects drift
↓
Server sends syncUpdate with masterTimestamp
↓
Client B automatically seeks to master timestamp
↓
All clients now synced
```

## Deployment

### Prerequisites for Production
- Node.js 16+
- Environment variables properly configured
- Frontend URL set in CORS configuration

### Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Set environment variables in `.env`
4. Start server: `npm start`

### Docker Support (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Room Code Generation

- **Format**: 6 characters (A-Z, 0-9)
- **Uniqueness**: Collision-resistant algorithm with retry logic
- **Max Attempts**: 100 retries before error
- **Possible Codes**: ~2.1 billion unique combinations

Example codes: `AB12CD`, `XYZ789`, `MUSIC1`

## Error Handling

All events return callback responses with:
```json
{
  "success": true|false,
  "error": "error message if failed",
  "data": "response data if successful"
}
```

Common errors:
- `Room not found` - Room ID doesn't exist
- `User not in any room` - User attempted action without joining a room
- `Invalid track data` - Track object missing required fields
- `Invalid timestamp` - Timestamp is negative or not a number

## Performance Considerations

- **Memory**: Each room uses ~1KB + user data (~100 bytes each)
- **Bandwidth**: ~2KB per sync beacon per room
- **CPU**: Minimal; mostly I/O bound
- **Scalability**: Can support thousands of rooms with horizontal scaling via Redis adapter

## Development

### Adding New Events

1. Add handler in `eventHandlers.js`
2. Emit the event in the appropriate place
3. Clients listen with `socket.on('eventName', handler)`

### Testing Locally

```bash
# Terminal 1 - Backend
cd BE
npm run dev

# Terminal 2 - Frontend  
cd FE
npm run dev

# Terminal 3 - Connect second device
# Open browser to http://localhost:5173 in separate profile/window
```

## Troubleshooting

**Server won't start**
- Check if port 3000 is already in use
- Verify Node.js version (16+)
- Check environment variables in `.env`

**Sync issues**
- Ensure all devices have consistent network latency
- Check drift threshold in `.env`
- Monitor sync beacons for issues

**Connection drops**
- Check CORS configuration
- Verify firewall allows WebSocket connections
- Check browser console for connection errors

## License

MIT

---

For frontend integration, see `/FE/README.md`
