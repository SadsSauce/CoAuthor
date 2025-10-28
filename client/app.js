const roomTableBody = document.querySelector("#roomTable tbody");

async function loadRooms() {
  try {
    const response = await fetch("http://127.0.0.1:8000/rooms");
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
  modal.style.display = "block";
  newRoomInput.value = "";
  newRoomInput.focus();
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});
window.addEventListener("click", (event) => {
  if (event.target == modal) modal.style.display = "none";
});

confirmCreateRoom.addEventListener("click", async () => {
  const roomName = newRoomInput.value.trim();
  if (!roomName) return;

  try {
    const response = await fetch("http://127.0.0.1:8000/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_name: roomName })
    });

    modal.style.display = "none"; 
    loadRooms(); 
  } catch (err) {
    console.error("Failed to create room:", err);
  }
});

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
