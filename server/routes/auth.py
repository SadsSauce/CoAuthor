from fastapi import APIRouter, HTTPException, Form
from db import create_user, get_user

router = APIRouter()

@router.post("/auth/register")
def register(username: str = Form(...), password: str = Form(...)):
    user = get_user(username)
    if user:
        raise HTTPException(status_code=400, detail="Username already exists")
    create_user(username, password)
    return {"message": "Account created successfully"}

@router.post("/auth/login")
def login(username: str = Form(...), password: str = Form(...)):
    user = get_user(username)
    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"message": "Login successful"}
