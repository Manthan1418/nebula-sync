/**
 * WebSocket Event Handlers
 * Manages all Socket.io events for the real-time synchronization system
 */
export function setupEventHandlers(socket, io, roomManager, syncEngine) {
  /**
   * Helper: Check if user is the room host
   */
  function isHostUser(room, socketId) {
    for (const [userId, user] of room.users.entries()) {
      if (user.socketId === socketId) {
        return user.isHost;
      }
    }
    return false;
  }
  /**
   * CREATE ROOM
   * Creates a new room and adds the requesting user as host
   */
  socket.on('createRoom', (data, callback) => {
    try {
      const room = roomManager.createRoom();
      const userId = socket.id.substring(0, 8);
      roomManager.addUser(room.id, userId, socket.id, data?.deviceName || 'Device');

      socket.join(room.id);

      const roomData = {
        id: room.id,
        users: Array.from(room.users.values()),
        isHost: true,
      };

      console.log(`[Event] createRoom - Room: ${room.id}, Host: ${userId}`);

      if (callback) callback({ success: true, room: roomData });

      // Notify room
      io.to(room.id).emit('roomCreated', { roomId: room.id });
    } catch (error) {
      console.error('[Event] createRoom error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * JOIN ROOM
   * Adds a user to an existing room
   */
  socket.on('joinRoom', (data, callback) => {
    try {
      const { roomId, deviceName } = data;

      if (!roomId) {
        throw new Error('Room ID is required');
      }

      const room = roomManager.getRoom(roomId);
      if (!room) {
        throw new Error(`Room ${roomId} not found`);
      }

      const userId = socket.id.substring(0, 8);
      roomManager.addUser(roomId, userId, socket.id, deviceName || 'Device');

      socket.join(roomId);

      const roomData = {
        id: room.id,
        users: Array.from(room.users.values()),
        currentTrack: room.currentTrack,
        isPlaying: room.isPlaying,
        isHost: false,
        masterTimestamp: syncEngine.getCurrentTimestamp(room),
      };

      console.log(`[Event] joinRoom - Room: ${roomId}, User: ${userId}`);

      if (callback) callback({ success: true, room: roomData });

      // Notify room of new user
      io.to(roomId).emit('deviceUpdateList', {
        devices: Array.from(room.users.values()),
      });

      // Send sync beacon to new user
      socket.emit('syncBeacon', syncEngine.generateSyncBeacon(room));
    } catch (error) {
      console.error('[Event] joinRoom error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * LEAVE ROOM
   * Removes user from room
   */
  socket.on('leaveRoom', (data, callback) => {
    try {
      const room = roomManager.getUserRoom(socket.id);

      if (room) {
        const userId = socket.id.substring(0, 8);
        roomManager.removeUser(room.id, userId);

        socket.leave(room.id);

        console.log(`[Event] leaveRoom - Room: ${room.id}, User: ${userId}`);

        // Notify remaining users
        if (room.users.size > 0) {
          io.to(room.id).emit('deviceUpdateList', {
            devices: Array.from(room.users.values()),
          });
        }
      }

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('[Event] leaveRoom error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * SET TRACK
   * Changes the current track for the room (HOST ONLY)
   */
  socket.on('setTrack', (data, callback) => {
    try {
      const room = roomManager.getUserRoom(socket.id);

      if (!room) {
        throw new Error('User not in any room');
      }

      // Check if user is host
      if (!isHostUser(room, socket.id)) {
        throw new Error('Only room host can change tracks');
      }

      const { track } = data;
      if (!syncEngine.validateTrack(track)) {
        throw new Error('Invalid track data');
      }

      const result = syncEngine.handleTrackChange(room, track);

      roomManager.updatePlaybackState(room.id, track, true);

      console.log(`[Event] setTrack - Room: ${room.id}, Track: ${track.title} (Host only)`);

      if (callback) callback({ success: true, ...result });

      // Broadcast to all users in room
      io.to(room.id).emit('trackChanged', {
        track,
        isPlaying: true,
        masterTimestamp: syncEngine.getCurrentTimestamp(room),
      });

      // Send sync beacon
      io.to(room.id).emit('syncBeacon', syncEngine.generateSyncBeacon(room));
    } catch (error) {
      console.error('[Event] setTrack error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * PLAY REQUEST
   * Starts playback for all connected devices (HOST ONLY)
   */
  socket.on('playRequest', (data, callback) => {
    try {
      const room = roomManager.getUserRoom(socket.id);

      if (!room) {
        throw new Error('User not in any room');
      }

      // Check if user is host
      if (!isHostUser(room, socket.id)) {
        throw new Error('Only room host can control playback');
      }

      const { timestamp } = data || {};
      const result = syncEngine.handlePlayCommand(room, timestamp || 0);

      roomManager.updatePlaybackState(room.id, room.currentTrack, true);

      console.log(`[Event] playRequest - Room: ${room.id} (Host only)`);

      if (callback) callback({ success: true, ...result });

      // Broadcast play event to all users
      io.to(room.id).emit('playStarted', {
        masterTimestamp: syncEngine.getCurrentTimestamp(room),
        startedAt: result.startedAt,
      });
    } catch (error) {
      console.error('[Event] playRequest error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * PAUSE REQUEST
   * Pauses playback for all connected devices (HOST ONLY)
   */
  socket.on('pauseRequest', (data, callback) => {
    try {
      const room = roomManager.getUserRoom(socket.id);

      if (!room) {
        throw new Error('User not in any room');
      }

      // Check if user is host
      if (!isHostUser(room, socket.id)) {
        throw new Error('Only room host can control playback');
      }

      const result = syncEngine.handlePauseCommand(room);

      roomManager.updatePlaybackState(room.id, room.currentTrack, false);

      console.log(`[Event] pauseRequest - Room: ${room.id} (Host only)`);

      if (callback) callback({ success: true, ...result });

      // Broadcast pause event to all users
      io.to(room.id).emit('pauseStarted', {
        pausedAt: result.pausedAt,
      });
    } catch (error) {
      console.error('[Event] pauseRequest error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * SEEK REQUEST
   * Seeks to a specific timestamp in the current track (HOST ONLY)
   */
  socket.on('seekRequest', (data, callback) => {
    try {
      const room = roomManager.getUserRoom(socket.id);

      if (!room) {
        throw new Error('User not in any room');
      }

      // Check if user is host
      if (!isHostUser(room, socket.id)) {
        throw new Error('Only room host can seek');
      }

      const { timestamp } = data;
      if (typeof timestamp !== 'number' || timestamp < 0) {
        throw new Error('Invalid timestamp');
      }

      const result = syncEngine.handleSeekCommand(room, timestamp);

      console.log(`[Event] seekRequest - Room: ${room.id}, Timestamp: ${timestamp}s (Host only)`);

      if (callback) callback({ success: true, ...result });

      // Broadcast seek event to all users
      io.to(room.id).emit('seekUpdated', {
        timestamp,
        masterTimestamp: syncEngine.getCurrentTimestamp(room),
      });

      // Send sync beacon
      io.to(room.id).emit('syncBeacon', syncEngine.generateSyncBeacon(room));
    } catch (error) {
      console.error('[Event] seekRequest error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * DEVICE HEARTBEAT
   * Keeps track of active devices and detects disconnections
   */
  socket.on('deviceHeartbeat', (data, callback) => {
    try {
      const room = roomManager.getUserRoom(socket.id);

      if (room) {
        roomManager.updateHeartbeat(room.id, socket.id.substring(0, 8));

        // Send current sync info back to device
        const syncInfo = syncEngine.generateSyncBeacon(room);

        if (callback) callback({ success: true, sync: syncInfo });
      } else {
        if (callback) callback({ success: false, error: 'Not in a room' });
      }
    } catch (error) {
      console.error('[Event] deviceHeartbeat error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * REQUEST ROOM STATE
   * Client requests current room state (for reconnection scenarios)
   */
  socket.on('requestRoomState', (data, callback) => {
    try {
      const room = roomManager.getUserRoom(socket.id);

      if (!room) {
        throw new Error('User not in any room');
      }

      const state = {
        roomId: room.id,
        users: Array.from(room.users.values()),
        currentTrack: room.currentTrack,
        isPlaying: room.isPlaying,
        masterTimestamp: syncEngine.getCurrentTimestamp(room),
        syncInfo: syncEngine.generateSyncBeacon(room),
      };

      console.log(`[Event] requestRoomState - Room: ${room.id}`);

      if (callback) callback({ success: true, state });
    } catch (error) {
      console.error('[Event] requestRoomState error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  /**
   * DEBUG: Get room statistics
   * Only for development purposes
   */
  socket.on('_debug_getRoomStats', (data, callback) => {
    try {
      const stats = roomManager.getStats();
      const room = roomManager.getUserRoom(socket.id);

      if (room) {
        const syncInfo = syncEngine.getSyncInfo(room);
        stats.currentRoomSync = syncInfo;
      }

      if (callback) callback({ success: true, stats });
    } catch (error) {
      console.error('[Event] _debug_getRoomStats error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });
}
