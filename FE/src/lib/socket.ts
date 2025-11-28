import { io, Socket } from 'socket.io-client';

// Use window.location.origin in production, fallback to env var or localhost for dev
const getSocketUrl = (): string => {
  // In browser production: use same origin (works with Render, Vercel, etc.)
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    return window.location.origin;
  }
  // Dev mode: use env var or localhost
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
};

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    const socketUrl = getSocketUrl();
    console.log('🔌 Connecting to:', socketUrl);
    
    socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
      // Auto-upgrade from polling to websocket
      upgrade: true,
      // Required for cross-origin in some cases
      withCredentials: false,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to backend:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from backend:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WS Error:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });
  }

  return socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const isConnected = (): boolean => {
  return socket?.connected || false;
};
