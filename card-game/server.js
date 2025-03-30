import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid"; // Generates a unique lobby code

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust if frontend runs elsewhere
    methods: ["GET", "POST"],
  },
});

app.use(cors()); // Allow frontend to connect

let playersInLobbies = {}; // Stores players in each lobby

app.get("/", (req, res) => {
  res.send("Server is running!");
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a user creates a lobby
  socket.on("create_lobby", (playerName) => {
    const lobbyCode = uuidv4().slice(0, 4); // Generate a 4-character lobby code
    console.log(`${playerName} is creating a lobby with code: ${lobbyCode}`);

    // Ensure lobby is created
    playersInLobbies[lobbyCode] = [{ name: playerName, id: socket.id }];

    // Join the creator to the lobby room
    socket.join(lobbyCode);

    // Emit the lobby code to the creator
    socket.emit("lobby_code", lobbyCode);

    // Emit updated player list
    io.to(lobbyCode).emit("lobby_update", playersInLobbies[lobbyCode]);

    console.log(`Lobby created: ${lobbyCode} by ${playerName}`);
  });

  // When a player joins a lobby
  socket.on("join_lobby", (lobbyCode, playerName) => {
    console.log(`${playerName} is attempting to join lobby: ${lobbyCode}`);

    if (playersInLobbies[lobbyCode]) {
      // Add the player to the lobby
      playersInLobbies[lobbyCode].push({ name: playerName, id: socket.id });

      // Join the socket to the room
      socket.join(lobbyCode);

      // Emit updated player list to everyone in the lobby
      io.to(lobbyCode).emit("lobby_update", playersInLobbies[lobbyCode]);

      console.log(`${playerName} joined lobby: ${lobbyCode}`);
    } else {
      socket.emit("error_message", "Lobby not found!");
    }
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove player from any lobby they were in
    for (const [lobbyCode, players] of Object.entries(playersInLobbies)) {
      const index = players.findIndex((player) => player.id === socket.id);
      if (index !== -1) {
        console.log(`Removing ${players[index].name} from lobby: ${lobbyCode}`);
        players.splice(index, 1);

        // Update lobby for remaining players
        io.to(lobbyCode).emit("lobby_update", players);

        // If lobby is empty, delete it and notify remaining players
        if (players.length === 0) {
          delete playersInLobbies[lobbyCode];
          console.log(`Lobby ${lobbyCode} deleted as it is empty.`);

          // Notify remaining players that the lobby has been closed
          io.to(lobbyCode).emit("lobby_closed", "The lobby has been closed because the last player left.");
        }

        break;
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
