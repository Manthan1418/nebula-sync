/**
 * Simplified Time Sync - NTP-like clock synchronization
 * Formula: offset = ((t1 - t0) + (t2 - t3)) / 2
 */
import { getSocket } from './socket';

let offset = 0;
let isCalibrated = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

async function measure(): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    const t0 = Date.now();
    
    const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
    socket.emit('timeSync', { t0 }, (res: { t1: number; t2: number }) => {
      clearTimeout(timeout);
      if (!res?.t1) return reject(new Error('Invalid response'));
      const t3 = Date.now();
      resolve(((res.t1 - t0) + (res.t2 - t3)) / 2);
    });
  });
}

export async function calibrateTime(): Promise<void> {
  const samples: number[] = [];
  
  for (let i = 0; i < 3; i++) {
    try {
      samples.push(await measure());
      if (i < 2) await new Promise(r => setTimeout(r, 100));
    } catch {}
  }
  
  if (samples.length > 0) {
    samples.sort((a, b) => a - b);
    offset = samples[Math.floor(samples.length / 2)];
    isCalibrated = true;
  }
}

export function getServerTime(): number {
  return Date.now() + offset;
}

export function getClockOffset(): number {
  return offset;
}

export function startAutoSync(): void {
  stopAutoSync();
  calibrateTime();
  syncInterval = setInterval(calibrateTime, 30000);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
