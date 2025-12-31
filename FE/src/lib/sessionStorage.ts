// Session storage utilities for room persistence

export interface RoomSession {
  roomId: string;
  deviceName: string;
  isHost: boolean;
  roomName: string;
}

const SESSION_KEY = 'nebula_room';

export function saveRoomSession(session: RoomSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export function getRoomSession(): RoomSession | null {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load session:', err);
    return null;
  }
}

export function clearRoomSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

export function hasActiveSession(): boolean {
  return getRoomSession() !== null;
}
