from typing import List, Optional
import time
from .models import Track


MOCK_TRACKS: List[Track] = [
    Track(
        id="t001", title="Starboy", artist="The Weeknd", album="Starboy",
        duration=230, thumbnail="https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    ),
    Track(
        id="t002", title="Blinding Lights", artist="The Weeknd", album="After Hours",
        duration=200, thumbnail="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    ),
    Track(
        id="t003", title="Levitating", artist="Dua Lipa", album="Future Nostalgia",
        duration=203, thumbnail="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    ),
    Track(
        id="t004", title="As It Was", artist="Harry Styles", album="Harry's House",
        duration=167, thumbnail="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    ),
    Track(
        id="t005", title="Midnight City", artist="M83", album="Hurry Up, We're Dreaming",
        duration=243, thumbnail="https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    ),
    Track(
        id="t006", title="Resonance", artist="HOME", album="Odyssey",
        duration=212, thumbnail="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    ),
    Track(
        id="t007", title="Nightcall", artist="Kavinsky", album="OutRun",
        duration=259, thumbnail="https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    ),
    Track(
        id="t008", title="A Real Hero", artist="College & Electric Youth", album="Drive OST",
        duration=267, thumbnail="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    ),
    Track(
        id="t009", title="Under Your Spell", artist="Desire", album="Desire II",
        duration=292, thumbnail="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    ),
    Track(
        id="t010", title="Feel Good Inc.", artist="Gorillaz", album="Demon Days",
        duration=222, thumbnail="https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    ),
    Track(
        id="t011", title="Neon Genesis", artist="Synthwave Elite", album="Retrowave",
        duration=198, thumbnail="https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    ),
    Track(
        id="t012", title="Deep Focus", artist="Ambient Minds", album="Flow State",
        duration=315, thumbnail="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    ),
    Track(
        id="t013", title="Midnight Drive", artist="Cruise Control", album="Late Night",
        duration=245, thumbnail="https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    ),
    Track(
        id="t014", title="Sonic Voyage", artist="Wave Riders", album="Spatial",
        duration=278, thumbnail="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    ),
    Track(
        id="t015", title="Purple Dream", artist="Neon Drift", album="Chrome",
        duration=231, thumbnail="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    ),
    Track(
        id="t016", title="Digital Sunrise", artist="Circuitry", album="Binary",
        duration=203, thumbnail="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&h=200&fit=crop",
        stream_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    ),
]


def search_tracks(query: str, limit: int = 12) -> List[Track]:
    q = query.lower()
    results = [
        t for t in MOCK_TRACKS
        if q in t.title.lower() or q in t.artist.lower() or q in t.album.lower()
    ]
    return results[:limit]


def get_track(track_id: str) -> Optional[Track]:
    for t in MOCK_TRACKS:
        if t.id == track_id:
            return t
    return None


def get_trending(limit: int = 12) -> List[Track]:
    return MOCK_TRACKS[:limit]


def get_new_releases(limit: int = 12) -> List[Track]:
    return MOCK_TRACKS[-limit:]


def get_charts(limit: int = 12) -> List[Track]:
    return MOCK_TRACKS[:limit]
