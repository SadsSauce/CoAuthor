# 🖋️ CoAuthor - Collaborative Storytelling Platform

CoAuthor is a real-time collaborative writing platform that allows multiple users to write stories together with live synchronization, similar to Google Docs.

## ✨ Features

- 🎭 **10 Genre Categories** - Fantasy, Sci-Fi, Romance, Horror, Mystery, Thriller, Drama, Comedy, Historical, Adventure
- 👥 **Real-time Collaboration** - Multiple users can edit the same document simultaneously
- 💬 **Live Chat** - Communicate with collaborators in real-time
- 🎨 **User Presence** - See who's currently in the room with colored avatars
- 🔐 **User Authentication** - Secure login and registration system
- 📊 **Room Management** - Create public/private rooms with customizable member limits
- 💾 **Auto-save** - Documents automatically save to the database
- 🔍 **Smart Filtering** - Filter by "All Rooms", "My Rooms", or "Popular"
- 📈 **Multiple Sorting** - Sort by Most Recent, Most Active, or Most Popular
- 🌐 **WebSocket Sync** - Real-time updates using WebSocket technology

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLite** - Lightweight database
- **WebSockets** - Real-time bidirectional communication
- **Uvicorn** - ASGI server

### Frontend
- **HTML5/CSS3** - Modern responsive design
- **Vanilla JavaScript** - No framework dependencies
- **WebSocket API** - Real-time sync

## 📋 Prerequisites

