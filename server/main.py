from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from routes import rooms, chat, auth, mindmaps, gamification, version_control, export

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

app.mount("/static", StaticFiles(directory=CLIENT_DIR), name="static")

@app.get("/")
def home():
    return FileResponse(CLIENT_DIR / "index.html")

@app.get("/editor")
def editor():
    return FileResponse(CLIENT_DIR / "editor.html")
