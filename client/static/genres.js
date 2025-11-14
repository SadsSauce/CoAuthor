console.log("Genres.js loaded - version 2.0");

// Auth state
let currentUser = localStorage.getItem("username");

// DOM Elements
let genresContainer, loginBtn, myRoomsBtn, loginModal, closeLoginModal;

// Wait for DOM to be ready
function initDOM() {
  genresContainer = document.getElementById("genresContainer");
  loginBtn = document.getElementById("loginBtn");
  myRoomsBtn = document.getElementById("myRoomsBtn");
  loginModal = document.getElementById("loginModal");
  closeLoginModal = document.getElementById("closeLoginModal");
  
  if (!genresContainer) {
    console.error("genresContainer not found!");
    return false;
  }
  return true;
}

// Load genres on page load
async function loadGenres() {
  if (!genresContainer) {
    console.error("genresContainer not available");
    return;
  }
  
  try {
    console.log("Fetching genres from /api/genres");
    const response = await fetch("/api/genres");
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received data:", data);
    
    if (!data || !data.genres) {
      throw new Error("Invalid response format");
    }
    
    genresContainer.innerHTML = "";
    
    if (data.genres.length === 0) {
      genresContainer.innerHTML = '<p style="text-align: center; color: #888;">No genres available.</p>';
      return;
    }
    
    data.genres.forEach(genre => {
      const card = document.createElement("a");
      card.className = "genre-card";
      card.href = `/rooms?genre=${genre.id}`;
      
      card.innerHTML = `
        <div class="genre-icon">${genre.icon || "📚"}</div>
        <div class="genre-name">${genre.name}</div>
        <div class="genre-count">${genre.room_count} ${genre.room_count === 1 ? 'room' : 'rooms'}</div>
      `;
      
      genresContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Failed to load genres:", error);
    if (genresContainer) {
      genresContainer.innerHTML = '<p style="text-align: center; color: #888;">Failed to load genres. Please refresh.</p>';
    }
  }
}

// Auth UI functions
function updateAuthUI() {
  if (!loginBtn || !myRoomsBtn) return;
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
  if (loginModal) loginModal.style.display = "block";
}

function closeLogin() {
  if (loginModal) loginModal.style.display = "none";
}

// Setup event listeners
function setupEventListeners() {
  // Login button click
  if (loginBtn) {
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
  }

  // My Rooms button click
  if (myRoomsBtn) {
    myRoomsBtn.addEventListener("click", () => {
      if (currentUser) {
        window.location.href = `/rooms?filter=my&username=${encodeURIComponent(currentUser)}`;
      } else {
        alert("Please log in first");
        openLoginModal();
      }
    });
  }

  // Close modal
  if (closeLoginModal) {
    closeLoginModal.addEventListener("click", closeLogin);
  }
  window.addEventListener("click", (event) => {
    if (loginModal && event.target === loginModal) {
      closeLogin();
    }
  });

  // Login form submit
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", async () => {
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
  }

  // Create account form submit
  const createAccountSubmitBtn = document.getElementById("createAccountSubmitBtn");
  if (createAccountSubmitBtn) {
    createAccountSubmitBtn.addEventListener("click", async () => {
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
  }
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (initDOM()) {
      setupEventListeners();
      updateAuthUI();
      loadGenres();
    }
  });
} else {
  // DOM is already ready
  if (initDOM()) {
    setupEventListeners();
    updateAuthUI();
    loadGenres();
  }
}
