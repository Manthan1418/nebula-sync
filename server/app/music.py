from typing import Optional
from .models import Track
from .gaanapy_service import (
    search_tracks as gaanapy_search,
    get_track as gaanapy_get_track,
    get_trending as gaanapy_trending,
    get_new_releases as gaanapy_new_releases,
    get_charts as gaanapy_charts,
)

MOCK_TRACKS: list[Track] = [
    Track(id="t001", title="Starboy", artist="The Weeknd", album="Starboy", duration=230,
          thumbnail="https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=200&h=200&fit=crop",
        stream_url=""),
    Track(id="t002", title="Blinding Lights", artist="The Weeknd", album="After Hours", duration=200,
          thumbnail="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop",
        stream_url=""),
    Track(id="t003", title="Levitating", artist="Dua Lipa", album="Future Nostalgia", duration=203,
          thumbnail="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop",
        stream_url=""),
    Track(id="t004", title="As It Was", artist="Harry Styles", album="Harry's House", duration=167,
          thumbnail="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&h=200&fit=crop",
        stream_url=""),
    Track(id="t005", title="Midnight City", artist="M83", album="Hurry Up, We're Dreaming", duration=243,
          thumbnail="https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=200&fit=crop",
        stream_url=""),
    Track(id="t006", title="Resonance", artist="HOME", album="Odyssey", duration=212,
          thumbnail="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop",
        stream_url=""),
]


def _mock_search(query: str, limit: int = 12) -> list[Track]:
    q = query.lower()
    return [t for t in MOCK_TRACKS if q in t.title.lower() or q in t.artist.lower() or q in t.album.lower()][:limit]


async def search_tracks(query: str, limit: int = 12) -> list[Track]:
    try:
        results = await gaanapy_search(query, limit)
        if results:
            return results
    except Exception:
        pass
    return _mock_search(query, limit)


async def get_track(track_id: str) -> Optional[Track]:
    try:
        result = await gaanapy_get_track(track_id)
        if result:
            return result
    except Exception:
        pass
    for t in MOCK_TRACKS:
        if t.id == track_id:
            return t
    return None


async def get_trending(limit: int = 12, language: str = "Hindi") -> list[Track]:
    try:
        results = await gaanapy_trending(language, limit)
        if results:
            return results
    except Exception:
        pass
    return MOCK_TRACKS[:limit]


async def get_new_releases(limit: int = 12, language: str = "Hindi") -> list[Track]:
    try:
        results = await gaanapy_new_releases(language, limit)
        if results:
            return results
    except Exception:
        pass
    return MOCK_TRACKS[-limit:]


async def get_charts(limit: int = 12) -> list[Track]:
    try:
        results = await gaanapy_charts(limit)
        if results:
            return results
    except Exception:
        pass
    return MOCK_TRACKS[:limit]
