from fastapi import APIRouter, Body

router = APIRouter()

rooms = ["Fantasy", "Sci-Fi", "Romance"]

@router.get("/rooms")
def get_rooms():
    return {"rooms": rooms}

@router.post("/rooms")
def create_room(room_name: str = Body(..., embed=True)):
    if room_name not in rooms:
        rooms.append(room_name)
        return {"message": f"Room '{room_name}' created successfully."}
    return {"message": f"Room '{room_name}' already exists."}
