/**
 * Nebula Sync - Frontend Application
 * Real-time synchronized music playback
 */

// ============================================
// SOCKET CONNECTION
// ============================================

// Dynamic WebSocket URL - works on localhost and production
const SOCKET_URL = window.location.origin;
let socket = null;
let isConnected = false;
let isHost = false;
let currentRoomId = null;

// Connect to server
function connectSocket() {
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('✅ Connected to server');
    isConnected = true;
    updateConnectionStatus(true);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    isConnected = false;
    updateConnectionStatus(false);
  });

  socket.on('connect_error', (error) => {
    console.error('⚠️ Connection error:', error.message);
    updateConnectionStatus(false);
  });

  // Room events
  socket.on('roomCreated', (data) => {
    console.log('Room created:', data.roomId);
  });

  socket.on('userJoined', (data) => {
    console.log('User joined:', data.user);
    updateUsersList(data.users);
    showToast(`${data.user.deviceName} joined the room`, 'success');
  });

  socket.on('userLeft', (data) => {
    console.log('User left:', data.userId);
    updateUsersList(data.users);
    showToast('A user left the room');
  });

  // Playback events
  socket.on('trackChanged', (data) => {
    console.log('Track changed:', data);
    handleTrackChanged(data);
  });

  socket.on('playbackUpdate', (data) => {
    console.log('Playback update:', data);
    handlePlaybackUpdate(data);
  });

  socket.on('syncState', (data) => {
    console.log('Sync state received:', data);
    handleSyncState(data);
  });
}

