/**
 * Time Synchronization Module
 * 
 * Implements NTP-like clock synchronization between client and server.
 * Uses multiple round-trip measurements to calculate accurate time offset.
 * 
 * Formula (from NTP):
 *   offset θ = ((t1 - t0) + (t2 - t3)) / 2
 *   roundTripDelay δ = (t3 - t0) - (t2 - t1)
 * 
 * Where:
 *   t0 = client timestamp of request send
 *   t1 = server timestamp of request receive
 *   t2 = server timestamp of response send
 *   t3 = client timestamp of response receive
 */

import { getSocket } from './socket';

interface TimeSyncSample {
  offset: number;
  roundTripDelay: number;
  timestamp: number;
}

interface TimeSyncState {
  samples: TimeSyncSample[];
  offset: number;
  roundTripDelay: number;
  isCalibrated: boolean;
  lastSyncTime: number;
}

const SAMPLE_COUNT = 5; // Number of samples to collect
const SAMPLE_INTERVAL = 200; // ms between samples
const RESYNC_INTERVAL = 30000; // Resync every 30 seconds
const MAX_SAMPLE_AGE = 60000; // Discard samples older than 1 minute

let state: TimeSyncState = {
  samples: [],
  offset: 0,
  roundTripDelay: 0,
  isCalibrated: false,
  lastSyncTime: 0,
};

let syncInProgress = false;
let resyncInterval: NodeJS.Timeout | null = null;

/**
 * Perform a single time sync measurement
 */
function measureOnce(): Promise<TimeSyncSample> {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    const t0 = performance.now();

    socket.emit('timeSync', { t0 }, (response: { t0: number; t1: number; t2: number }) => {
      const t3 = performance.now();
      
      if (!response || typeof response.t1 !== 'number') {
        reject(new Error('Invalid time sync response'));
        return;
      }

      // Convert server times (ms since epoch) to relative times for offset calculation
      // We use performance.now() for t0 and t3 (high precision)
      // Server sends t1 and t2 in Date.now() format
      
      // Calculate offset: ((t1 - t0) + (t2 - t3)) / 2
      // But we need to account for the different time bases
      // Client uses performance.now(), server uses Date.now()
      
      // Convert to common base by using the relationship:
      // serverTime = clientTime + offset
      // So: offset = serverTime - clientTime
      
      const clientNow = Date.now();
      const perfOffset = clientNow - performance.now();
      
      // Adjust t0 and t3 to Date.now() scale
      const t0Adjusted = t0 + perfOffset;
      const t3Adjusted = t3 + perfOffset;
      
      const offset = ((response.t1 - t0Adjusted) + (response.t2 - t3Adjusted)) / 2;
      const roundTripDelay = (t3Adjusted - t0Adjusted) - (response.t2 - response.t1);

      resolve({
        offset,
        roundTripDelay,
        timestamp: Date.now(),
      });
    });

    // Timeout after 2 seconds
    setTimeout(() => reject(new Error('Time sync timeout')), 2000);
  });
}

/**
 * Collect multiple samples and calculate median offset
 */
export async function calibrateTime(): Promise<void> {
  if (syncInProgress) {
    console.log('[TimeSync] Sync already in progress');
    return;
  }

  syncInProgress = true;
  const newSamples: TimeSyncSample[] = [];

  try {
    console.log('[TimeSync] Starting calibration...');

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      try {
        const sample = await measureOnce();
        newSamples.push(sample);
        console.log(`[TimeSync] Sample ${i + 1}/${SAMPLE_COUNT}: offset=${sample.offset.toFixed(2)}ms, RTT=${sample.roundTripDelay.toFixed(2)}ms`);
        
        if (i < SAMPLE_COUNT - 1) {
          await new Promise(resolve => setTimeout(resolve, SAMPLE_INTERVAL));
        }
      } catch (error) {
        console.warn(`[TimeSync] Sample ${i + 1} failed:`, error);
      }
    }

    if (newSamples.length === 0) {
      console.warn('[TimeSync] No valid samples collected');
      return;
    }

    // Filter outliers and calculate median
    const sortedByRTT = [...newSamples].sort((a, b) => a.roundTripDelay - b.roundTripDelay);
    
    // Use the samples with lowest RTT (most accurate)
    const bestSamples = sortedByRTT.slice(0, Math.ceil(newSamples.length * 0.6));
    
    // Calculate median offset from best samples
    const sortedOffsets = bestSamples.map(s => s.offset).sort((a, b) => a - b);
    const medianOffset = sortedOffsets[Math.floor(sortedOffsets.length / 2)];
    
    // Calculate average RTT
    const avgRTT = bestSamples.reduce((sum, s) => sum + s.roundTripDelay, 0) / bestSamples.length;

    state = {
      samples: newSamples,
      offset: medianOffset,
      roundTripDelay: avgRTT,
      isCalibrated: true,
      lastSyncTime: Date.now(),
    };

    console.log(`[TimeSync] Calibrated: offset=${medianOffset.toFixed(2)}ms, avgRTT=${avgRTT.toFixed(2)}ms`);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Get the current server time estimate
 */
export function getServerTime(): number {
  return Date.now() + state.offset;
}

/**
 * Get the clock offset (add to local time to get server time)
 */
export function getClockOffset(): number {
  return state.offset;
}

/**
 * Get the estimated round-trip delay
 */
export function getRoundTripDelay(): number {
  return state.roundTripDelay;
}

/**
 * Check if time is calibrated
 */
export function isCalibrated(): boolean {
  return state.isCalibrated;
}

/**
 * Start periodic resynchronization
 */
export function startAutoSync(): void {
  stopAutoSync();
  
  // Initial calibration
  calibrateTime();
  
  // Periodic resync
  resyncInterval = setInterval(() => {
    if (Date.now() - state.lastSyncTime > RESYNC_INTERVAL) {
      calibrateTime();
    }
  }, RESYNC_INTERVAL);
}

/**
 * Stop periodic resynchronization
 */
export function stopAutoSync(): void {
  if (resyncInterval) {
    clearInterval(resyncInterval);
    resyncInterval = null;
  }
}

/**
 * Calculate the expected position at a given local time,
 * based on when playback started on the server
 */
export function calculateExpectedPosition(
  serverStartTime: number,
  basePosition: number,
  isPlaying: boolean
): number {
  if (!isPlaying) {
    return basePosition;
  }
  
  const serverNow = getServerTime();
  const elapsed = (serverNow - serverStartTime) / 1000;
  return basePosition + Math.max(0, elapsed);
}

/**
 * Get sync quality indicator
 * Returns 'good', 'fair', or 'poor' based on RTT and calibration freshness
 */
export function getSyncQuality(): 'good' | 'fair' | 'poor' | 'uncalibrated' {
  if (!state.isCalibrated) return 'uncalibrated';
  
  const age = Date.now() - state.lastSyncTime;
  
  if (age > 120000 || state.roundTripDelay > 500) return 'poor';
  if (age > 60000 || state.roundTripDelay > 200) return 'fair';
  return 'good';
}
