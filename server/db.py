import sqlite3
from datetime import datetime
import bcrypt

conn = sqlite3.connect("coauthor.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS documents (
    room_name TEXT PRIMARY KEY,
    content TEXT DEFAULT '',
    yjs_state BLOB,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name TEXT NOT NULL,
    content TEXT DEFAULT '',
    yjs_state BLOB,
    author TEXT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_version INTEGER,
    FOREIGN KEY (room_name) REFERENCES rooms(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    genre TEXT NOT NULL,
    creator TEXT NOT NULL,
    max_members INTEGER DEFAULT 10,
    privacy TEXT DEFAULT 'public',
    password TEXT,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator) REFERENCES users(username)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS room_members (
    room_id TEXT,
    username TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, username),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (username) REFERENCES users(username)
)
""")

conn.commit()

GENRES = [
    {"id": "fantasy", "name": "Fantasy", "icon": "🐉"},
    {"id": "scifi", "name": "Sci-Fi", "icon": "🚀"},
    {"id": "romance", "name": "Romance", "icon": "💕"},
    {"id": "horror", "name": "Horror", "icon": "👻"},
    {"id": "mystery", "name": "Mystery", "icon": "🔍"},
    {"id": "thriller", "name": "Thriller", "icon": "⚡"},
    {"id": "drama", "name": "Drama", "icon": "🎭"},
    {"id": "comedy", "name": "Comedy", "icon": "😂"},
    {"id": "historical", "name": "Historical", "icon": "📜"},
    {"id": "adventure", "name": "Adventure", "icon": "🗺️"},
]

ROOM_SIZES = [
    {"value": 10, "label": "2-10 members"},
    {"value": 20, "label": "15-20 members"},
    {"value": 50, "label": "30-50 members"},
    {"value": 100, "label": "70-100 members"}
]



# PASSWORD HELPERS

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())



# USER FUNCTIONS

def get_user(username):
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    if row:
        return {"username": row[0], "password": row[1]}
    return None


def create_user(username, password):
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
    conn.commit()



# DOCUMENTS

def get_document(room_name):
    cursor.execute("SELECT content, yjs_state FROM documents WHERE room_name = ?", (room_name,))
    row = cursor.fetchone()
    if row:
        return {"content": row[0], "yjs_state": row[1]}
    return None


def save_document(room_name, content, yjs_state=None, create_version=False, author=None, summary=None):
    if create_version:
        create_version_entry(room_name, content, author=author, summary=summary, yjs_state=yjs_state)

    cursor.execute("""
        INSERT INTO documents (room_name, content, yjs_state, last_updated)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(room_name) DO UPDATE SET
            content = excluded.content,
            yjs_state = excluded.yjs_state,
            last_updated = excluded.last_updated
    """, (room_name, content, yjs_state, datetime.now()))
    conn.commit()


def create_room_document(room_name):
    if not get_document(room_name):
        save_document(room_name, "", None)



# VERSIONING

def create_version_entry(room_name, content, author=None, summary=None, yjs_state=None, source_version=None):
    cursor.execute("""
        INSERT INTO versions (room_name, content, yjs_state, author, summary, created_at, source_version)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (room_name, content, yjs_state, author, summary, datetime.now(), source_version))
    conn.commit()
    return cursor.lastrowid


