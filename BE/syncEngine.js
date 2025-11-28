/**
 * Sync Engine - Handles real-time audio synchronization across devices
 * Implements drift detection and correction
 */
class SyncEngine {
  constructor() {
    // Sync configuration
    this.DRIFT_THRESHOLD_MS = 100; // Maximum allowed drift in milliseconds
    this.SYNC_CHECK_INTERVAL = 5000; // How often to check and correct sync
    this.INITIAL_SYNC_WINDOW = 2000; // Grace period for initial sync (ms)
    this.MAX_SEEK_DELTA = 1000; // Max milliseconds to seek automatically
  }

  /**
   * Get current server timestamp (for synchronization reference)
   */
  getCurrentTimestamp(room) {
    if (!room || !room.isPlaying || !room.playbackState.startedAt) {
      return room?.playbackState?.timestamp || 0;
    }

    const elapsed = Date.now() - room.playbackState.startedAt;
    return room.playbackState.timestamp + elapsed / 1000; // Convert to seconds
  }

  /**
   * Calculate sync correction needed for a room
   * Returns correction in milliseconds (positive = slow down, negative = speed up)
   */
  calculateCorrection(room) {
    if (!room || !room.isPlaying) {
      return 0;
    }

    const expectedTimestamp = this.getCurrentTimestamp(room);
    const trackDuration = room.currentTrack?.duration || 0;

    // Don't correct if we're at or past the end
    if (expectedTimestamp >= trackDuration) {
      return 0;
    }

    // Return milliseconds as correction
    return expectedTimestamp * 1000;
  }

  /**
   * Check if devices are in sync
   */
  isInSync(device1Timestamp, device2Timestamp, toleranceMs = this.DRIFT_THRESHOLD_MS) {
    const diff = Math.abs(device1Timestamp * 1000 - device2Timestamp * 1000);
    return diff <= toleranceMs;
  }

  /**
   * Calculate required seek for a device to get in sync
   */
  calculateSeekDelta(deviceTimestamp, masterTimestamp) {
    // Convert master timestamp from seconds to milliseconds for consistency
    const masterMs = masterTimestamp * 1000;
    const deviceMs = deviceTimestamp * 1000;
    const delta = masterMs - deviceMs;

    // Only return seek if delta exceeds threshold
    if (Math.abs(delta) < 100) {
      return 0;
    }

    // Cap the seek to prevent jumping too far
    if (Math.abs(delta) > this.MAX_SEEK_DELTA) {
      return Math.sign(delta) * this.MAX_SEEK_DELTA;
    }

    return delta;
  }

  /**
   * Get sync info for a room (for debugging)
   */
  getSyncInfo(room) {
    if (!room) {
      return { synced: false, error: 'Room not found' };
    }

    if (!room.isPlaying) {
      return { synced: true, status: 'Not playing' };
    }

    const masterTimestamp = this.getCurrentTimestamp(room);
    const userCount = room.users.size;
    const syncInfo = {
      masterTimestamp,
      userCount,
      users: [],
      drift: 0,
      synced: true,
    };

    // Calculate drift from each user (in a real system, we'd track client timestamps)
    let maxDrift = 0;
    for (const [userId, user] of room.users.entries()) {
      const drift = Math.random() * 200 - 100; // Simulated drift for demo
      maxDrift = Math.max(maxDrift, Math.abs(drift));
      syncInfo.users.push({
        userId,
        deviceName: user.deviceName,
        drift: Math.round(drift),
      });
    }

    syncInfo.drift = Math.round(maxDrift);
    syncInfo.synced = maxDrift <= this.DRIFT_THRESHOLD_MS;

    return syncInfo;
  }

  /**
   * Generate a sync beacon (timestamp and metadata for clients to use)
   */
  generateSyncBeacon(room) {
    return {
      masterTimestamp: this.getCurrentTimestamp(room),
      serverTime: Date.now(),
      driftThreshold: this.DRIFT_THRESHOLD_MS,
      isPlaying: room.isPlaying,
      track: room.currentTrack
        ? {
            id: room.currentTrack.id,
            title: room.currentTrack.title,
            duration: room.currentTrack.duration,
          }
        : null,
    };
  }

  /**
   * Handle play command
   */
  handlePlayCommand(room, timestamp = 0) {
    if (!room) return false;

    room.isPlaying = true;
    room.playbackState.timestamp = timestamp;
    room.playbackState.startedAt = Date.now();

    return {
      success: true,
      masterTimestamp: this.getCurrentTimestamp(room),
      startedAt: room.playbackState.startedAt,
    };
  }

  /**
   * Handle pause command
   */
  handlePauseCommand(room) {
    if (!room) return false;

    room.isPlaying = false;
    room.playbackState.timestamp = this.getCurrentTimestamp(room);
    room.playbackState.startedAt = null;

    return {
      success: true,
      pausedAt: room.playbackState.timestamp,
    };
  }

  /**
   * Handle seek command
   */
  handleSeekCommand(room, seekTimestamp) {
    if (!room) return false;

    room.playbackState.timestamp = seekTimestamp;
    if (room.isPlaying) {
      room.playbackState.startedAt = Date.now();
    }

    return {
      success: true,
      newTimestamp: this.getCurrentTimestamp(room),
    };
  }

  /**
   * Handle track change
   */
  handleTrackChange(room, track) {
    if (!room) return false;

    // Ensure track has all required fields with defaults
    room.currentTrack = {
      id: track.id || Date.now().toString(),
      title: track.title || 'Unknown Track',
      artist: track.artist || '',
      url: track.url,
      duration: track.duration || 0,
      addedAt: Date.now(),
    };
    room.playbackState.timestamp = 0;
    room.playbackState.startedAt = Date.now(); // Auto-play new track
    room.isPlaying = true;

    return {
      success: true,
      track: room.currentTrack,
      startedAt: room.playbackState.startedAt,
    };
  }

  /**
   * Validate track object
   */
  validateTrack(track) {
    // Only require url - other fields are optional
    return (
      track &&
      typeof track.url === 'string' &&
      track.url.length > 0
    );
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine();
