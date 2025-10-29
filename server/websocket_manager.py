from fastapi import WebSocket
from typing import Dict, List, Set
import json
from db import get_document, save_document, update_room_activity

class ConnectionManager:
    def __init__(self):
        # Room-based connections: {room_name: {username: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # Track user awareness data: {room_name: {username: {cursor, selection, color}}}
        self.user_awareness: Dict[str, Dict[str, dict]] = {}
        # Assign colors to users
        self.user_colors = [
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
            "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788"
        ]
        self.color_index = 0

    def get_user_color(self, room_name: str, username: str) -> str:
        """Assign a consistent color to a user in a room"""
        if room_name in self.user_awareness and username in self.user_awareness[room_name]:
            return self.user_awareness[room_name][username].get("color", "#888888")
        
        color = self.user_colors[self.color_index % len(self.user_colors)]
        self.color_index += 1
        return color

    async def connect(self, websocket: WebSocket, room_name: str, username: str):
        await websocket.accept()
        
        if room_name not in self.active_connections:
            self.active_connections[room_name] = {}
            self.user_awareness[room_name] = {}
        
        self.active_connections[room_name][username] = websocket
        
        # Initialize user awareness with color
        color = self.get_user_color(room_name, username)
        self.user_awareness[room_name][username] = {
            "username": username,
            "color": color,
            "cursor": None,
            "selection": None
        }
        
        # Send initial document state to the connecting user
        doc = get_document(room_name)
        if doc:
            await websocket.send_json({
                "type": "init",
                "content": doc["content"],
                "users": await self.get_room_users(room_name)
            })
        else:
            await websocket.send_json({
                "type": "init",
                "content": "",
                "users": await self.get_room_users(room_name)
            })
        
        # Notify others that a user joined
        await self.broadcast_to_room(room_name, {
            "type": "user_joined",
            "username": username,
            "users": await self.get_room_users(room_name),
            "message": f"{username} joined the room"
        }, exclude_user=username)

    def disconnect(self, room_name: str, username: str):
        if room_name in self.active_connections:
            if username in self.active_connections[room_name]:
                del self.active_connections[room_name][username]
            if username in self.user_awareness[room_name]:
                del self.user_awareness[room_name][username]
            
            # Clean up empty rooms
            if not self.active_connections[room_name]:
                del self.active_connections[room_name]
                if room_name in self.user_awareness:
                    del self.user_awareness[room_name]

    async def get_room_users(self, room_name: str) -> List[dict]:
        """Get list of active users in a room with their awareness data"""
        if room_name not in self.user_awareness:
            return []
        
        return [
            {
                "username": username,
                "color": data.get("color", "#888888"),
                "cursor": data.get("cursor"),
                "selection": data.get("selection")
            }
            for username, data in self.user_awareness[room_name].items()
        ]

    async def broadcast_to_room(self, room_name: str, message: dict, exclude_user: str = None):
        """Broadcast a message to all users in a room"""
        if room_name not in self.active_connections:
            return
        
        for username, connection in self.active_connections[room_name].items():
            if exclude_user and username == exclude_user:
                continue
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to {username}: {e}")

    async def handle_message(self, room_name: str, username: str, message: dict):
        """Handle incoming WebSocket messages"""
        msg_type = message.get("type")
        
        if msg_type == "text_update":
            # Broadcast text changes to all other users
            content = message.get("content", "")
            changes = message.get("changes", {})
            
            # Save to database
            save_document(room_name, content)
            
            # Update room activity
            update_room_activity(room_name)
            
            # Broadcast to others
            await self.broadcast_to_room(room_name, {
                "type": "text_update",
                "username": username,
                "content": content,
                "changes": changes
            }, exclude_user=username)
        
        elif msg_type == "cursor_update":
            # Update cursor position in awareness
            cursor_pos = message.get("cursor")
            selection = message.get("selection")
            
            if room_name in self.user_awareness and username in self.user_awareness[room_name]:
                self.user_awareness[room_name][username]["cursor"] = cursor_pos
                self.user_awareness[room_name][username]["selection"] = selection
            
            # Broadcast cursor update to others
            await self.broadcast_to_room(room_name, {
                "type": "cursor_update",
                "username": username,
                "cursor": cursor_pos,
                "selection": selection,
                "color": self.user_awareness[room_name][username].get("color", "#888888")
            }, exclude_user=username)
        
        elif msg_type == "chat_message":
            # Broadcast chat message to everyone including sender
            chat_msg = message.get("message", "")
            await self.broadcast_to_room(room_name, {
                "type": "chat_message",
                "username": username,
                "message": chat_msg
            })

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")

manager = ConnectionManager()

