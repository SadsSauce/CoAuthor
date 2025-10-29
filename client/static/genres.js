// Auth state
let currentUser = localStorage.getItem("username");

// DOM Elements
const genresContainer = document.getElementById("genresContainer");
const loginBtn = document.getElementById("loginBtn");
const myRoomsBtn = document.getElementById("myRoomsBtn");
const loginModal = document.getElementById("loginModal");
const closeLoginModal = document.getElementById("closeLoginModal");

// Load genres on page load
async function loadGenres() {
  try {
    const response = await fetch("/genres");
    const data = await response.json();
    
    genresContainer.innerHTML = "";
    
    data.genres.forEach(genre => {
      const card = document.createElement("a");
      card.className = "genre-card";
      card.href = `/rooms?genre=${genre.id}`;
      
      card.innerHTML = `
        <div class="genre-icon">${genre.icon}</div>
        <div class="genre-name">${genre.name}</div>
        <div class="genre-count">${genre.room_count} ${genre.room_count === 1 ? 'room' : 'rooms'}</div>
      `;
      
      genresContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Failed to load genres:", error);
    genresContainer.innerHTML = '<p style="text-align: center; color: #888;">Failed to load genres. Please refresh.</p>';
  }
}

// Auth UI functions
function updateAuthUI() {
  currentUser = localStorage.getItem("username");
  if (currentUser) {
    loginBtn.textContent = "Logout";
    loginBtn.title = `Logged in as ${currentUser}`;
    myRoomsBtn.style.display = "block";
  } else {
    loginBtn.textContent = "Login";
    loginBtn.title = "";
    myRoomsBtn.style.display = "none";
  }
}

function openLoginModal() {
  loginModal.style.display = "block";
}

function closeLogin() {
  loginModal.style.display = "none";
}

// Login button click
loginBtn.addEventListener("click", () => {
  if (currentUser) {
    // Logout
    localStorage.removeItem("username");
    localStorage.removeItem("activeRoom");
    updateAuthUI();
    alert("Logged out successfully!");
  } else {
    // Open login modal
    openLoginModal();
  }
});

// My Rooms button click
myRoomsBtn.addEventListener("click", () => {
  if (currentUser) {
    window.location.href = `/rooms?filter=my&username=${encodeURIComponent(currentUser)}`;
  } else {
    alert("Please log in first");
    openLoginModal();
  }
});

// Close modal
closeLoginModal.addEventListener("click", closeLogin);
window.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    closeLogin();
  }
});

// Login form submit
document.getElementById("loginSubmitBtn").addEventListener("click", async () => {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  
  if (!username || !password) {
    alert("Please fill out both fields");
    return;
  }
  
  try {
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
      loadGenres(); // Reload to show updated counts
    } else {
      const error = await response.json();
      alert(error.detail || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please try again.");
  }
});

// Create account form submit
document.getElementById("createAccountSubmitBtn").addEventListener("click", async () => {
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value.trim();
  
  if (!username || !password) {
    alert("Please fill out both fields");
    return;
  }
  
  if (username.length < 3) {
    alert("Username must be at least 3 characters long");
    return;
  }
  
  if (password.length < 4) {
    alert("Password must be at least 4 characters long");
    return;
  }
  
  try {
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password })
    });
    
    if (response.ok) {
      localStorage.setItem("username", username);
      updateAuthUI();
      closeLogin();
      alert("Account created successfully!");
      loadGenres(); // Reload to show updated counts
    } else {
      const error = await response.json();
      alert(error.detail || "Error creating account");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Failed to create account. Please try again.");
  }
});

// Initialize page
updateAuthUI();
loadGenres();

