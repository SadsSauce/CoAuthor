from fastapi import APIRouter, Body, HTTPException, Query
from typing import Optional
import uuid
from db import (
    GENRES, ROOM_SIZES,
    create_room, get_room, get_rooms_by_genre,
    get_user_rooms, get_genre_room_counts,
    add_room_member, is_room_member, get_room_member_count
)

router = APIRouter()

@router.get("/genres")
def get_genres():
    """Get all available genres with room counts"""
    counts = get_genre_room_counts()
    genres_with_counts = []
    for genre in GENRES:
        genres_with_counts.append({
            **genre,
            "room_count": counts.get(genre["id"], 0)
        })
    return {"genres": genres_with_counts}

@router.get("/room-sizes")
def get_room_sizes():
    """Get available room size options"""
    return {"sizes": ROOM_SIZES}

@router.get("/rooms/genre/{genre_id}")
def get_rooms_in_genre(
    genre_id: str,
    sort: str = Query("recent", regex="^(recent|active|popular)$"),
    filter_type: str = Query("all", regex="^(all|my)$"),
    username: Optional[str] = Query(None)
):
    """Get all rooms in a specific genre"""
    if filter_type == "my" and not username:
        raise HTTPException(status_code=400, detail="Username required for 'my rooms' filter")
    
    if filter_type == "my":
        # Get user's rooms filtered by genre
        all_user_rooms = get_user_rooms(username)
        rooms = [r for r in all_user_rooms if r["genre"] == genre_id]
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
    creator: str = Body(...)
):
    """Create a new room/story"""
    # Validate genre
    valid_genres = [g["id"] for g in GENRES]
    if genre not in valid_genres:
        raise HTTPException(status_code=400, detail="Invalid genre")
    
    # Validate room size
    valid_sizes = [s["value"] for s in ROOM_SIZES]
    if max_members not in valid_sizes:
        raise HTTPException(status_code=400, detail="Invalid room size")
    
    # Generate unique room ID
    room_id = str(uuid.uuid4())
    
    # Create room
    success = create_room(room_id, name, description, genre, creator, max_members, privacy)
    
    if success:
        return {
            "success": True,
            "message": "Room created successfully",
            "room_id": room_id
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to create room")

@router.get("/rooms/{room_id}")
def get_room_details(room_id: str):
    """Get details of a specific room"""
    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    member_count = get_room_member_count(room_id)
    room["member_count"] = member_count
    
    return room

@router.post("/rooms/{room_id}/join")
def join_room(room_id: str, username: str = Body(..., embed=True)):
    """Join a room"""
    room = get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if already a member
    if is_room_member(room_id, username):
        return {"message": "Already a member of this room"}
    
    # Check if room is full
    member_count = get_room_member_count(room_id)
    if member_count >= room["max_members"]:
        raise HTTPException(status_code=400, detail="Room is full")
    
    # Add user to room
    success = add_room_member(room_id, username)
    if success:
        return {"success": True, "message": "Successfully joined room"}
    else:
        raise HTTPException(status_code=500, detail="Failed to join room")

@router.get("/users/{username}/rooms")
def get_my_rooms(username: str):
    """Get all rooms a user is a member of"""
    rooms = get_user_rooms(username)
    return {"rooms": rooms}
