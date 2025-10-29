import sqlite3
import json
from datetime import datetime

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
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    genre TEXT NOT NULL,
    creator TEXT NOT NULL,
    max_members INTEGER DEFAULT 10,
    privacy TEXT DEFAULT 'public',
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

# Predefined genres
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
    {"id": "adventure", "name": "Adventure", "icon": "🗺️"}
]

# Room size options
ROOM_SIZES = [
    {"value": 10, "label": "2-10 members"},
    {"value": 20, "label": "15-20 members"},
    {"value": 50, "label": "30-50 members"},
    {"value": 100, "label": "70-100 members"}
]

def get_user(username):
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    if row:
        return {"username": row[0], "password": row[1]}
    return None

def create_user(username, password):
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
    conn.commit()

def get_document(room_name):
    cursor.execute("SELECT content, yjs_state FROM documents WHERE room_name = ?", (room_name,))
    row = cursor.fetchone()
    if row:
        return {"content": row[0], "yjs_state": row[1]}
    return None

def save_document(room_name, content, yjs_state=None):
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
    """Initialize a document for a new room if it doesn't exist"""
    if not get_document(room_name):
        save_document(room_name, "", None)

# Room management functions
def create_room(room_id, name, description, genre, creator, max_members, privacy="public"):
    """Create a new room"""
    try:
        cursor.execute("""
            INSERT INTO rooms (id, name, description, genre, creator, max_members, privacy, created_at, last_activity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (room_id, name, description, genre, creator, max_members, privacy, datetime.now(), datetime.now()))
        conn.commit()
        
        # Initialize document for the room
        create_room_document(room_id)
        
        # Add creator as first member
        add_room_member(room_id, creator)
        
        return True
    except Exception as e:
        print(f"Error creating room: {e}")
        return False

def get_room(room_id):
    """Get room details by ID"""
    cursor.execute("""
        SELECT id, name, description, genre, creator, max_members, privacy, status, created_at, last_activity
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
            "status": row[7],
            "created_at": row[8],
            "last_activity": row[9]
        }
    return None

def get_rooms_by_genre(genre, sort_by="recent"):
    """Get all rooms in a specific genre"""
    sort_clause = {
        "recent": "r.created_at DESC",
        "active": "r.last_activity DESC",
        "popular": "member_count DESC"
    }.get(sort_by, "r.created_at DESC")
    
    # Use JOIN with subquery to avoid cursor recursion
    temp_cursor = conn.cursor()
    temp_cursor.execute(f"""
        SELECT 
            r.id, r.name, r.description, r.genre, r.creator, 
            r.max_members, r.privacy, r.status, r.created_at, r.last_activity,
            COALESCE(COUNT(rm.username), 0) as member_count
        FROM rooms r
        LEFT JOIN room_members rm ON r.id = rm.room_id
        WHERE r.genre = ? AND r.privacy = 'public'
        GROUP BY r.id
        ORDER BY {sort_clause}
    """, (genre,))
    
    rows = temp_cursor.fetchall()
    temp_cursor.close()
    
    rooms = []
    for row in rows:
        room = {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "genre": row[3],
            "creator": row[4],
            "max_members": row[5],
            "privacy": row[6],
            "status": row[7],
            "created_at": row[8],
            "last_activity": row[9],
            "member_count": row[10]
        }
        rooms.append(room)
    return rooms

def get_user_rooms(username):
    """Get all rooms a user is a member of"""
    temp_cursor = conn.cursor()
    temp_cursor.execute("""
        SELECT 
            r.id, r.name, r.description, r.genre, r.creator, 
            r.max_members, r.privacy, r.status, r.created_at, r.last_activity,
            COALESCE((SELECT COUNT(*) FROM room_members WHERE room_id = r.id), 0) as member_count
        FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id
        WHERE rm.username = ?
        ORDER BY rm.joined_at DESC
    """, (username,))
    
    rows = temp_cursor.fetchall()
    temp_cursor.close()
    
    rooms = []
    for row in rows:
        room = {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "genre": row[3],
            "creator": row[4],
            "max_members": row[5],
            "privacy": row[6],
            "status": row[7],
            "created_at": row[8],
            "last_activity": row[9],
            "member_count": row[10]
        }
        rooms.append(room)
    return rooms

def get_genre_room_counts():
    """Get count of rooms per genre"""
    temp_cursor = conn.cursor()
    temp_cursor.execute("""
        SELECT genre, COUNT(*) as count
        FROM rooms
        WHERE privacy = 'public'
        GROUP BY genre
    """)
    rows = temp_cursor.fetchall()
    temp_cursor.close()
    return {row[0]: row[1] for row in rows}

def add_room_member(room_id, username):
    """Add a user to a room"""
    try:
        cursor.execute("""
            INSERT INTO room_members (room_id, username, joined_at)
            VALUES (?, ?, ?)
        """, (room_id, username, datetime.now()))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error adding room member: {e}")
        return False

def remove_room_member(room_id, username):
    """Remove a user from a room"""
    try:
        cursor.execute("""
            DELETE FROM room_members
            WHERE room_id = ? AND username = ?
        """, (room_id, username))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error removing room member: {e}")
        return False

def get_room_members(room_id):
    """Get all members of a room"""
    cursor.execute("""
        SELECT username, joined_at
        FROM room_members
        WHERE room_id = ?
        ORDER BY joined_at
    """, (room_id,))
    rows = cursor.fetchall()
    return [{"username": row[0], "joined_at": row[1]} for row in rows]

def get_room_member_count(room_id):
    """Get count of members in a room"""
    # Use a separate cursor to avoid recursion issues
    temp_cursor = conn.cursor()
    temp_cursor.execute("""
        SELECT COUNT(*) FROM room_members WHERE room_id = ?
    """, (room_id,))
    result = temp_cursor.fetchone()[0]
    temp_cursor.close()
    return result

def is_room_member(room_id, username):
    """Check if a user is a member of a room"""
    cursor.execute("""
        SELECT 1 FROM room_members
        WHERE room_id = ? AND username = ?
    """, (room_id, username))
    return cursor.fetchone() is not None

def update_room_activity(room_id):
    """Update the last_activity timestamp for a room"""
    cursor.execute("""
        UPDATE rooms
        SET last_activity = ?
        WHERE id = ?
    """, (datetime.now(), room_id))
    conn.commit()