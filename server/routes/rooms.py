from fastapi import APIRouter

router = APIRouter()

@router.get("/rooms")
def get_rooms():
    return {"rooms": ["Fantasy", "Sci-Fi", "Romance"]}
