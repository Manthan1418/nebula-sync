const GAANAPY_BASE_URL = process.env.GAANAPY_BASE_URL || 'http://127.0.0.1:8000';

function buildUrl(path, params = {}) {
  const url = new URL(path, GAANAPY_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function unwrapResults(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.tracks)) return body.tracks;
  if (Array.isArray(body?.albums)) return body.albums;
  if (Array.isArray(body?.artists)) return body.artists;
  if (Array.isArray(body?.entities)) return body.entities;
  return [];
}

function normalizeTrack(track = {}) {
  const streamUrls = track.stream_urls?.urls || {};
  const imageUrls = track.images?.urls || {};

  return {
    id: String(track.track_id || track.seokey || track.id || track.song_id || Date.now()),
    seokey: track.seokey || String(track.track_id || track.id || ''),
    trackId: String(track.track_id || track.id || ''),
    title: track.title || track.track_title || track.name || 'Unknown Track',
    artistName: track.artists || track.artistName || track.artist_name || '',
    albumName: track.album || track.albumName || track.album_title || '',
    duration: Number(track.duration || 0),
    thumbnail: imageUrls.large_artwork || imageUrls.medium_artwork || track.artist_image || track.thumbnail || track.image || '',
    streamUrl: streamUrls.very_high_quality || streamUrls.high_quality || streamUrls.medium_quality || streamUrls.low_quality || track.audio || track.streamUrl || '',
    audioDownloadUrl: track.audioDownloadUrl || track.audiodownload || '',
    shareUrl: track.song_url || track.shareUrl || track.shorturl || '',
    licenseUrl: track.licenseUrl || '',
    source: 'gaanapy',
    albumUrl: track.album_url || track.albumUrl || '',
    songUrl: track.song_url || track.songUrl || '',
    popularity: track.popularity || '',
    language: track.language || '',
  };
}

async function requestJson(path, params = {}) {
  const response = await fetch(buildUrl(path, params));
  if (!response.ok) {
    throw new Error(`GaanaPy request failed with ${response.status}`);
  }

  const body = await response.json();
  return body;
}

async function fetchTracks(path, params = {}) {
  const body = await requestJson(path, params);
  const results = unwrapResults(body);
  return results.map(normalizeTrack).filter((track) => Boolean(track.streamUrl));
}

export async function searchTracks(query, limit = 24) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return fetchTracks('/songs/search/', {
    query: trimmed,
    limit: String(limit),
  });
}

export async function getTrackById(trackId) {
  if (!trackId) return null;

  try {
    const body = await requestJson('/songs/info/', { seokey: trackId });
    const results = unwrapResults(body);
    if (results.length > 0) return normalizeTrack(results[0]);

    if (body && typeof body === 'object' && !Array.isArray(body) && body.seokey) {
      return normalizeTrack(body);
    }
  } catch (error) {
    return null;
  }

  return null;
}

export async function getTrendingTracks(limit = 12, language = 'Hindi') {
  return fetchTracks('/trending', {
    language,
    limit: String(limit),
  });
}

export async function getNewReleaseTracks(limit = 12, language = 'Hindi') {
  const body = await requestJson('/newreleases', {
    language,
    limit: String(limit),
  });

  const results = unwrapResults(body);
  return results.map(normalizeTrack).filter((track) => Boolean(track.streamUrl));
}

export async function getCharts(limit = 12) {
  const body = await requestJson('/charts', { limit: String(limit) });
  const results = unwrapResults(body);
  return results.map(normalizeTrack).filter((track) => Boolean(track.streamUrl));
}
