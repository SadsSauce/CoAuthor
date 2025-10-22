from fastapi import FastAPI
from routes import rooms, chat, auth, mindmaps, gamification, version_control, export

app = FastAPI()

app.include_router(rooms.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(mindmaps.router)
app.include_router(gamification.router)
app.include_router(version_control.router)
app.include_router(export.router)

@app.get("/")
def home():
    return {"message": "Welcome to CoAuthor backend!"}
