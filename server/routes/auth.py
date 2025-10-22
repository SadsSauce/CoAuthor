from fastapi import APIRouter

router = APIRouter()

@router.get("/auth")
def get_auth():
    return {"auth": "User authentication endpoint (Sign in / Sign up)"}
