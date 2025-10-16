from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Welcome to CoAuthor backend!"}

@app.get("/stories")
def get_stories():
    return {"stories": ["Story 1", "Story 2", "Story 3"]}

@app.get("/rooms")
def get_rooms():
    return {"rooms": ["Fantasy", "Sci-Fi", "Romance"]}

@app.get("/Sign in/Sign up")
def get_users():
    return {"Sign in/Sign up area": "User authentication endpoint"}

@app.get("Mind Maps")
def get_mind_maps():
    return {"Mind Maps": "Mind map data endpoint"}

@app.get("Live Chat/Voice Chat")    
def get_chat():
    return {"Live Chat/Voice Chat": "Chat and voice communication endpoint"}

@app.get("Gamification/Rewards/Achievements/Quests/Leaderboards")
def get_gamification():
    return {"Gamification/Rewards/Achievements/Quests/Leaderboards": "Gamification features endpoint"}

@app.get("Version Control/History/Undo/Redo")
def get_version_control():
    return {"Version Control/History/Undo/Redo": "Version control features endpoint"}