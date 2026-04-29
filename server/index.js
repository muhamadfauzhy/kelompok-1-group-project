require("dotenv").config();

const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { PORT, CLIENT_ORIGINS } = require("./src/config");
const { createRoomStore } = require("./src/store/roomStore");
const { createGeminiNarrator } = require("./src/services/geminiNarrator");
const { createGameEngine } = require("./src/game/gameEngine");
const { registerSocketHandlers } = require("./src/socket/registerSocketHandlers");

const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
  },
});

const roomStore = createRoomStore();
const narrator = createGeminiNarrator();
const gameEngine = createGameEngine({ io, roomStore, narrator });

app.get("/", (req, res) => {
  res.send("Werewolf server is running.");
});

registerSocketHandlers({ io, roomStore, gameEngine });

server.listen(PORT, () => {
  console.log(`Werewolf server listening on port ${PORT}`);
});
