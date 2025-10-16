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
