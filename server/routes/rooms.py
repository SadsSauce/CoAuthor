from fastapi import APIRouter, Body, HTTPException, Query
from typing import Optional
import uuid
from pydantic import BaseModel

from db import (
    GENRES,
    ROOM_SIZES,
    create_room,
    get_room,
    get_rooms_by_genre,
    get_user_rooms,
    get_genre_room_counts,
    add_room_member,
    is_room_member,
    get_room_member_count,
    check_password,
)

router = APIRouter(prefix="/api")


class JoinRoomRequest(BaseModel):
    username: str
    password: Optional[str] = None


@router.get("/genres")
def get_genres():
    counts = get_genre_room_counts()
    out = []
    for g in GENRES:
        out.append(
            {
                "id": g["id"],
                "name": g["name"],
                "icon": g["icon"],
                "room_count": counts.get(g["id"], 0),
            }
        )
    return {"genres": out}


@router.get("/room-sizes")
def get_room_sizes():
    return {"sizes": ROOM_SIZES}


@router.get("/rooms/genre/{genre_id}")
def get_rooms_in_genre(
    genre_id: str,
    sort: str = Query("recent", regex="^(recent|active|popular)$"),
    filter_type: str = Query("all", regex="^(all|my)$"),
    username: Optional[str] = Query(None),
):
    if filter_type == "my" and not username:
        raise HTTPException(status_code=400, detail="Username required")

    if filter_type == "my":
        all_rooms = get_user_rooms(username)
        rooms = [r for r in all_rooms if r["genre"] == genre_id]
    else:
        rooms = get_rooms_by_genre(genre_id, sort)

    return {"rooms": rooms}


@router.post("/rooms")
def create_new_room(
    name: str = Body(...),
    description: str = Body(...),
    genre: str = Body(...),
    max_members: int = Body(...),
    privacy: str = Body("public"),
    creator: str = Body(...),
    password: Optional[str] = Body(None),
):
    valid_genres = [g["id"] for g in GENRES]
    if genre not in valid_genres:
        raise HTTPException(status_code=400, detail="Invalid genre")

    valid_sizes = [s["value"] for s in ROOM_SIZES]
    if max_members not in valid_sizes:
        raise HTTPException(status_code=400, detail="Invalid room size")

    if privacy == "private" and not password:
        raise HTTPException(status_code=400, detail="Password required")

    room_id = str(uuid.uuid4())
    ok = create_room(room_id, name, description, genre, creator, max_members, privacy, password)

    if not ok:
        raise HTTPException(status_code=500, detail="Failed to create room")

    return {"success": True, "room_id": room_id}


@router.get("/rooms/{room_id}")
def get_room_details(room_id: str):
    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room["member_count"] = get_room_member_count(room_id)
    return room


@router.post("/rooms/{room_id}/join")
def join_room(room_id: str, payload: JoinRoomRequest):
    username = payload.username
    password = payload.password

    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if is_room_member(room_id, username):
        return {"success": True, "message": "Already a member"}

    if username == room["creator"]:
        add_room_member(room_id, username)
        return {"success": True, "message": "Joined as owner"}

    if get_room_member_count(room_id) >= room["max_members"]:
        raise HTTPException(status_code=400, detail="Room is full")

    if room["privacy"] == "private":
        if not password:
            raise HTTPException(status_code=401, detail="Password required")
        if not room["password"]:
            raise HTTPException(status_code=500, detail="Room has no password set")
        if not check_password(password, room["password"]):
            raise HTTPException(status_code=403, detail="Incorrect password")

    ok = add_room_member(room_id, username)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to join room")

    return {"success": True, "message": "Joined room"}


@router.get("/users/{username}/rooms")
def get_my_rooms(username: str):
    return {"rooms": get_user_rooms(username)}
