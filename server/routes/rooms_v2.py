from fastapi import APIRouter, Body, HTTPException, Query
from typing import Optional
import uuid
from db import (
    GENRES, ROOM_SIZES, create_room, get_room, get_rooms_by_genre,
    get_user_rooms, get_genre_room_counts, add_room_member, is_room_member,
    get_room_member_count, check_password, create_invite, consume_invite
)

router = APIRouter(prefix="/api")


@router.get("/genres")
def get_genres():
    counts = get_genre_room_counts()
    genres_with_counts = []
    for genre in GENRES:
        genres_with_counts.append({**genre, "room_count": counts.get(genre["id"], 0)})
    return {"genres": genres_with_counts}


@router.get("/room-sizes")
def get_room_sizes():
    return {"sizes": ROOM_SIZES}


@router.get("/rooms/genre/{genre_id}")
def get_rooms_in_genre(genre_id: str, sort: str = Query("recent", regex="^(recent|active|popular)$"),
                       filter_type: str = Query("all", regex="^(all|my)$"), username: Optional[str] = Query(None)):
    if filter_type == "my" and not username:
        raise HTTPException(status_code=400, detail="Username required for 'my rooms' filter")
    if filter_type == "my":
        rooms = [r for r in get_user_rooms(username) if r["genre"] == genre_id]
    else:
        rooms = get_rooms_by_genre(genre_id, sort)
    return {"rooms": rooms}


@router.get("/rooms/{room_id}")
def get_room_details(room_id: str):
    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room["member_count"] = get_room_member_count(room_id)
    return room


@router.post("/rooms")
def create_new_room(name: str = Body(...), description: str = Body(...), genre: str = Body(...),
                    max_members: int = Body(...), privacy: str = Body("public"), password: Optional[str] = Body(None),
                    creator: str = Body(...)):
    valid_genres = [g["id"] for g in GENRES]
    if genre not in valid_genres:
        raise HTTPException(status_code=400, detail="Invalid genre")
    valid_sizes = [s["value"] for s in ROOM_SIZES]
    if max_members not in valid_sizes:
        raise HTTPException(status_code=400, detail="Invalid room size")
    if privacy == "private" and not password:
        raise HTTPException(status_code=400, detail="Password required for private room")
    room_id = str(uuid.uuid4())
    success = create_room(room_id, name, description, genre, creator, max_members, privacy, password)
    if success:
        return {"success": True, "message": "Room created successfully", "room_id": room_id}
    raise HTTPException(status_code=500, detail="Failed to create room")


@router.post("/rooms/{room_id}/join")
def join_room(room_id: str, username: str = Body(..., embed=True), password: Optional[str] = Body(None),
              token: Optional[str] = Body(None)):
    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if is_room_member(room_id, username):
        return {"message": "Already a member of this room"}
    if room.get("privacy") == "private":
        if token:
            if not consume_invite(token, username):
                raise HTTPException(status_code=403, detail="Invalid or expired invite token")
            return {"success": True, "message": "Successfully joined room via invite token"}
        stored = room.get("password")
        if not password or not stored or not check_password(password, stored):
            raise HTTPException(status_code=403, detail="Incorrect password or missing token")
    if get_room_member_count(room_id) >= room["max_members"]:
        raise HTTPException(status_code=400, detail="Room is full")
    if add_room_member(room_id, username):
        return {"success": True, "message": "Successfully joined room"}
    raise HTTPException(status_code=500, detail="Failed to join room")


@router.post("/rooms/{room_id}/invite")
def invite_to_room(room_id: str, inviter: str = Body(...), invited_username: Optional[str] = Body(None)):
    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if not is_room_member(room_id, inviter):
        raise HTTPException(status_code=403, detail="Only room members can create invites")
    token = create_invite(room_id, invited_username)
    if not token:
        raise HTTPException(status_code=500, detail="Failed to create invite")
    return {"success": True, "token": token, "invite_link": f"/rooms?invite={token}"}


@router.get("/users/{username}/rooms")
def get_my_rooms(username: str):
    return {"rooms": get_user_rooms(username)}