Before you begin, make sure you have:
- **Python 3.8+** installed ([Download Python](https://www.python.org/downloads/))
- **Git** installed ([Download Git](https://git-scm.com/downloads))
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## 🚀 Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd CoAuthor
```

### Step 2: Navigate to Server Directory

```bash
cd server
```

### Step 3: Create Virtual Environment

**On macOS/Linux:**
```bash
python3 -m venv venv
```

**On Windows:**
```bash
python -m venv venv
```

### Step 4: Activate Virtual Environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows (Command Prompt):**
```bash
venv\Scripts\activate
```

**On Windows (PowerShell):**
```bash
venv\Scripts\Activate.ps1
```

### Step 5: Install Dependencies

```bash
pip install -r requirements.txt
pip install python-multipart websockets
```

### Step 6: Run the Server

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 7: Open in Browser

Open your web browser and go to:
```
http://localhost:8000
```

## 📖 How to Use

### 1. Create an Account
1. Click the **"Login"** button in the top right
2. Scroll down to "Or create a new account"
3. Enter a username (minimum 3 characters)
4. Enter a password (minimum 4 characters)
5. Click **"Create Account"**

### 2. Browse Genres
- You'll see 10 genre cards on the home page
- Each card shows the number of available rooms
- Click any genre to see rooms in that category

### 3. Create a Story Room
1. Click **"+ Create Story"** button
2. Fill in the required fields:
   - **Story Title** - Name of your collaborative story
   - **Description** - Brief description of the story
   - **Genre** - Select from dropdown (auto-selected if you're in a genre)
   - **Max Collaborators** - Choose room size (2-10, 15-20, 30-50, 70-100)
   - **Privacy** - Public (anyone can join) or Private (invite-only)
3. Click **"Create Story"**

### 4. Join an Existing Room
1. Browse rooms in any genre
2. Click **"Join Room"** on any available story
3. Start writing!

### 5. Collaborate in Real-time
- **Type** in the text editor - all users see your changes instantly
- **See collaborators** - Colored avatars in the top right show who's online
- **Chat** - Send messages in the sidebar
- **Auto-save** - Your work is automatically saved
- **Export** - Download your story as a text file

## 🗺️ Navigation

- **🖋️ Logo** - Click anywhere to return to genres home page
- **← Genres** - From rooms list, return to genre selection
- **← Back to Rooms** - From editor, return to the room list

## 🎨 Room Filters & Sorting

### Filters
- **All Rooms** - Show all public rooms in the genre
- **My Rooms** - Show only rooms you've joined
- **Popular** - Show most popular rooms

### Sorting
- **Most Recent** - Newest rooms first
- **Most Active** - Recently edited rooms first
- **Most Popular** - Rooms with most members first

## 🔧 Project Structure

```
CoAuthor/
├── client/                 # Frontend files
│   ├── genres.html        # Genre selection page
│   ├── rooms.html         # Rooms list page
│   ├── editor.html        # Collaborative editor
│   └── static/
│       ├── genres.css     # Genre page styles
│       ├── genres.js      # Genre page logic
│       ├── rooms.css      # Rooms page styles
│       ├── rooms.js       # Rooms page logic
│       ├── editor.css     # Editor styles
│       └── editor.js      # Editor logic + WebSocket
├── server/                 # Backend files
│   ├── main.py            # FastAPI application
│   ├── db.py              # Database functions
│   ├── websocket_manager.py  # WebSocket connection manager
│   ├── requirements.txt   # Python dependencies
│   ├── coauthor.db        # SQLite database (auto-created)
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   │   ├── auth.py        # Authentication
│   │   ├── rooms.py       # Room management
│   │   ├── chat.py        # Chat (placeholder)
│   │   ├── mindmaps.py    # Mind maps (placeholder)
│   │   ├── gamification.py # Gamification (placeholder)
│   │   ├── version_control.py # Version control (placeholder)
│   │   └── export.py      # Export (placeholder)
│   └── schemas/
│       └── user_schema.py
└── README.md              # This file
```

## 📊 Database Schema

### Tables

**users**
- username (PRIMARY KEY)
- password

**rooms**
- id (PRIMARY KEY, UUID)
- name
- description
- genre
- creator
- max_members
- privacy (public/private)
- status (in_progress/completed)
- created_at
- last_activity

**room_members**
- room_id (FOREIGN KEY)
- username (FOREIGN KEY)
- joined_at

**documents**
- room_name (PRIMARY KEY)
- content
- yjs_state
- last_updated

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login

### Genres
- `GET /genres` - Get all genres with room counts
- `GET /room-sizes` - Get available room size options

### Rooms
- `GET /rooms/genre/{genre_id}` - Get rooms in a genre
- `POST /rooms` - Create new room
- `GET /rooms/{room_id}` - Get room details
- `POST /rooms/{room_id}/join` - Join a room
- `GET /users/{username}/rooms` - Get user's rooms

### WebSocket
- `WS /ws/{room_id}/{username}` - Real-time collaboration

## 🐛 Troubleshooting

### Port Already in Use
If you get "Address already in use" error:

**On macOS/Linux:**
```bash
lsof -ti:8000 | xargs kill -9
```

**On Windows:**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Module Not Found
Make sure you've activated the virtual environment:
```bash
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

### Database Locked
If you get database errors, close all connections and restart the server.

### Browser Showing Blank Page
- Do a **hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache
- Try in incognito/private mode

## 🔒 Security Notes

⚠️ **This is a development/educational project.** For production use:
- Implement proper password hashing (bcrypt, argon2)
- Add JWT token authentication
- Use HTTPS for WebSocket connections
- Add CORS configuration
- Implement rate limiting
- Add input validation and sanitization
- Use environment variables for configuration

## 🎓 For Development

### Running in Development Mode
The `--reload` flag automatically restarts the server when you make code changes:
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Stopping the Server
Press `Ctrl+C` in the terminal where the server is running.

## 🤝 Contributing

This is a collaborative class project. To contribute:
1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Create a pull request

## 📝 Testing Real-time Collaboration

1. Open `http://localhost:8000` in your browser
2. Login with one account
3. Join or create a room
4. Open a **second browser window** (or incognito mode)
5. Login with a **different account**
6. Join the **same room**
7. Start typing in one window - you'll see updates in the other!
8. Notice the **colored avatars** showing active users

## 🎯 Future Features (Planned)

- [ ] Rich text editor with formatting
- [ ] Document version control and history
- [ ] Mind mapping for brainstorming
- [ ] Gamification (achievements, points, leaderboards)
- [ ] Export to PDF/Word
- [ ] Voice chat integration
- [ ] Advanced cursor positioning
- [ ] User profiles and avatars
- [ ] Email notifications
- [ ] Mobile app

## 📄 License

See LICENSE file for details.

## 👨‍💻 Team

Created as part of a collaborative class assignment.

---

**Happy Collaborative Writing! 🎉**

For issues or questions, please contact your team members.

