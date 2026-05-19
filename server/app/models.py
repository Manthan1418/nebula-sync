from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
import time


class RepeatMode(str, Enum):
    off = "off"
    all = "all"
    one = "one"


class Track(BaseModel):
    id: str
    title: str
    artist: str
    album: str = ""
    duration: float = 0
    thumbnail: str = ""
    stream_url: str = ""
    source: str = "mock"


class User(BaseModel):
    id: str
    name: str
    is_host: bool = False
    joined_at: float = 0


class ChatMessage(BaseModel):
    id: str
    user_id: str
    user_name: str
    text: str
    timestamp: float = 0


class PlaybackState(BaseModel):
    track: Optional[Track] = None
    is_playing: bool = False
    position: float = 0
    started_at: Optional[float] = None
    last_updated: float = 0


class QueueItem(BaseModel):
    track: Track
    added_by: str
    added_at: float = 0


class Room(BaseModel):
    id: str
    name: str = ""
    host_id: str = ""
    users: List[User] = []
    queue: List[QueueItem] = []
    history: List[Track] = []
    playback: PlaybackState = PlaybackState()
    repeat_mode: RepeatMode = RepeatMode.off
    shuffle_mode: bool = False
    volume: int = 70
    created_at: float = 0
