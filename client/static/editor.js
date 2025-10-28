const username = localStorage.getItem("username");
const roomName = localStorage.getItem("activeRoom");

if (!username) {
  window.location.href = "/";
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

if (chatInput && chatBox) {
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && chatInput.value.trim()) {
      const msg = document.createElement("div");
      msg.textContent = `${username}: ${chatInput.value.trim()}`;
      chatBox.appendChild(msg);
      chatBox.scrollTop = chatBox.scrollHeight;
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

if (saveBtn && textEditor) {
  saveBtn.addEventListener("click", () => {
    const key = `doc:${roomName}:${username}`;
    localStorage.setItem(key, textEditor.value);
    alert("Saved locally.");
  });
}

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