def list_versions(room_name, limit=100):
    temp_cursor = conn.cursor()
    temp_cursor.execute("""
        SELECT id, room_name, author, summary, created_at, source_version
        FROM versions
        WHERE room_name = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (room_name, limit))
    rows = temp_cursor.fetchall()
    temp_cursor.close()
    return [
        {
            "id": r[0],
            "room_name": r[1],
            "author": r[2],
            "summary": r[3],
            "created_at": r[4],
            "source_version": r[5]
        } for r in rows
    ]


def get_version(version_id):
    cursor.execute("""
        SELECT id, room_name, content, yjs_state, author, summary, created_at, source_version
        FROM versions
        WHERE id = ?
    """, (version_id,))
    row = cursor.fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "room_name": row[1],
        "content": row[2],
        "yjs_state": row[3],
        "author": row[4],
        "summary": row[5],
        "created_at": row[6],
        "source_version": row[7],
    }


def revert_to_version(version_id, performed_by=None):
    v = get_version(version_id)
    if not v:
        return False

    current = get_document(v["room_name"]) or {"content": "", "yjs_state": None}

    create_version_entry(
        v["room_name"],
        current["content"],
        author=performed_by,
        summary=f"Snapshot before revert to version {version_id}",
        yjs_state=current.get("yjs_state")
    )

    save_document(v["room_name"], v["content"], v.get("yjs_state"), create_version=False)

    create_version_entry(
        v["room_name"],
        v["content"],
        author=performed_by,
        summary=f"Reverted to version {version_id}",
        yjs_state=v.get("yjs_state"),
        source_version=version_id
    )

    return True


# ROOMS + MEMBERSHIP
def create_room(room_id, name, description, genre, creator, max_members, privacy="public", password=None):
    try:
        hashed_pw = hash_password(password) if privacy == "private" and password else None

        cursor.execute("""
            INSERT INTO rooms (id, name, description, genre, creator, max_members, privacy, password, created_at, last_activity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (room_id, name, description, genre, creator, max_members, privacy, hashed_pw, datetime.now(), datetime.now()))
        conn.commit()

        create_room_document(room_id)
        add_room_member(room_id, creator)
        return True
    except Exception as e:
        print("ERROR creating room:", e)
        return False


def get_room(room_id):
    cursor.execute("""
        SELECT id, name, description, genre, creator, max_members, privacy, password, status, created_at, last_activity
        FROM rooms WHERE id = ?
    """, (room_id,))
    row = cursor.fetchone()
    if row:
        return {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "genre": row[3],
            "creator": row[4],
            "max_members": row[5],
            "privacy": row[6],
            "password": row[7],
            "status": row[8],
            "created_at": row[9],
            "last_activity": row[10],
        }
    return None


# 🔥 NEEDED BY /rooms.py
def get_rooms_by_genre(genre, sort_by="recent"):
    sort_clause = {
        "recent": "r.created_at DESC",
        "active": "r.last_activity DESC",
        "popular": "member_count DESC"
    }.get(sort_by, "r.created_at DESC")

    temp = conn.cursor()
    temp.execute(f"""
        SELECT r.id, r.name, r.description, r.genre, r.creator,
               r.max_members, r.privacy, r.status, r.created_at, r.last_activity,
               COALESCE(COUNT(rm.username), 0) AS member_count
        FROM rooms r
        LEFT JOIN room_members rm ON r.id = rm.room_id
        WHERE r.genre = ?
        GROUP BY r.id
        ORDER BY {sort_clause}
    """, (genre,))
    rows = temp.fetchall()
    temp.close()

    return [
        {
            "id": r[0], "name": r[1], "description": r[2], "genre": r[3],
            "creator": r[4], "max_members": r[5], "privacy": r[6],
            "status": r[7], "created_at": r[8], "last_activity": r[9],
            "member_count": r[10]
        }
        for r in rows
    ]


def get_user_rooms(username):
    temp = conn.cursor()
    temp.execute("""
        SELECT r.id, r.name, r.description, r.genre, r.creator,
               r.max_members, r.privacy, r.status, r.created_at, r.last_activity,
               COALESCE((SELECT COUNT(*) FROM room_members WHERE room_id = r.id), 0)
        FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id
        WHERE rm.username = ?
        ORDER BY rm.joined_at DESC
    """, (username,))
    rows = temp.fetchall()
    temp.close()

    return [
        {
            "id": r[0], "name": r[1], "description": r[2], "genre": r[3],
            "creator": r[4], "max_members": r[5], "privacy": r[6],
            "status": r[7], "created_at": r[8], "last_activity": r[9],
            "member_count": r[10]
        }
        for r in rows
    ]


def get_genre_room_counts():
    temp = conn.cursor()
    temp.execute("SELECT genre, COUNT(*) FROM rooms GROUP BY genre")
    rows = temp.fetchall()
    temp.close()
    return {r[0]: r[1] for r in rows}


def add_room_member(room_id, username):
    try:
        cursor.execute("""
            INSERT INTO room_members (room_id, username, joined_at)
            VALUES (?, ?, ?)
        """, (room_id, username, datetime.now()))
        conn.commit()
        return True
    except:
        return False


def remove_room_member(room_id, username):
    try:
        cursor.execute("""
            DELETE FROM room_members
            WHERE room_id = ? AND username = ?
        """, (room_id, username))
        conn.commit()
        return True
    except:
        return False


def get_room_member_count(room_id):
    temp = conn.cursor()
    temp.execute("SELECT COUNT(*) FROM room_members WHERE room_id = ?", (room_id,))
    result = temp.fetchone()[0]
    temp.close()
    return result


def is_room_member(room_id, username):
    cursor.execute("SELECT 1 FROM room_members WHERE room_id = ? AND username = ?", (room_id, username))
    return cursor.fetchone() is not None

def update_room_activity(room_id):
    """Update the room's last_activity timestamp when users edit."""
    cursor.execute("""
        UPDATE rooms 
        SET last_activity = ? 
        WHERE id = ?
    """, (datetime.now(), room_id))
    conn.commit()