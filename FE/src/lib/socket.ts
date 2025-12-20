import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getUrl = () => typeof window !== 'undefined' && import.meta.env.PROD 
  ? window.location.origin 
  : import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(getUrl(), {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
      upgrade: true,
    });
  }
  return socket;
};

export const getSocket = (): Socket => socket || initializeSocket();

export const closeSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
