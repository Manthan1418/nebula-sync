export interface JamendoTrack {
  id: string;
  jamendoId?: string;
  title: string;
  artistName: string;
  albumName?: string;
  duration: number;
  thumbnail?: string;
  streamUrl: string;
  audioDownloadUrl?: string;
  shareUrl?: string;
  licenseUrl?: string;
  source?: 'jamendo';
  isYouTube?: boolean;
  videoId?: string | null;
}

export async function searchJamendoTracks(query: string, limit = 24): Promise<JamendoTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`);
  const body = await response.json();

  if (!response.ok || !body?.success) {
    throw new Error(body?.error || 'Failed to search the music library');
  }

  return body.results || [];
}

export async function getTrendingJamendoTracks(limit = 12): Promise<JamendoTrack[]> {
  const response = await fetch(`/api/trending?limit=${limit}`);
  const body = await response.json();

  if (!response.ok || !body?.success) {
    throw new Error(body?.error || 'Failed to load trending tracks');
  }

  return body.results || [];
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
