const socket = io();

const lobby = document.getElementById("lobby");
const game = document.getElementById("game");
const nameInput = document.getElementById("nameInput");
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const roomTitle = document.getElementById("roomTitle");
const playersDiv = document.getElementById("players");
const resultDiv = document.getElementById("result");

let currentRoom = "";

joinBtn.onclick = () => {
  const name = nameInput.value || "Player";
  const room = roomInput.value || "default";

  socket.emit("joinRoom", { room, playerName: name });
  currentRoom = room;

  lobby.style.display = "none";
  game.style.display = "block";
  roomTitle.innerText = `Phòng: ${room}`;
};

document.querySelectorAll("#choices button").forEach((btn) => {
  btn.addEventListener("click", () => {
    socket.emit("makeChoice", { room: currentRoom, choice: btn.dataset.choice });
  });
});
socket.on("choiceConfirmed", (choice) => {
  resultDiv.innerText = "Bạn đã chọn: " + choice + " (chờ đối thủ...)";
});
socket.on("opponentChosen", () => {
  resultDiv.innerText = "Đối thủ đã chọn, đang chờ...";
});

socket.on("roundResult", (res) => {
  resultDiv.innerText = `P1: ${res.p1} | P2: ${res.p2} → ${res.name}`;
});
