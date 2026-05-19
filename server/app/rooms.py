import secrets
import string
import time
from typing import Optional, Dict
from .models import Room, User, Track, QueueItem, PlaybackState, RepeatMode

rooms: Dict[str, Room] = {}

CODE_CHARS = string.ascii_uppercase.replace("I", "").replace("O", "") + string.digits.replace("0", "").replace("1", "")


def generate_code() -> str:
    while True:
        code = "".join(secrets.choice(CODE_CHARS) for _ in range(6))
        if code not in rooms:
            return code


def create_room(host_name: str) -> Room:
    code = generate_code()
    user_id = f"user_{secrets.token_hex(4)}"
    now = time.time()
    room = Room(
        id=code,
        name=f"Room {code}",
        host_id=user_id,
        users=[User(id=user_id, name=host_name, is_host=True, joined_at=now)],
        playback=PlaybackState(last_updated=now),
        created_at=now,
    )
    rooms[code] = room
    return room, user_id


def get_room(code: str) -> Optional[Room]:
    return rooms.get(code.upper())


def join_room(code: str, user_name: str) -> tuple[Optional[Room], Optional[str], Optional[str]]:
    room = get_room(code)
    if not room:
        return None, None, "Room not found"
    user_id = f"user_{secrets.token_hex(4)}"
    now = time.time()
    room.users.append(User(id=user_id, name=user_name, is_host=False, joined_at=now))
    return room, user_id, None


def leave_room(code: str, user_id: str) -> Optional[Room]:
    room = get_room(code)
    if not room:
        return None
    room.users = [u for u in room.users if u.id != user_id]
    if not room.users:
        del rooms[code.upper()]
        return None
    if room.host_id == user_id and room.users:
        room.host_id = room.users[0].id
        room.users[0].is_host = True
    return room


def add_to_queue(room: Room, track: Track, user_id: str) -> QueueItem:
    item = QueueItem(track=track, added_by=user_id, added_at=time.time())
    room.queue.append(item)
    return item


def remove_from_queue(room: Room, track_id: str) -> bool:
    before = len(room.queue)
    room.queue = [q for q in room.queue if q.track.id != track_id]
    return len(room.queue) < before


def clear_queue(room: Room):
    room.queue.clear()


def set_track(room: Room, track: Track) -> Track:
    if room.playback.track:
        room.history.append(room.playback.track)
        if len(room.history) > 50:
            room.history = room.history[-50:]
    now = time.time()
    room.playback.track = track
    room.playback.position = 0
    room.playback.is_playing = True
    room.playback.started_at = now
    room.playback.last_updated = now
    room.queue = [q for q in room.queue if q.track.id != track.id]
    return track


def advance_track(room: Room) -> Optional[Track]:
    if room.queue:
        next_item = room.queue.pop(0)
        return set_track(room, next_item.track)
    if room.repeat_mode == RepeatMode.one and room.playback.track:
        return set_track(room, room.playback.track)
    if room.repeat_mode == RepeatMode.all and room.history:
        prev = room.history.pop(0)
        return set_track(room, prev)
    room.playback.is_playing = False
    room.playback.started_at = None
    room.playback.last_updated = time.time()
    return None


def previous_track(room: Room) -> Optional[Track]:
    if room.playback.track:
        room.queue.insert(0, QueueItem(track=room.playback.track, added_by=room.host_id))
    if room.history:
        prev = room.history.pop()
        return set_track(room, prev)
    room.playback.position = 0
    room.playback.started_at = time.time()
    room.playback.last_updated = time.time()
    return room.playback.track


def get_sync_state(room: Room) -> dict:
    pos = room.playback.position
    if room.playback.is_playing and room.playback.started_at:
        elapsed = time.time() - room.playback.started_at
        pos = room.playback.position + elapsed
    return {
        "track": room.playback.track.model_dump() if room.playback.track else None,
        "is_playing": room.playback.is_playing,
        "position": pos,
        "server_time": time.time(),
        "volume": room.volume,
        "repeat_mode": room.repeat_mode.value,
        "shuffle_mode": room.shuffle_mode,
    }
