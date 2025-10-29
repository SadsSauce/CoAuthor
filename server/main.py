from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from routes import rooms, chat, auth, mindmaps, gamification, version_control, export
from websocket_manager import manager

app = FastAPI()

app.include_router(rooms.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(mindmaps.router)
app.include_router(gamification.router)
app.include_router(version_control.router)
app.include_router(export.router)

BASE_DIR = Path(__file__).resolve().parent.parent
CLIENT_DIR = BASE_DIR / "client"

app.mount("/static", StaticFiles(directory=CLIENT_DIR / "static"), name="static")

@app.get("/")
def home():
    return FileResponse(CLIENT_DIR / "genres.html")

@app.get("/genres")
def genres():
    return FileResponse(CLIENT_DIR / "genres.html")

@app.get("/rooms")
def rooms_page():
    return FileResponse(CLIENT_DIR / "rooms.html")

@app.get("/editor")
def editor():
    return FileResponse(CLIENT_DIR / "editor.html")

@app.websocket("/ws/{room_name}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_name: str, username: str):
    await manager.connect(websocket, room_name, username)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.handle_message(room_name, username, data)
    except WebSocketDisconnect:
        manager.disconnect(room_name, username)
        await manager.broadcast_to_room(room_name, {
            "type": "user_left",
            "username": username,
            "users": await manager.get_room_users(room_name),
            "message": f"{username} left the room"
        })
