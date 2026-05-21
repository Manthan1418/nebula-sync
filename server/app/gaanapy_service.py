from typing import Optional
from server.GaanaPy.api.gaanapy import GaanaPy
from .models import Track

gaanapy = GaanaPy()


def _extract_stream_url(track: dict) -> str:
    stream_urls = track.get("stream_urls", {})
    urls = stream_urls.get("urls", {}) if isinstance(stream_urls, dict) else {}
    if isinstance(urls, dict):
        for key in ("very_high_quality", "high_quality", "medium_quality", "low_quality"):
            url = urls.get(key)
            if url:
                return url
    return track.get("stream_url", "") or ""


def _normalize(track: dict) -> Optional[Track]:
    try:
        duration = int(track.get("duration", 0))
    except (ValueError, TypeError):
        duration = 0

    images = track.get("images", {})
    urls = images.get("urls", {}) if isinstance(images, dict) else {}
    thumbnail = (
        urls.get("medium_artwork")
        or urls.get("large_artwork")
        or urls.get("small_artwork")
        or ""
    )

    artist = track.get("artists", track.get("artist", "Unknown Artist"))
    title = track.get("title", "Unknown Track")
    track_id = track.get("seokey") or track.get("track_id") or str(hash(title))

    return Track(
        id=track_id,
        title=title,
        artist=artist if isinstance(artist, str) else ", ".join(artist),
        album=track.get("album", ""),
        duration=float(duration),
        thumbnail=thumbnail,
        stream_url=_extract_stream_url(track),
        source="gaanapy",
    )


def _normalize_list(results: object) -> list[Track]:
    if not isinstance(results, list):
        return []
    tracks = []
    for item in results:
        normalized = _normalize(item)
        if normalized:
            tracks.append(normalized)
    return tracks


async def search_tracks(query: str, limit: int = 12) -> list[Track]:
    results = await gaanapy.search_songs(query, limit)
    return _normalize_list(results)


async def get_track(track_id: str) -> Optional[Track]:
    results = await gaanapy.get_track_info([track_id])
    if isinstance(results, list) and results:
        return _normalize(results[0])
    return None


async def get_trending(language: str = "Hindi", limit: int = 12) -> list[Track]:
    results = await gaanapy.get_trending(language, limit)
    return _normalize_list(results)


async def get_new_releases(language: str = "Hindi", limit: int = 12) -> list[Track]:
    results = await gaanapy.get_new_releases(language, limit)
    tracks = results.get("tracks", []) if isinstance(results, dict) else results
    return _normalize_list(tracks)


async def get_charts(limit: int = 12) -> list[Track]:
    results = await gaanapy.get_charts(limit)
    return _normalize_list(results)


async def close_gaanapy():
    await gaanapy.close()
