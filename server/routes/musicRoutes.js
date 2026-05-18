import { Router } from 'express';
import { addToQueue, advanceTrack, clearQueue, moveToPreviousTrack, removeFromQueue, serializeRoom } from '../lib/rooms.js';
import { getCharts, getNewReleaseTracks, getTrackById, getTrendingTracks, searchTracks } from '../services/gaanapyService.js';

function emitRoomState(io, roomId, eventName = 'roomState') {
  return (payload = {}) => {
    io?.to(roomId)?.emit(eventName, payload);
  };
}

export function createMusicRouter({ rooms, io }) {
  const router = Router();

  function sendLibraryFallback(res, message, extra = {}) {
    console.warn(message, extra);
    return res.status(200).json({ success: true, results: [], ...extra, fallback: true });
  }

  router.get('/search', async (req, res) => {
    const query = String(req.query.q || '').trim();
    const limit = Number(req.query.limit || 24);

    if (!query) {
      return res.status(400).json({ success: false, error: 'Missing search query' });
    }

    try {
      const results = await searchTracks(query, limit);
      return res.json({ success: true, query, results });
    } catch (error) {
      return sendLibraryFallback(res, 'GaanaPy search failed', {
        query,
        error: error.message || 'GaanaPy search failed',
      });
    }
  });

  router.get('/track/:id', async (req, res) => {
    try {
      const track = await getTrackById(req.params.id);
      if (!track) return res.status(404).json({ success: false, error: 'Track not found' });
      return res.json({ success: true, track });
    } catch (error) {
      return sendLibraryFallback(res, 'GaanaPy track fetch failed', {
        track: null,
        error: error.message || 'GaanaPy track fetch failed',
      });
    }
  });

  router.get('/trending', async (req, res) => {
    const language = String(req.query.lang || req.query.language || 'Hindi').trim() || 'Hindi';
    const limit = Number(req.query.limit || 12);

    try {
      const results = await getTrendingTracks(limit, language);
      return res.json({ success: true, results });
    } catch (error) {
      return sendLibraryFallback(res, 'GaanaPy trending fetch failed', {
        error: error.message || 'GaanaPy trending fetch failed',
      });
    }
  });

  router.get('/newreleases', async (req, res) => {
    const language = String(req.query.lang || req.query.language || 'Hindi').trim() || 'Hindi';
    const limit = Number(req.query.limit || 12);

    try {
      const results = await getNewReleaseTracks(limit, language);
      return res.json({ success: true, results, language });
    } catch (error) {
      return sendLibraryFallback(res, 'GaanaPy new releases fetch failed', {
        error: error.message || 'GaanaPy new releases fetch failed',
        language,
      });
    }
  });

  router.get('/charts', async (req, res) => {
    const limit = Number(req.query.limit || 12);

    try {
      const results = await getCharts(limit);
      return res.json({ success: true, results });
    } catch (error) {
      return sendLibraryFallback(res, 'GaanaPy charts fetch failed', {
        error: error.message || 'GaanaPy charts fetch failed',
      });
    }
  });

  router.get('/current', (req, res) => {
    const roomId = String(req.query.roomId || '').toUpperCase();
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    return res.json({ success: true, room: serializeRoom(room) });
  });

  router.get('/queue', (req, res) => {
    const roomId = String(req.query.roomId || '').toUpperCase();
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    return res.json({
      success: true,
      queue: room.queue,
      history: room.history,
      repeatMode: room.repeatMode,
      shuffleMode: room.shuffleMode,
    });
  });

  router.post('/queue', (req, res) => {
    const roomId = String(req.body.roomId || '').toUpperCase();
    const action = String(req.body.action || 'add');
    const room = rooms.get(roomId);

    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

    const publish = emitRoomState(io, roomId);

    if (action === 'add' && req.body.track) {
      addToQueue(room, req.body.track);
    } else if (action === 'remove' && req.body.trackId) {
      removeFromQueue(room, req.body.trackId);
    } else if (action === 'clear') {
      clearQueue(room);
    } else if (action === 'next') {
      const nextTrack = advanceTrack(room);
      publish(serializeRoom(room));
      return res.json({ success: true, room: serializeRoom(room), track: nextTrack });
    } else if (action === 'previous') {
      const previousTrack = moveToPreviousTrack(room);
      publish(serializeRoom(room));
      return res.json({ success: true, room: serializeRoom(room), track: previousTrack });
    } else if (action === 'toggleRepeat') {
      room.repeatMode = room.repeatMode === 'off' ? 'all' : room.repeatMode === 'all' ? 'one' : 'off';
    } else if (action === 'toggleShuffle') {
      room.shuffleMode = !room.shuffleMode;
    }

    room.lastMutationAt = Date.now();
    publish(serializeRoom(room));
    return res.json({ success: true, room: serializeRoom(room) });
  });

  return router;
}
