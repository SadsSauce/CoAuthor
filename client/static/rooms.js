// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const genreId = urlParams.get('genre');
const filterParam = urlParams.get('filter') || 'all';
const usernameParam = urlParams.get('username');

// Auth state
let currentUser = localStorage.getItem("username");
let currentGenre = genreId;
let currentFilter = filterParam;
let currentSort = 'recent';

// DOM Elements
const roomsContainer = document.getElementById("roomsContainer");
const emptyState = document.getElementById("emptyState");
const createRoomBtn = document.getElementById("createRoomBtn");
const loginBtn = document.getElementById("loginBtn");
const createRoomModal = document.getElementById("createRoomModal");
const closeModal = document.getElementById("closeModal");
const createRoomForm = document.getElementById("createRoomForm");
const currentGenreSpan = document.getElementById("currentGenre");
const sortSelect = document.getElementById("sortBy");

// Load room sizes and genres
async function loadRoomOptions() {
  try {
    // Load genres
    const genresResponse = await fetch("/genres");
    const genresData = await genresResponse.json();
    
    const genreSelect = document.getElementById("roomGenre");
    genreSelect.innerHTML = '<option value="">Select Genre *</option>';
    genresData.genres.forEach(genre => {
      const option = document.createElement("option");
      option.value = genre.id;
      option.textContent = `${genre.icon} ${genre.name}`;
      if (genre.id === currentGenre) {
        option.selected = true;
      }
      genreSelect.appendChild(option);
    });
    
    // Set current genre name
    const currentGenreObj = genresData.genres.find(g => g.id === currentGenre);
    if (currentGenreObj) {
      currentGenreSpan.textContent = currentGenreObj.name;
    }
    
    // Load room sizes
    const sizesResponse = await fetch("/room-sizes");
    const sizesData = await sizesResponse.json();
    
    const sizeSelect = document.getElementById("roomSize");
    sizeSelect.innerHTML = '<option value="">Max Collaborators *</option>';
    sizesData.sizes.forEach(size => {
      const option = document.createElement("option");
      option.value = size.value;
      option.textContent = size.label;
      sizeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to load options:", error);
  }
}

// Load rooms
async function loadRooms() {
  try {
    let url = `/rooms/genre/${currentGenre}?sort=${currentSort}`;
    
    if (currentFilter === 'my' && currentUser) {
      url += `&filter_type=my&username=${encodeURIComponent(currentUser)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    roomsContainer.innerHTML = "";
    roomsContainer.style.display = "grid";
    emptyState.style.display = "none";
    
    if (!data.rooms || data.rooms.length === 0) {
      roomsContainer.style.display = "none";
      emptyState.style.display = "block";
    } else {
      data.rooms.forEach(room => {
        const card = createRoomCard(room);
        roomsContainer.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Failed to load rooms:", error);
    roomsContainer.style.display = "none";
    emptyState.style.display = "block";
    emptyState.innerHTML = '<p>No rooms found in this genre yet.</p><button onclick="document.getElementById(\'createRoomBtn\').click()">Create the first one!</button>';
  }
}

// Create room card
function createRoomCard(room) {
  const card = document.createElement("div");
  card.className = "room-card";
  
  const timeAgo = getTimeAgo(room.created_at);
  const isFull = room.member_count >= room.max_members;
  
  card.innerHTML = `
    <div class="room-card-header">
      <h3 class="room-title">${escapeHtml(room.name)}</h3>
      <span class="room-privacy">${room.privacy}</span>
    </div>
    <p class="room-description">${escapeHtml(room.description || 'No description provided')}</p>
    <div class="room-meta">
      <span class="room-creator">👤 ${escapeHtml(room.creator)}</span>
      <span class="room-members">👥 ${room.member_count}/${room.max_members}</span>
    </div>
    <div class="room-time">${timeAgo}</div>
    <button class="join-btn" ${isFull ? 'disabled' : ''} data-room-id="${room.id}">
      ${isFull ? 'Room Full' : 'Join Room'}
    </button>
  `;
  
  const joinBtn = card.querySelector(".join-btn");
  if (!isFull) {
    joinBtn.addEventListener("click", () => joinRoom(room.id, room.name));
  }
  
  return card;
}

// Join room
async function joinRoom(roomId, roomName) {
  if (!currentUser) {
    alert("Please log in first");
    window.location.href = "/genres";
    return;
  }
  
  try {
    const response = await fetch(`/rooms/${roomId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser })
    });
    
    if (response.ok) {
      // Store room info and current genre for back navigation
      localStorage.setItem("activeRoom", roomId);
      localStorage.setItem("activeRoomName", roomName);
      localStorage.setItem("activeGenre", currentGenre);
      console.log("Stored genre for back navigation:", currentGenre);
      window.location.href = "/editor";
    } else {
      const error = await response.json();
      alert(error.detail || "Failed to join room");
    }
  } catch (error) {
    console.error("Failed to join room:", error);
    alert("Failed to join room. Please try again.");
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000); // seconds
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return time.toLocaleDateString();
}

// Filter tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    currentFilter = btn.dataset.filter;
    loadRooms();
  });
});

// Sort change
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  loadRooms();
});

// Create room button
createRoomBtn.addEventListener("click", () => {
  if (!currentUser) {
    alert("Please log in first");
    window.location.href = "/genres";
    return;
  }
  createRoomModal.style.display = "block";
});

// Close modal
closeModal.addEventListener("click", () => {
  createRoomModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === createRoomModal) {
    createRoomModal.style.display = "none";
  }
});

// Create room form submit
createRoomForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("roomName").value.trim();
  const description = document.getElementById("roomDescription").value.trim();
  const genre = document.getElementById("roomGenre").value;
  const maxMembers = parseInt(document.getElementById("roomSize").value);
  const privacy = document.querySelector('input[name="privacy"]:checked').value;
  
  if (!name || !description || !genre || !maxMembers) {
    alert("Please fill out all required fields");
    return;
  }
  
  try {
    const response = await fetch("/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        genre,
        max_members: maxMembers,
        privacy,
        creator: currentUser
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      createRoomModal.style.display = "none";
      createRoomForm.reset();
      alert("Room created successfully!");
      
      // Navigate to the new room
      localStorage.setItem("activeRoom", data.room_id);
      localStorage.setItem("activeRoomName", name);
      localStorage.setItem("activeGenre", genre);
      window.location.href = "/editor";
    } else {
      const error = await response.json();
      alert(error.detail || "Failed to create room");
    }
  } catch (error) {
    console.error("Failed to create room:", error);
    alert("Failed to create room. Please try again.");
  }
});

// Logout button
loginBtn.addEventListener("click", () => {
  localStorage.removeItem("username");
  localStorage.removeItem("activeRoom");
  localStorage.removeItem("activeRoomName");
  alert("Logged out successfully!");
  window.location.href = "/genres";
});

// Initialize
if (!genreId) {
  console.error("No genre specified in URL");
  window.location.href = "/genres";
} else if (!currentUser) {
  console.error("No user logged in");
  alert("Please log in first");
  window.location.href = "/genres";
} else {
  loadRoomOptions();
  loadRooms();
}

