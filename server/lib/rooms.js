export const rooms = new Map();

export const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

export function getCurrentTimestamp(room) {
  if (!room?.currentTrack) return 0;
  if (!room.isPlaying || !room.playbackState?.startedAt) {
    return room.playbackState?.timestamp || 0;
  }

  return room.playbackState.timestamp + (Date.now() - room.playbackState.startedAt) / 1000;
}

export function normalizeTrack(track) {
  if (!track) return null;

  const id = String(track.id || track.jamendoId || track.trackId || Date.now());
  const streamUrl = track.streamUrl || track.audio || track.url || track.fallbackUrl || '';

  return {
    id,
    title: track.title || track.name || 'Unknown Track',
    artistName: track.artistName || track.artist_name || '',
    albumName: track.albumName || track.album_name || '',
    thumbnail: track.thumbnail || track.image || track.album_image || '',
    duration: Number(track.duration || 0),
    streamUrl,
    audioDownloadUrl: track.audioDownloadUrl || track.audiodownload || '',
    shareUrl: track.shareUrl || track.shareurl || '',
    licenseUrl: track.licenseUrl || track.license_ccurl || '',
    source: track.source || 'jamendo',
    jamendoId: String(track.jamendoId || track.id || ''),
    isYouTube: Boolean(track.isYouTube),
    videoId: track.videoId || null,
  };
}

export function createRoomState({ roomId, user }) {
  return {
    id: roomId,
    users: new Map([[user.id, user]]),
    hostId: user.id,
    currentTrack: null,
    queue: [],
    history: [],
    isPlaying: false,
    repeatMode: 'off',
    shuffleMode: false,
    volume: 70,
    playbackState: { timestamp: 0, startedAt: null },
    lastMutationAt: Date.now(),
  };
}

export function serializeRoom(room) {
  if (!room) return null;

  const timestamp = getCurrentTimestamp(room);
  return {
    id: room.id,
    hostId: room.hostId,
    users: Array.from(room.users.values()),
    currentTrack: room.currentTrack,
    queue: room.queue,
    history: room.history,
    isPlaying: room.isPlaying,
    repeatMode: room.repeatMode,
    shuffleMode: room.shuffleMode,
    volume: room.volume,
    masterTimestamp: timestamp,
    lastSyncTime: room.playbackState?.startedAt || room.lastMutationAt || Date.now(),
  };
}

function isDuplicateTrack(queue, track) {
  return queue.some((item) => item.id === track.id || item.streamUrl === track.streamUrl);
}

export function addToQueue(room, track) {
  const normalized = normalizeTrack(track);
  if (!room || !normalized) return null;
  if (isDuplicateTrack(room.queue, normalized) || room.currentTrack?.id === normalized.id) return normalized;

  room.queue.push(normalized);
  room.lastMutationAt = Date.now();
  return normalized;
}

export function removeFromQueue(room, trackId) {
  if (!room || !trackId) return null;
  const index = room.queue.findIndex((track) => track.id === trackId);
  if (index < 0) return null;
  const [removed] = room.queue.splice(index, 1);
  room.lastMutationAt = Date.now();
  return removed;
}

export function clearQueue(room) {
  if (!room) return;
  room.queue = [];
  room.lastMutationAt = Date.now();
}

export function setCurrentTrack(room, track, { autoplay = true } = {}) {
  if (!room) return null;
  const normalized = normalizeTrack(track);
  if (!normalized) return null;

  if (room.currentTrack) {
    room.history = [room.currentTrack, ...room.history].slice(0, 50);
  }

  room.currentTrack = normalized;
  room.isPlaying = autoplay;
  room.playbackState = {
    timestamp: 0,
    startedAt: autoplay ? Date.now() : null,
  };
  room.lastMutationAt = Date.now();
  return normalized;
}

export function updatePlayback(room, { isPlaying, timestamp, startedAt = null }) {
  if (!room) return null;

  const now = Date.now();
  room.isPlaying = Boolean(isPlaying);
  room.playbackState.timestamp = Number(timestamp || 0);
  room.playbackState.startedAt = room.isPlaying ? startedAt || now : null;
  room.lastMutationAt = now;
  return getCurrentTimestamp(room);
}

export function moveToPreviousTrack(room) {
  if (!room) return null;

  const previous = room.history.shift();
  if (!previous) return null;

  if (room.currentTrack) {
    room.queue.unshift(room.currentTrack);
  }

  room.currentTrack = previous;
  room.isPlaying = true;
  room.playbackState = { timestamp: 0, startedAt: Date.now() };
  room.lastMutationAt = Date.now();
  return previous;
}

export function advanceTrack(room) {
  if (!room) return null;

  let nextTrack = null;
  if (room.shuffleMode && room.queue.length > 1) {
    const index = Math.floor(Math.random() * room.queue.length);
    nextTrack = room.queue.splice(index, 1)[0];
  } else {
    nextTrack = room.queue.shift() || null;
  }

  if (!nextTrack) {
    if (room.repeatMode === 'one' && room.currentTrack) {
      room.playbackState = { timestamp: 0, startedAt: Date.now() };
      room.isPlaying = true;
      room.lastMutationAt = Date.now();
      return room.currentTrack;
    }

    if (room.repeatMode === 'all' && room.history.length > 0) {
      nextTrack = room.history.pop();
    } else {
      room.isPlaying = false;
      room.playbackState = { timestamp: 0, startedAt: null };
      room.lastMutationAt = Date.now();
      return null;
    }
  }

  if (room.currentTrack) {
    room.history = [room.currentTrack, ...room.history].slice(0, 50);
  }

  room.currentTrack = nextTrack;
  room.isPlaying = true;
  room.playbackState = { timestamp: 0, startedAt: Date.now() };
  room.lastMutationAt = Date.now();
  return nextTrack;
}
