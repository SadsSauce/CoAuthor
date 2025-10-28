const roomTableBody = document.querySelector("#roomTable tbody");

async function loadRooms() {
  try {
    const response = await fetch("/rooms");
    const data = await response.json();
    roomTableBody.innerHTML = "";
    data.rooms.forEach(room => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${room}</td>
        <td>1</td>
        <td><button class="joinBtn">Join</button></td>
      `;
      roomTableBody.appendChild(row);
    });
    addJoinListeners();
  } catch (err) {
    console.error("Failed to load rooms:", err);
  }
}
loadRooms();

function addJoinListeners() {
  document.querySelectorAll(".joinBtn").forEach(button => {
    button.addEventListener("click", event => {
      const row = event.target.closest("tr");
      const roomName = row.querySelector("td").textContent;
      const username = localStorage.getItem("username");
      if (!username) {
        openLoginModal();
        alert("Please log in first.");
        return;
      }
      localStorage.setItem("activeRoom", roomName);
      window.location.href = "/editor";
    });
  });
}

const modal = document.getElementById("createRoomModal");
const createRoomBtn = document.getElementById("createRoomBtn");
const closeModal = document.getElementById("closeModal");
const confirmCreateRoom = document.getElementById("confirmCreateRoom");
const newRoomInput = document.getElementById("newRoomName");

createRoomBtn.addEventListener("click", () => {
  const username = localStorage.getItem("username");
  if (!username) {
    openLoginModal();
    alert("Please log in first.");
    return;
  }
  modal.style.display = "block";
  newRoomInput.value = "";
  newRoomInput.focus();
});
closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", (event) => {
  if (event.target === modal) modal.style.display = "none";
});
confirmCreateRoom.addEventListener("click", async () => {
  const roomName = newRoomInput.value.trim();
  if (!roomName) return;
  await fetch("/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room_name: roomName })
  });
  modal.style.display = "none";
  loadRooms();
});

const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const closeLoginModal = document.getElementById("closeLoginModal");

function openLoginModal() { loginModal.style.display = "block"; }
function closeLogin() { loginModal.style.display = "none"; }

loginBtn.addEventListener("click", () => {
  const username = localStorage.getItem("username");
  if (username) {
    localStorage.removeItem("username");
    updateAuthUI();
    alert("Logged out.");
  } else {
    openLoginModal();
  }
});
closeLoginModal.addEventListener("click", () => closeLogin());
window.addEventListener("click", (event) => {
  if (event.target === loginModal) closeLogin();
});

document.getElementById("loginSubmitBtn").addEventListener("click", async () => {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  if (!username || !password) {
    alert("Please fill out both fields");
    return;
  }
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password })
  });
  if (response.ok) {
    localStorage.setItem("username", username);
    updateAuthUI();
    closeLogin();
    alert("Login successful!");
  } else {
    const error = await response.json();
    alert(error.detail || "Login failed");
  }
});

document.getElementById("createAccountSubmitBtn").addEventListener("click", async () => {
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value.trim();
  if (!username || !password) {
    alert("Please fill out both fields");
    return;
  }
  const response = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password })
  });
  if (response.ok) {
    localStorage.setItem("username", username);
    updateAuthUI();
    closeLogin();
    alert("Account created!");
  } else {
    const error = await response.json();
    alert(error.detail || "Error creating account");
  }
});

function updateAuthUI() {
  const username = localStorage.getItem("username");
  if (username) {
    loginBtn.textContent = "Logout";
    loginBtn.title = `Logged in as ${username}`;
  } else {
    loginBtn.textContent = "Login";
    loginBtn.title = "";
  }
}
updateAuthUI();

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("keyup", () => {
    const filter = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll("#roomTable tbody tr");
    rows.forEach(row => {
      const roomName = row.querySelector("td").textContent.toLowerCase();
      row.style.display = roomName.includes(filter) ? "" : "none";
    });
  });
}
