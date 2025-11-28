import { v4 as uuidv4 } from 'uuid';

const ROOM_ID_LENGTH = 6;
const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generates a random room code
 */
function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
  }
  return code;
}

/**
 * Room Manager - Handles room creation, user management, and room cleanup
 */
class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.userToRoom = new Map(); // Maps userId to roomId for quick lookup
  }

  /**
   * Create a new room with auto-generated code
   */
  createRoom() {
    let roomCode;
    let attempts = 0;
    const maxAttempts = 100;

    // Collision-resistant room code generation
    do {
      roomCode = generateRoomCode();
      attempts++;
    } while (this.rooms.has(roomCode) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique room code');
    }

    const room = {
      id: roomCode,
      createdAt: Date.now(),
      users: new Map(), // userId -> { socketId, deviceName, isHost }
      currentTrack: null,
      isPlaying: false,
      playbackState: {
        timestamp: 0,
        startedAt: null,
      },
    };

    this.rooms.set(roomCode, room);
    console.log(`[RoomManager] Room created: ${roomCode}`);
    return room;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Add user to room
   */
  addUser(roomId, userId, socketId, deviceName = 'Device') {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    // If user is joining from different socket, remove old connection
    const existingRoom = this.userToRoom.get(userId);
    if (existingRoom && existingRoom !== roomId) {
      this.removeUser(existingRoom, userId);
    }

    const isHost = room.users.size === 0; // First user is host
    room.users.set(userId, {
      socketId,
      deviceName,
      isHost,
      lastHeartbeat: Date.now(),
    });
    this.userToRoom.set(userId, roomId);

    console.log(`[RoomManager] User ${userId} joined room ${roomId} (Total: ${room.users.size})`);
    return room;
  }

  /**
   * Remove user from room
   */
  removeUser(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const removed = room.users.delete(userId);
    this.userToRoom.delete(userId);

    if (removed) {
      console.log(`[RoomManager] User ${userId} left room ${roomId} (Total: ${room.users.size})`);
    }

    // If room is empty, mark for cleanup
    if (room.users.size === 0) {
      room.emptyAt = Date.now();
    } else if (room.emptyAt) {
      delete room.emptyAt;
    }

    return removed;
  }

  /**
   * Update user heartbeat
   */
  updateHeartbeat(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const user = room.users.get(userId);
    if (!user) return false;

    user.lastHeartbeat = Date.now();
    return true;
  }

  /**
   * Get user's room
   */
  getUserRoom(socketId) {
    // Find room that contains this socket
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [userId, user] of room.users.entries()) {
        if (user.socketId === socketId) {
          return room;
        }
      }
    }
    return null;
  }

  /**
   * Get all rooms
   */
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  /**
   * Get room count
   */
  getRoomCount() {
    return this.rooms.size;
  }

  /**
   * Update room playback state
   */
  updatePlaybackState(roomId, track = null, isPlaying = false) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (track) {
      room.currentTrack = {
        ...track,
        addedAt: Date.now(),
      };
    }

    room.isPlaying = isPlaying;
    if (isPlaying) {
      room.playbackState.startedAt = Date.now();
      room.playbackState.timestamp = track?.timestamp || 0;
    } else {
      room.playbackState.timestamp = track?.timestamp || 0;
      room.playbackState.startedAt = null;
    }

    return true;
  }

  /**
   * Get current playback timestamp for room
   */
  getCurrentPlaybackTimestamp(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || !room.isPlaying || !room.playbackState.startedAt) {
      return null;
    }

    const elapsed = Date.now() - room.playbackState.startedAt;
    return room.playbackState.timestamp + elapsed / 1000; // Convert to seconds
  }

  /**
   * Cleanup empty rooms (older than 5 minutes)
   */
  cleanup() {
    const now = Date.now();
    const EMPTY_ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.emptyAt && now - room.emptyAt > EMPTY_ROOM_TIMEOUT) {
        this.rooms.delete(roomId);
        console.log(`[RoomManager] Cleaned up empty room: ${roomId}`);
      }
    }
  }

  /**
   * Debug: Get room statistics
   */
  getStats() {
    const stats = {
      totalRooms: this.rooms.size,
      totalUsers: 0,
      activeRooms: 0,
      emptyRooms: 0,
      rooms: [],
    };

    for (const room of this.rooms.values()) {
      stats.totalUsers += room.users.size;
      if (room.users.size > 0) {
        stats.activeRooms++;
      } else {
        stats.emptyRooms++;
      }

      stats.rooms.push({
        id: room.id,
        users: room.users.size,
        isPlaying: room.isPlaying,
        track: room.currentTrack?.title || 'None',
      });
    }

    return stats;
  }
}

// Export singleton instance
export const roomManager = new RoomManager();
