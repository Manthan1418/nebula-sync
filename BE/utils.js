/**
 * Utility functions for the backend
 */

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a random delay for exponential backoff
 */
export function getExponentialBackoff(attempt, maxDelay = 30000) {
  const delay = Math.min(1000 * Math.pow(2, attempt), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
}

/**
 * Format milliseconds to readable time
 */
export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Sanitize room ID
 */
export function sanitizeRoomId(roomId) {
  return roomId?.toString().trim().toUpperCase() || '';
}

/**
 * Validate device name
 */
export function validateDeviceName(name) {
  return (
    name &&
    typeof name === 'string' &&
    name.length > 0 &&
    name.length <= 50 &&
    name.match(/^[a-zA-Z0-9\s\-_']+$/)
  );
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Truncate string to specified length
 */
export function truncate(str, length = 50) {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}

/**
 * Calculate average of numbers
 */
export function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}

/**
 * Get median of numbers
 */
export function getMedian(numbers) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Rate limiter for Socket.io
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter((time) => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((time) => now - time < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

/**
 * Event logger
 */
export class EventLogger {
  constructor(maxLogs = 1000) {
    this.logs = [];
    this.maxLogs = maxLogs;
  }

  log(event, data = {}) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      event,
      data,
    });

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(filter = {}) {
    return this.logs.filter((log) => {
      if (filter.event && log.event !== filter.event) return false;
      if (filter.after && new Date(log.timestamp) < new Date(filter.after)) return false;
      if (filter.before && new Date(log.timestamp) > new Date(filter.before)) return false;
      return true;
    });
  }

  clear() {
    this.logs = [];
  }
}
