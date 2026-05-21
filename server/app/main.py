import json
import time
import secrets
import asyncio
import os
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .models import Track, RepeatMode
from .rooms import rooms, create_room, get_room, join_room, leave_room, add_to_queue, remove_from_queue, clear_queue, set_track, advance_track, previous_track, get_sync_state
from .music import search_tracks, get_track, get_trending, get_new_releases, get_charts
from .gaanapy_service import close_gaanapy

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

app = FastAPI(title="Nebula Sync")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

room_connections: dict[str, dict[str, WebSocket]] = {}


@app.on_event("shutdown")
async def shutdown():
    await close_gaanapy()


async def broadcast_to_room(room_id: str, message: dict, exclude: Optional[str] = None):
    if room_id not in room_connections:
        return
    tasks = []
    for uid, ws in room_connections[room_id].items():
        if uid != exclude:
            tasks.append(ws.send_json(message))
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


# ─── REST Endpoints ─────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "uptime": time.time()}


@app.get("/")
async def root():
    return RedirectResponse(url="/health")


@app.get("/api/search")
async def api_search(q: str = "", limit: int = 12):
    if q:
        results = await search_tracks(q, limit)
    else:
        results = await get_trending(limit)
    return {"success": True, "results": [r.model_dump() for r in results]}


@app.get("/api/tracks/{track_id}")
async def api_track(track_id: str):
    track = await get_track(track_id)
    if not track:
        return {"success": False, "error": "Track not found"}
    return {"success": True, "track": track.model_dump()}


@app.get("/api/trending")
async def api_trending(limit: int = 12, lang: str = "Hindi"):
    results = await get_trending(limit, language=lang)
    return {"success": True, "results": [r.model_dump() for r in results]}


@app.get("/api/newreleases")
async def api_newreleases(limit: int = 12, lang: str = "Hindi"):
    results = await get_new_releases(limit, language=lang)
    return {"success": True, "results": [r.model_dump() for r in results]}


@app.get("/api/charts")
async def api_charts(limit: int = 12):
    results = await get_charts(limit)
    return {"success": True, "results": [r.model_dump() for r in results]}


@app.post("/api/rooms")
async def api_create_room(name: str = "Listener"):
    room, user_id = create_room(name)
    return {
        "success": True,
        "room": {
            "id": room.id,
            "name": room.name,
            "host_id": room.host_id,
            "users": [u.model_dump() for u in room.users],
        },
        "user_id": user_id,
    }


@app.post("/api/rooms/join")
async def api_join_room(room_id: str, name: str = "Listener"):
    room, user_id, error = join_room(room_id, name)
    if error:
        return {"success": False, "error": error}
    return {
        "success": True,
        "room": {
            "id": room.id,
            "name": room.name,
            "host_id": room.host_id,
            "users": [u.model_dump() for u in room.users],
        },
        "user_id": user_id,
    }


@app.get("/api/rooms/{room_id}")
async def api_room_info(room_id: str):
    room = get_room(room_id)
    if not room:
        return {"success": False, "error": "Room not found"}
    sync = get_sync_state(room)
    return {
        "success": True,
        "room": {
            "id": room.id,
            "name": room.name,
            "host_id": room.host_id,
            "users": [u.model_dump() for u in room.users],
            "queue": [q.model_dump() for q in room.queue],
            "history": [t.model_dump() for t in room.history],
            "playback": sync,
            "repeat_mode": room.repeat_mode.value,
            "shuffle_mode": room.shuffle_mode,
            "volume": room.volume,
        },
    }


