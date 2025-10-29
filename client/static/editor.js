const username = localStorage.getItem("username");
const roomId = localStorage.getItem("activeRoom");
const roomName = localStorage.getItem("activeRoomName");

if (!username || !roomId) {
  window.location.href = "/genres";
}

const roomTitle = document.getElementById("roomTitle");
if (roomTitle) {
  roomTitle.textContent = roomName ? roomName : "Room";
}

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const textEditor = document.getElementById("textEditor");
const joinVoice = document.getElementById("joinVoice");
const voiceStatus = document.getElementById("voiceStatus");
const saveBtn = document.getElementById("saveBtn");
const exportBtn = document.getElementById("exportBtn");
const activeUsersContainer = document.getElementById("activeUsers");

// WebSocket connection
let ws = null;
let isConnected = false;
let localUpdate = false; // Flag to prevent echo when receiving own updates

// Connect to WebSocket
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/${encodeURIComponent(roomId)}/${encodeURIComponent(username)}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log("WebSocket connected");
    isConnected = true;
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  
  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  ws.onclose = () => {
    console.log("WebSocket disconnected");
    isConnected = false;
    // Attempt to reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000);
  };
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(data) {
  switch(data.type) {
    case 'init':
      // Initial document content
      localUpdate = true;
      textEditor.value = data.content || "";
      localUpdate = false;
      updateActiveUsers(data.users || []);
      break;
      
    case 'text_update':
      // Another user updated the text
      if (data.username !== username) {
        localUpdate = true;
        textEditor.value = data.content;
        localUpdate = false;
      }
      break;
      
    case 'user_joined':
      updateActiveUsers(data.users || []);
      if (data.message) {
        addChatMessage("System", data.message, "#888888");
      }
      break;
      
    case 'user_left':
      updateActiveUsers(data.users || []);
      if (data.message) {
        addChatMessage("System", data.message, "#888888");
      }
      break;
      
    case 'cursor_update':
      // Handle remote cursor updates (will implement cursor rendering)
      updateRemoteCursor(data.username, data.cursor, data.selection, data.color);
      break;
      
    case 'chat_message':
      addChatMessage(data.username, data.message);
      break;
  }
}

// Update active users display
function updateActiveUsers(users) {
  activeUsersContainer.innerHTML = "";
  
  users.forEach(user => {
    const avatar = document.createElement("div");
    avatar.className = "user-avatar";
    avatar.style.backgroundColor = user.color || "#888888";
    avatar.setAttribute("data-username", user.username);
    
    // Get initials from username
    const initials = user.username
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    avatar.textContent = initials;
    activeUsersContainer.appendChild(avatar);
  });
}

// Update remote cursor position
const remoteCursors = {};

function updateRemoteCursor(username, cursorPos, selection, color) {
  if (!cursorPos) return;
  
  // For now, we'll show a simple indicator that someone is typing
  // Full cursor positioning would require more complex calculations
  // based on textarea coordinates
  
  // Store the cursor data for this user
  remoteCursors[username] = { cursorPos, selection, color };
}

// Send text updates to server
let updateTimeout = null;

function sendTextUpdate() {
  if (!isConnected || localUpdate) return;
  
  // Debounce updates to avoid flooding the server
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'text_update',
      content: textEditor.value,
      changes: {
        // Could include diff information here
      }
    }));
  }, 300);
}

// Send cursor updates
function sendCursorUpdate() {
  if (!isConnected) return;
  
  const cursorPos = textEditor.selectionStart;
  const selectionEnd = textEditor.selectionEnd;
  const hasSelection = cursorPos !== selectionEnd;
  
  ws.send(JSON.stringify({
    type: 'cursor_update',
    cursor: cursorPos,
    selection: hasSelection ? { start: cursorPos, end: selectionEnd } : null
  }));
}

// Text editor events
if (textEditor) {
  textEditor.addEventListener("input", () => {
    sendTextUpdate();
  });
  
  textEditor.addEventListener("click", sendCursorUpdate);
  textEditor.addEventListener("keyup", sendCursorUpdate);
  textEditor.addEventListener("select", sendCursorUpdate);
}

// Chat functionality
function addChatMessage(sender, message, color = null) {
  if (!chatBox) return;
  
  const msg = document.createElement("div");
  if (color) {
    msg.innerHTML = `<span style="color: ${color}; font-weight: bold;">${sender}:</span> ${message}`;
  } else {
    msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
  }
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

if (chatInput && chatBox) {
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && chatInput.value.trim()) {
      const message = chatInput.value.trim();
      
      // Send chat message via WebSocket
      if (isConnected) {
        ws.send(JSON.stringify({
          type: 'chat_message',
          message: message
        }));
      }
      
      chatInput.value = "";
    }
  });
}

// Voice chat toggle
if (joinVoice && voiceStatus) {
  let connected = false;
  joinVoice.addEventListener("click", () => {
    connected = !connected;
    voiceStatus.textContent = connected ? "Connected" : "Not connected";
    joinVoice.textContent = connected ? "🔇 Leave" : "🎙 Join";
  });
}

// Save button
if (saveBtn && textEditor) {
  saveBtn.addEventListener("click", () => {
    // Already auto-saved via WebSocket, but provide user feedback
    alert("Document is automatically saved to the server!");
  });
}

// Export button
if (exportBtn && textEditor) {
  exportBtn.addEventListener("click", () => {
    const blob = new Blob([textEditor.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${roomName || "story"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

// Back button navigation
const backBtn = document.querySelector('.backBtn');
if (backBtn) {
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Get stored genre and navigate back to rooms list
    const storedGenre = localStorage.getItem("activeGenre");
    console.log("Back button clicked. Stored genre:", storedGenre);
    if (storedGenre) {
      console.log("Navigating to:", `/rooms?genre=${storedGenre}`);
      window.location.href = `/rooms?genre=${storedGenre}`;
    } else {
      console.log("No genre stored, going to genres page");
      window.location.href = "/genres";
    }
  });
}

// Initialize WebSocket connection
connectWebSocket();

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  if (ws && isConnected) {
    ws.close();
  }
});
