const urlParams = new URLSearchParams(window.location.search);
const genreId = urlParams.get("genre");
const filterParam = urlParams.get("filter") || "all";

let currentUser = localStorage.getItem("username");
let currentGenre = genreId;
let currentFilter = filterParam;
let currentSort = "recent";

if (genreId) {
  document.body.setAttribute("data-genre", genreId);
}

const roomsContainer = document.getElementById("roomsContainer");
const emptyState = document.getElementById("emptyState");
const createRoomBtn = document.getElementById("createRoomBtn");
const loginBtn = document.getElementById("loginBtn");
const createRoomModal = document.getElementById("createRoomModal");
const closeModal = document.getElementById("closeModal");
const createRoomForm = document.getElementById("createRoomForm");
const currentGenreSpan = document.getElementById("currentGenre");
const sortSelect = document.getElementById("sortBy");

async function loadRoomOptions() {
  try {
    const genresResponse = await fetch("/api/genres");
    if (!genresResponse.ok) throw new Error(genresResponse.status);
    const genresData = await genresResponse.json();

    const genreSelect = document.getElementById("roomGenre");
    genreSelect.innerHTML = '<option value="">Select Genre *</option>';
    if (genresData && genresData.genres) {
      genresData.genres.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = `${g.icon} ${g.name}`;
        if (g.id === currentGenre) opt.selected = true;
        genreSelect.appendChild(opt);
      });
    }

    const currentGenreObj =
      genresData.genres && genresData.genres.find((g) => g.id === currentGenre);
    if (currentGenreObj && currentGenreSpan) {
      currentGenreSpan.textContent = currentGenreObj.name;
    }

    const sizesResponse = await fetch("/api/room-sizes");
    if (!sizesResponse.ok) throw new Error(sizesResponse.status);
    const sizesData = await sizesResponse.json();

    const sizeSelect = document.getElementById("roomSize");
    sizeSelect.innerHTML = '<option value="">Max Collaborators *</option>';
    if (sizesData && sizesData.sizes) {
      sizesData.sizes.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.value;
        opt.textContent = s.label;
        sizeSelect.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("Failed to load options", e);
    alert("Failed to load form options. Please refresh the page.");
  }
}

async function loadRooms() {
  try {
    let url = `/api/rooms/genre/${currentGenre}?sort=${currentSort}`;
    if (currentFilter === "my" && currentUser) {
      url += `&filter_type=my&username=${encodeURIComponent(currentUser)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    roomsContainer.innerHTML = "";
    if (!data.rooms || data.rooms.length === 0) {
      roomsContainer.style.display = "none";
      emptyState.style.display = "block";
    } else {
      emptyState.style.display = "none";
      roomsContainer.style.display = "grid";
      data.rooms.forEach((room) => {
        roomsContainer.appendChild(createRoomCard(room));
      });
    }
  } catch (e) {
    console.error("Failed to load rooms", e);
    roomsContainer.style.display = "none";
    emptyState.style.display = "block";
    emptyState.innerHTML =
      '<p>No rooms found in this genre yet.</p><button onclick="document.getElementById(\'createRoomBtn\').click()">Create the first one!</button>';
  }
}

function createRoomCard(room) {
  const card = document.createElement("div");
  card.className = "room-card";

  const timeAgo = getTimeAgo(room.created_at);
  const isFull = room.member_count >= room.max_members;
  const privacyLabel = room.privacy === "private" ? "Private" : "Public";

  card.innerHTML = `
    <div class="room-card-header">
      <h3 class="room-title">${escapeHtml(room.name)}</h3>
      <span class="room-privacy">${privacyLabel}</span>
    </div>
    <p class="room-description">${escapeHtml(
      room.description || "No description provided"
    )}</p>
    <div class="room-meta">
      <span class="room-creator">👤 ${escapeHtml(room.creator)}</span>
      <span class="room-members">👥 ${room.member_count}/${room.max_members}</span>
    </div>
    <div class="room-time">${timeAgo}</div>
    <button class="join-btn" ${
      isFull ? "disabled" : ""
    } data-room-id="${room.id}" data-privacy="${room.privacy}">
      ${
        isFull
          ? "Room Full"
          : room.privacy === "private"
          ? "Join (Private)"
          : "Join Room"
      }
    </button>
  `;

  const joinBtn = card.querySelector(".join-btn");
  if (!isFull) {
    joinBtn.addEventListener("click", () => {
      const privacy = joinBtn.getAttribute("data-privacy");
      joinRoom(room.id, room.name, privacy);
    });
  }

  return card;
}

async function joinRoom(roomId, roomName, privacy) {
  if (!currentUser) {
    alert("Please log in first");
    window.location.href = "/genres";
    return;
  }

  const roomRes = await fetch(`/api/rooms/${roomId}`);
  const roomData = await roomRes.json();

  let password = null;

  if (privacy === "private" && currentUser !== roomData.creator) {
    password = prompt("This is a private room. Enter the password:");
    if (!password) {
      alert("Password is required to join this private room.");
      return;
    }
  }

  try {
    const res = await fetch(`/api/rooms/${roomId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: currentUser,
        password: password,
      }),
    });

    if (res.ok) {
      localStorage.setItem("activeRoom", roomId);
      localStorage.setItem("activeRoomName", roomName);
      localStorage.setItem("activeGenre", currentGenre);
      window.location.href = "/editor";
    } else {
      const err = await res.json();
      alert(err.detail || "Failed to join room");
    }
  } catch (e) {
    console.error("Failed to join room", e);
    alert("Failed to join room. Please try again.");
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return time.toLocaleDateString();
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    loadRooms();
  });
});

sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  loadRooms();
});

createRoomBtn.addEventListener("click", () => {
  if (!currentUser) {
    alert("Please log in first");
    window.location.href = "/genres";
    return;
  }
  createRoomModal.style.display = "block";
});

closeModal.addEventListener("click", () => {
  createRoomModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === createRoomModal) {
    createRoomModal.style.display = "none";
  }
});

createRoomForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("roomName").value.trim();
  const description = document.getElementById("roomDescription").value.trim();
  const genre = document.getElementById("roomGenre").value;
  const maxMembers = parseInt(document.getElementById("roomSize").value, 10);
  const privacy = document.querySelector('input[name="privacy"]:checked').value;

  if (!name || !description || !genre || !maxMembers) {
    alert("Please fill out all required fields");
    return;
  }

  let password = null;
  if (privacy === "private") {
    password = prompt("Set a password for this private room:");
    if (!password) {
      alert("Password is required for private rooms.");
      return;
    }
  }

  try {
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        description: description,
        genre: genre,
        max_members: maxMembers,
        privacy: privacy,
        creator: currentUser,
        password: password,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      createRoomModal.style.display = "none";
      createRoomForm.reset();
      alert("Room created successfully!");
      localStorage.setItem("activeRoom", data.room_id);
      localStorage.setItem("activeRoomName", name);
      localStorage.setItem("activeGenre", genre);
      window.location.href = "/editor";
    } else {
      const err = await res.json();
      alert(err.detail || "Failed to create room");
    }
  } catch (e) {
    console.error("Failed to create room", e);
    alert("Failed to create room. Please try again.");
  }
});

loginBtn.addEventListener("click", () => {
  localStorage.removeItem("username");
  localStorage.removeItem("activeRoom");
  localStorage.removeItem("activeRoomName");
  alert("Logged out successfully!");
  window.location.href = "/genres";
});

const backToGenresLink = document.getElementById("backToGenres");
if (backToGenresLink) {
  backToGenresLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/genres";
  });
}

const logoLink = document.querySelector(".logo-link");
if (logoLink) {
  logoLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/genres";
  });
}

if (!genreId) {
  window.location.href = "/genres";
} else if (!currentUser) {
  alert("Please log in first");
  window.location.href = "/genres";
} else {
  loadRoomOptions();
  loadRooms();
}