// ============================================
// UI HELPERS
// ============================================

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connection-status');
  const statusText = statusEl.querySelector('.status-text');
  const createBtn = document.getElementById('create-room-btn');
  const joinBtn = document.getElementById('join-room-btn');

  if (connected) {
    statusEl.classList.add('connected');
    statusText.textContent = 'Connected';
    createBtn.disabled = false;
    joinBtn.disabled = false;
  } else {
    statusEl.classList.remove('connected');
    statusText.textContent = 'Connecting...';
    createBtn.disabled = true;
    joinBtn.disabled = true;
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// ROOM MANAGEMENT
// ============================================

function createRoom() {
  const hostName = document.getElementById('host-name').value.trim() || 'Host';
  
  socket.emit('createRoom', { deviceName: hostName }, (response) => {
    if (response.success) {
      currentRoomId = response.room.id;
      isHost = true;
      enterRoom(response.room);
      showToast('Room created!', 'success');
    } else {
      showToast(response.error || 'Failed to create room', 'error');
    }
  });
}

function joinRoom(roomCode) {
  const guestName = document.getElementById('guest-name').value.trim() || 'Guest';
  
  socket.emit('joinRoom', { roomId: roomCode, deviceName: guestName }, (response) => {
    if (response.success) {
      currentRoomId = response.room.id;
      isHost = false;
      enterRoom(response.room);
      showToast('Joined room!', 'success');
    } else {
      showToast(response.error || 'Failed to join room', 'error');
    }
  });
}

function leaveRoom() {
  socket.emit('leaveRoom', {}, () => {
    currentRoomId = null;
    isHost = false;
    showScreen('home-screen');
    resetPlayer();
    showToast('Left room');
  });
}

function enterRoom(room) {
  // Update UI
  document.getElementById('current-room-code').textContent = room.id;
  
  // Show/hide host controls
  if (isHost) {
    document.getElementById('host-badge').style.display = 'block';
    document.getElementById('track-input-section').style.display = 'block';
    document.getElementById('listener-notice').style.display = 'none';
    document.getElementById('play-pause-btn').disabled = false;
  } else {
    document.getElementById('host-badge').style.display = 'none';
    document.getElementById('track-input-section').style.display = 'none';
    document.getElementById('listener-notice').style.display = 'flex';
    document.getElementById('play-pause-btn').disabled = true;
  }
  
  // Update users list
  updateUsersList(room.users);
  
  // Handle existing track
  if (room.currentTrack) {
    handleTrackChanged({
      track: room.currentTrack,
      isPlaying: room.isPlaying,
      timestamp: room.masterTimestamp || 0,
    });
  }
  
  showScreen('room-screen');
  initVisualizer();
}

function updateUsersList(users) {
  const listEl = document.getElementById('users-list');
  const countEl = document.getElementById('user-count');
  
  countEl.textContent = `(${users.length})`;
  
  listEl.innerHTML = users.map(user => `
    <div class="user-item">
      <div class="user-avatar ${user.isHost ? 'host' : ''}">${user.isHost ? '👑' : '🎧'}</div>
      <span class="user-name">${escapeHtml(user.deviceName)}</span>
      <span class="user-badge ${user.isHost ? 'host' : ''}">${user.isHost ? 'Host' : 'Listener'}</span>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// AUDIO PLAYER
// ============================================

const audioPlayer = document.getElementById('audio-player');
let isSeeking = false;
let syncInterval = null;

function loadTrack(url) {
  if (!isHost) return;
  
  const title = url.split('/').pop()?.split('?')[0] || 'Audio Track';
  
  socket.emit('setTrack', {
    track: { url, title }
  }, (response) => {
    if (response.success) {
      showToast('Track loaded!', 'success');
    } else {
      showToast(response.error || 'Failed to load track', 'error');
    }
  });
}

function handleTrackChanged(data) {
  const { track, isPlaying, timestamp } = data;
  
  document.getElementById('track-title').textContent = track.title || 'Unknown Track';
  document.getElementById('track-status').textContent = isPlaying ? 'Now Playing' : 'Paused';
  
  // Load audio
  if (audioPlayer.src !== track.url) {
    audioPlayer.src = track.url;
    audioPlayer.load();
  }
  
  // Seek to position
  audioPlayer.currentTime = timestamp || 0;
  
  // Play/pause
  if (isPlaying) {
    audioPlayer.play().catch(e => console.error('Playback error:', e));
    setPlayingState(true);
  } else {
    audioPlayer.pause();
    setPlayingState(false);
  }
  
  if (!isHost) {
    document.getElementById('play-pause-btn').disabled = false;
  }
}

function handlePlaybackUpdate(data) {
  const { isPlaying, timestamp, seeked } = data;
  
  document.getElementById('track-status').textContent = isPlaying ? 'Now Playing' : 'Paused';
  
  if (seeked || Math.abs(audioPlayer.currentTime - timestamp) > 1) {
    audioPlayer.currentTime = timestamp;
  }
  
  if (isPlaying) {
    audioPlayer.play().catch(e => console.error('Playback error:', e));
    setPlayingState(true);
  } else {
    audioPlayer.pause();
    setPlayingState(false);
  }
}

function handleSyncState(data) {
  if (data.track) {
    handleTrackChanged(data);
  }
}

function setPlayingState(playing) {
  const playIcon = document.querySelector('.play-icon');
  const pauseIcon = document.querySelector('.pause-icon');
  const visualizer = document.getElementById('visualizer');
  
  if (playing) {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    visualizer.classList.add('playing');
  } else {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    visualizer.classList.remove('playing');
  }
}

function togglePlayPause() {
  if (!isHost) return;
  
  if (audioPlayer.paused) {
    socket.emit('play', {}, (response) => {
      if (!response.success) {
        showToast(response.error || 'Failed to play', 'error');
      }
    });
  } else {
    socket.emit('pause', {}, (response) => {
      if (!response.success) {
        showToast(response.error || 'Failed to pause', 'error');
      }
    });
  }
}

function seekTo(timestamp) {
  if (!isHost) return;
  
  socket.emit('seek', { timestamp }, (response) => {
    if (!response.success) {
      showToast(response.error || 'Failed to seek', 'error');
    }
  });
}

function resetPlayer() {
  audioPlayer.pause();
  audioPlayer.src = '';
  document.getElementById('track-title').textContent = 'No Track Loaded';
  document.getElementById('track-status').textContent = 'Waiting for host to load a track...';
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('progress-handle').style.left = '0%';
  document.getElementById('current-time').textContent = '0:00';
  document.getElementById('total-time').textContent = '0:00';
  setPlayingState(false);
}

// Audio event listeners
audioPlayer.addEventListener('timeupdate', () => {
  if (isSeeking) return;
  
  const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
  document.getElementById('progress-fill').style.width = progress + '%';
  document.getElementById('progress-handle').style.left = progress + '%';
  document.getElementById('current-time').textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener('loadedmetadata', () => {
  document.getElementById('total-time').textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('ended', () => {
  setPlayingState(false);
});

// ============================================
// VISUALIZER
// ============================================

function initVisualizer() {
  const container = document.querySelector('.wave-container');
  container.innerHTML = '';
  
  for (let i = 0; i < 40; i++) {
    const bar = document.createElement('div');
    bar.className = 'wave-bar';
    bar.style.height = '20%';
    bar.style.animationDelay = `${i * 0.05}s`;
    container.appendChild(bar);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  connectSocket();
  
  // Home screen buttons
  document.getElementById('create-room-btn').addEventListener('click', () => {
    showScreen('create-screen');
  });
  
  document.getElementById('room-code-input').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });
  
  document.getElementById('join-room-btn').addEventListener('click', () => {
    const code = document.getElementById('room-code-input').value.trim();
    if (code.length === 6) {
      document.getElementById('display-room-code').textContent = code;
      showScreen('join-screen');
    } else {
      showToast('Please enter a 6-character room code', 'error');
    }
  });
  
  // Create screen
  document.getElementById('confirm-create-btn').addEventListener('click', createRoom);
  
  document.getElementById('host-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createRoom();
  });
  
  // Join screen
  document.getElementById('confirm-join-btn').addEventListener('click', () => {
    const code = document.getElementById('display-room-code').textContent;
    joinRoom(code);
  });
  
  document.getElementById('guest-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const code = document.getElementById('display-room-code').textContent;
      joinRoom(code);
    }
  });
  
  // Room screen
  document.getElementById('leave-room-btn').addEventListener('click', leaveRoom);
  
  document.getElementById('copy-code-btn').addEventListener('click', () => {
    const code = document.getElementById('current-room-code').textContent;
    navigator.clipboard.writeText(code);
    showToast('Room code copied!', 'success');
  });
  
  document.getElementById('load-track-btn').addEventListener('click', () => {
    const url = document.getElementById('track-url-input').value.trim();
    if (url) {
      loadTrack(url);
    } else {
      showToast('Please enter a track URL', 'error');
    }
  });
  
  document.getElementById('track-url-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const url = e.target.value.trim();
      if (url) loadTrack(url);
    }
  });
  
  document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
  
  // Progress bar seeking
  const progressBar = document.getElementById('progress-bar');
  progressBar.addEventListener('click', (e) => {
    if (!isHost || !audioPlayer.duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const timestamp = percent * audioPlayer.duration;
    seekTo(timestamp);
  });
  
  // Volume control
  const volumeSlider = document.getElementById('volume-slider');
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audioPlayer.volume = volume;
    document.getElementById('volume-value').textContent = e.target.value + '%';
  });
  
  // Set initial volume
  audioPlayer.volume = 0.7;
});

// Request sync periodically for listeners
setInterval(() => {
  if (currentRoomId && !isHost && isConnected) {
    socket.emit('requestSync', {}, (response) => {
      if (response.success && response.isPlaying) {
        const drift = Math.abs(audioPlayer.currentTime - response.timestamp);
        if (drift > 0.5) {
          console.log(`Sync correction: ${drift.toFixed(2)}s drift`);
          audioPlayer.currentTime = response.timestamp;
        }
      }
    });
  }
}, 5000);
