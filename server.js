const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 3070;

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // { roomId: { players: {X: socketId, O: socketId}, choices: {}, result: null } }

function createRoomObject(roomId) {
  return {
    players: { P1: null, P2: null, names: {} },
    choices: {}, // socketId -> "rock"/"paper"/"scissors"
    result: null,
  };
}

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoom", ({ room, playerName }) => {
    if (!rooms[room]) rooms[room] = createRoomObject(room);
    const r = rooms[room];

    socket.join(room);

    if (!r.players.P1) {
      r.players.P1 = socket.id;
      r.players.names[socket.id] = playerName || "Player 1";
    } else if (!r.players.P2) {
      r.players.P2 = socket.id;
      r.players.names[socket.id] = playerName || "Player 2";
    } else {
      r.players.names[socket.id] = playerName || "Spectator";
    }

    io.in(room).emit("roomState", {
      players: r.players.names,
      result: r.result,
    });
  });

  socket.on("makeChoice", ({ room, choice }) => {
    const r = rooms[room];
    if (!r) return;

    r.choices[socket.id] = choice;
    console.log(`${r.players.names[socket.id]} chọn ${choice}`);
    socket.emit("choiceConfirmed", choice);
    for (const pid of [r.players.P1, r.players.P2]) {
        if (pid && pid !== socket.id) {
            io.to(pid).emit("opponentChosen");
    }
  }
    if (Object.keys(r.choices).length >= 2) {
      // cả 2 đã chọn -> tính kết quả
      const [p1Id, p2Id] = [r.players.P1, r.players.P2];
      const c1 = r.choices[p1Id];
      const c2 = r.choices[p2Id];

      let winner = "draw";
      if (
        (c1 === "rock" && c2 === "scissors") ||
        (c1 === "paper" && c2 === "rock") ||
        (c1 === "scissors" && c2 === "paper")
      ) {
        winner = p1Id;
      } else if (
        (c2 === "rock" && c1 === "scissors") ||
        (c2 === "paper" && c1 === "rock") ||
        (c2 === "scissors" && c1 === "paper")
      ) {
        winner = p2Id;
      }

      r.result = {
        p1: c1,
        p2: c2,
        winner,
        name:
          winner === "draw"
            ? "Hòa!"
            : r.players.names[winner] + " thắng 🎉",
      };
      io.in(room).emit("roundResult", r.result);

      // reset choices cho ván sau
      r.choices = {};
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (const [roomId, r] of Object.entries(rooms)) {
      if (r.players.P1 === socket.id) r.players.P1 = null;
      if (r.players.P2 === socket.id) r.players.P2 = null;
      delete r.players.names[socket.id];
      io.in(roomId).emit("roomState", { players: r.players.names });
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
