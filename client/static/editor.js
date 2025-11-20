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
const versionsBtn = document.getElementById("versionsBtn");
const versionsModal = document.getElementById("versionsModal");

// WebSocket connection
let ws = null;
let isConnected = false;
let localUpdate = false; 


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
    setTimeout(connectWebSocket, 3000);
  };
}

function handleWebSocketMessage(data) {
  switch(data.type) {
    case 'init':
      localUpdate = true;
      textEditor.value = data.content || "";
      localUpdate = false;
      updateActiveUsers(data.users || []);
      break;
      
    case 'text_update':
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
      updateRemoteCursor(data.username, data.cursor, data.selection, data.color);
      break;
      
    case 'chat_message':
      addChatMessage(data.username, data.message);
      break;
  }
}

function updateActiveUsers(users) {
  activeUsersContainer.innerHTML = "";
  
  users.forEach(user => {
    const avatar = document.createElement("div");
    avatar.className = "user-avatar";
    avatar.style.backgroundColor = user.color || "#888888";
    avatar.setAttribute("data-username", user.username);
    
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


const remoteCursors = {};

function updateRemoteCursor(username, cursorPos, selection, color) {
  if (!cursorPos) return;
  
  remoteCursors[username] = { cursorPos, selection, color };
}

// Send text updates to server
let updateTimeout = null;

function sendTextUpdate() {
  if (!isConnected || localUpdate) return;
  
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'text_update',
      content: textEditor.value,
      changes: {

      }
    }));
  }, 250);
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
    if (isConnected) {
      ws.send(JSON.stringify({
        type: 'save_version',
        content: textEditor.value,
        summary: 'Manual save'
      }));
      alert('Version saved (manual).');
    } else {
      alert('Not connected to server. Save will be attempted when connection is restored.');
    }
  });
}


async function fetchVersions() {
  try {
    const resp = await fetch(`/version_control/${encodeURIComponent(roomId)}/versions`);
    if (!resp.ok) throw new Error('Failed to fetch versions');
    const data = await resp.json();
    return data.versions || [];
  } catch (err) {
    console.error('Error fetching versions:', err);
    return [];
  }
}

function closeVersionsModal() {
  if (!versionsModal) return;
  versionsModal.innerHTML = '';
  versionsModal.style.display = 'none';
  versionsModal.setAttribute('aria-hidden', 'true');
}

async function openVersionsModal() {
  if (!versionsModal) return;
  versionsModal.style.display = 'block';
  versionsModal.setAttribute('aria-hidden', 'false');
  versionsModal.innerHTML = `<div class="versions-panel">
    <div class="versions-header">
      <h3>Version History</h3>
      <button id="closeVersionsBtn">Close</button>
    </div>
    <div id="versionsList" class="versions-list">Loading versions...</div>
    <div id="versionsPreview" class="versions-preview" style="display:none"></div>
  </div>`;

  document.getElementById('closeVersionsBtn').addEventListener('click', closeVersionsModal);

  const listContainer = document.getElementById('versionsList');
  const versions = await fetchVersions();
  if (!versions.length) {
    listContainer.innerHTML = '<div class="empty">No versions yet.</div>';
    return;
  }

  listContainer.innerHTML = '';
  versions.forEach(v => {
    const item = document.createElement('div');
    item.className = 'version-item';
    item.innerHTML = `
      <div class="meta"><strong>v${v.id}</strong> — ${v.author || 'unknown'} — ${v.created_at}</div>
      <div class="summary">${v.summary || ''}</div>
      <div class="actions">
        <button class="preview-btn" data-id="${v.id}">Preview</button>
        <button class="restore-btn" data-id="${v.id}">Restore</button>
      </div>`;
    listContainer.appendChild(item);
  });

  // wire preview & restore
  listContainer.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const preview = document.getElementById('versionsPreview');
      preview.style.display = 'block';
      preview.innerHTML = '<div class="loading">Loading preview...</div>';
      try {
        const resp = await fetch(`/version_control/${encodeURIComponent(roomId)}/versions/${id}`);
        if (!resp.ok) throw new Error('Preview failed');
        const data = await resp.json();
        preview.innerHTML = `<h4>Preview v${data.version.id}</h4><textarea readonly class="preview-text">${(data.version.content || '')}</textarea>`;
      } catch (err) {
        preview.innerHTML = '<div class="error">Failed to load preview</div>';
      }
    });
  });

  listContainer.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (!confirm(`Are you sure you want to revert to version ${id}? This will create a new snapshot.`)) return;
      try {
        const resp = await fetch(`/version_control/versions/${id}/revert?performed_by=${encodeURIComponent(username)}`, { method: 'POST' });
        if (!resp.ok) throw new Error('Revert failed');

        const verResp = await fetch(`/version_control/${encodeURIComponent(roomId)}/versions/${id}`);
        const verData = await verResp.json();
        const content = verData.version.content || '';

        localUpdate = true;
        textEditor.value = content;
        localUpdate = false;

        if (isConnected) {
          ws.send(JSON.stringify({ type: 'text_update', content }));
        }

        alert('Reverted to version ' + id);
        closeVersionsModal();
      } catch (err) {
        console.error('Revert error', err);
        alert('Failed to revert to version');
      }
    });
  });
}

if (versionsBtn) {
  versionsBtn.addEventListener('click', () => openVersionsModal());
}



const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000; 
let autosaveTimer = setInterval(() => {
  if (!isConnected) return;
  try {
    ws.send(JSON.stringify({ type: 'save_version', content: textEditor.value, summary: 'Autosave (5min)' }));
    console.log('Autosave triggered');
  } catch (err) {
    console.error('Autosave error:', err);
  }
}, AUTOSAVE_INTERVAL_MS);


if (exportBtn && textEditor) {
  exportBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const text = textEditor.value;
    const lines = doc.splitTextToSize(text, 180); 
    doc.text(lines, 10, 10);
    doc.save(`${roomTitle.textContent || "story"}.pdf`);
  });
}

// Back button navigation
const backBtn = document.querySelector('.backBtn');
if (backBtn) {
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
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


const logoLink = document.querySelector(".logo-link");
if (logoLink) {
  logoLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/genres";
  });
}


connectWebSocket();


window.addEventListener("beforeunload", () => {
  if (ws && isConnected) {
    ws.close();
  }
});