# ─── WebSocket ──────────────────────────────────────────────────

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str = Query(""), user_name: str = Query("Listener")):
    await websocket.accept()
    room_id = room_id.upper()
    room = get_room(room_id)
    if not room:
        await websocket.send_json({"type": "error", "payload": {"message": "Room not found"}})
        await websocket.close()
        return

    if room_id not in room_connections:
        room_connections[room_id] = {}

    uid = user_id or f"ws_{secrets.token_hex(4)}"
    room_connections[room_id][uid] = websocket

    is_host = uid == room.host_id
    await websocket.send_json({
        "type": "connected",
        "payload": {
            "user_id": uid,
            "room_id": room_id,
            "is_host": is_host,
            "users": [u.model_dump() for u in room.users],
            "sync": get_sync_state(room),
            "queue": [q.model_dump() for q in room.queue],
            "history": [t.model_dump() for t in room.history],
        },
    })

    await broadcast_to_room(room_id, {
        "type": "user:joined",
        "payload": {"user_id": uid, "user_name": user_name, "users": [u.model_dump() for u in room.users]},
    }, exclude=uid)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type", "")
            payload = msg.get("payload", {})

            if msg_type == "chat:send":
                text = payload.get("text", "").strip()[:500]
                if not text:
                    continue
                user = next((u for u in room.users if u.id == uid), None)
                uname = user.name if user else user_name
                chat_msg = {
                    "id": f"msg_{secrets.token_hex(4)}",
                    "user_id": uid,
                    "user_name": uname,
                    "text": text,
                    "timestamp": time.time(),
                }
                await broadcast_to_room(room_id, {"type": "chat:message", "payload": chat_msg})

            elif msg_type == "queue:add":
                track_data = payload.get("track")
                if track_data:
                    track = Track(**track_data)
                    add_to_queue(room, track, uid)
                    await broadcast_to_room(room_id, {
                        "type": "queue:updated",
                        "payload": {"queue": [q.model_dump() for q in room.queue]},
                    })

            elif msg_type == "queue:remove":
                track_id = payload.get("track_id", "")
                remove_from_queue(room, track_id)
                await broadcast_to_room(room_id, {
                    "type": "queue:updated",
                    "payload": {"queue": [q.model_dump() for q in room.queue]},
                })

            elif msg_type == "queue:clear":
                clear_queue(room)
                await broadcast_to_room(room_id, {"type": "queue:updated", "payload": {"queue": []}})

            elif msg_type == "track:select":
                if not is_host:
                    await websocket.send_json({"type": "error", "payload": {"message": "Only host can select tracks"}})
                    continue
                track_data = payload.get("track")
                if track_data:
                    track = Track(**track_data)
                    set_track(room, track)
                    sync = get_sync_state(room)
                    await broadcast_to_room(room_id, {
                        "type": "track:changed",
                        "payload": {"track": track.model_dump(), "sync": sync},
                    })

            elif msg_type == "player:play":
                if not is_host:
                    continue
                now = time.time()
                room.playback.is_playing = True
                room.playback.started_at = now
                room.playback.last_updated = now
                await broadcast_to_room(room_id, {
                    "type": "player:state",
                    "payload": {"is_playing": True, "position": room.playback.position, "server_time": now},
                })

            elif msg_type == "player:pause":
                if not is_host:
                    continue
                if room.playback.is_playing and room.playback.started_at:
                    room.playback.position += time.time() - room.playback.started_at
                room.playback.is_playing = False
                room.playback.started_at = None
                room.playback.last_updated = time.time()
                await broadcast_to_room(room_id, {
                    "type": "player:state",
                    "payload": {"is_playing": False, "position": room.playback.position, "server_time": time.time()},
                })

            elif msg_type == "player:seek":
                if not is_host:
                    continue
                pos = max(0, payload.get("position", 0))
                room.playback.position = pos
                if room.playback.is_playing:
                    room.playback.started_at = time.time()
                room.playback.last_updated = time.time()
                await broadcast_to_room(room_id, {
                    "type": "player:seeked",
                    "payload": {"position": pos, "server_time": time.time()},
                })

            elif msg_type == "track:next":
                if not is_host:
                    continue
                track = advance_track(room)
                sync = get_sync_state(room)
                await broadcast_to_room(room_id, {
                    "type": "track:changed",
                    "payload": {"track": track.model_dump() if track else None, "sync": sync},
                })

            elif msg_type == "track:previous":
                if not is_host:
                    continue
                track = previous_track(room)
                sync = get_sync_state(room)
                await broadcast_to_room(room_id, {
                    "type": "track:changed",
                    "payload": {"track": track.model_dump() if track else None, "sync": sync},
                })

            elif msg_type == "room:repeat":
                modes = ["off", "all", "one"]
                mode = payload.get("repeat_mode")
                if mode and mode in modes:
                    room.repeat_mode = RepeatMode(mode)
                else:
                    current = room.repeat_mode.value
                    idx = (modes.index(current) + 1) % 3
                    room.repeat_mode = RepeatMode(modes[idx])
                await broadcast_to_room(room_id, {
                    "type": "room:state",
                    "payload": {"repeat_mode": room.repeat_mode.value, "shuffle_mode": room.shuffle_mode, "volume": room.volume},
                })

            elif msg_type == "room:shuffle":
                val = payload.get("shuffle_mode")
                room.shuffle_mode = not room.shuffle_mode if val is None else bool(val)
                await broadcast_to_room(room_id, {
                    "type": "room:state",
                    "payload": {"repeat_mode": room.repeat_mode.value, "shuffle_mode": room.shuffle_mode, "volume": room.volume},
                })

            elif msg_type == "room:volume":
                vol = max(0, min(100, payload.get("volume", 70)))
                room.volume = vol
                await broadcast_to_room(room_id, {
                    "type": "room:state",
                    "payload": {"repeat_mode": room.repeat_mode.value, "shuffle_mode": room.shuffle_mode, "volume": room.volume},
                })

            elif msg_type == "sync:request":
                sync = get_sync_state(room)
                await websocket.send_json({"type": "sync:state", "payload": sync})

            elif msg_type == "sync:beacon":
                if not is_host:
                    continue
                await broadcast_to_room(room_id, {
                    "type": "sync:beacon",
                    "payload": {
                        "position": payload.get("position", room.playback.position),
                        "is_playing": payload.get("is_playing", room.playback.is_playing),
                        "server_time": time.time(),
                    },
                }, exclude=uid)

    except WebSocketDisconnect:
        pass
    finally:
        if room_id in room_connections:
            room_connections[room_id].pop(uid, None)
            if not room_connections[room_id]:
                del room_connections[room_id]
        updated_room = leave_room(room_id, uid)
        if updated_room:
            await broadcast_to_room(room_id, {
                "type": "user:left",
                "payload": {
                    "user_id": uid,
                    "users": [u.model_dump() for u in updated_room.users],
                    "new_host": updated_room.host_id if updated_room.host_id != uid else None,
                },
            })




