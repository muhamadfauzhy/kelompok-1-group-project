function getSocketUsername(socket) {
  return socket.handshake.auth.username?.trim() || "";
}

function registerSocketHandlers({ io, roomStore, gameEngine }) {
  function requireUsername(socket) {
    const username = getSocketUsername(socket);
    if (!username) {
      gameEngine.emitError(socket, "Username wajib diisi.");
      return null;
    }
    return username;
  }

  function requireRoom(socket) {
    return gameEngine.getRoomFromSocket(socket);
  }

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (${getSocketUsername(socket) || "unknown"})`);

    socket.on("room:create", async () => {
      const username = requireUsername(socket);
      if (!username) {
        return;
      }

      await gameEngine.openRoomForHost(socket, username);
    });

    socket.on("room:join", async (roomCode) => {
      const username = requireUsername(socket);
      if (!username) {
        return;
      }

      await gameEngine.joinExistingRoom(
        socket,
        username,
        gameEngine.normalizeRoomCode(roomCode)
      );
    });

    socket.on("game:start", async () => {
      const room = requireRoom(socket);
      if (!room) {
        return;
      }

      if (room.hostId !== socket.id) {
        gameEngine.emitError(socket, "Hanya host yang bisa memulai game.");
        return;
      }

      if (room.status !== gameEngine.STATUS.LOBBY) {
        gameEngine.emitError(socket, "Game sudah dimulai.");
        return;
      }

      if (gameEngine.getConnectedPlayers(room).length < gameEngine.MIN_PLAYERS) {
        gameEngine.emitError(
          socket,
          `Minimal ${gameEngine.MIN_PLAYERS} pemain untuk memulai game.`
        );
        return;
      }

      await gameEngine.startGame(room);
    });

    socket.on("chat:send", (text) => {
      const room = requireRoom(socket);
      if (!room) {
        return;
      }

      const player = gameEngine.getPlayer(room, socket.id);
      const cleanText = String(text || "").trim();
      if (!cleanText) {
        return;
      }

      if (!gameEngine.canPlayerChat(room, player)) {
        gameEngine.emitError(
          socket,
          "Chat hanya tersedia saat lobby, diskusi siang, atau akhir game."
        );
        return;
      }

      gameEngine.pushPlayerMessage(room, player.username, cleanText);
      gameEngine.emitRoomSummary(room);
      gameEngine.emitRoomState(room);
    });

    socket.on("night:action", async (targetId) => {
      const room = requireRoom(socket);
      if (
        !room ||
        room.status !== gameEngine.STATUS.PLAYING ||
        room.phase !== gameEngine.PHASE.NIGHT
      ) {
        return;
      }

      const actor = gameEngine.getPlayer(room, socket.id);
      const target = gameEngine.getPlayer(room, targetId);
      const validationError = gameEngine.validateNightAction(actor, target);
      if (validationError) {
        gameEngine.emitError(socket, validationError);
        return;
      }

      gameEngine.submitNightAction(room, actor, target);

      if (gameEngine.allNightActorsActed(room)) {
        await gameEngine.resolveNight(room);
      }
    });

    socket.on("vote", async ({ targetId } = {}) => {
      const room = requireRoom(socket);
      if (
        !room ||
        room.status !== gameEngine.STATUS.PLAYING ||
        room.phase !== gameEngine.PHASE.VOTING
      ) {
        return;
      }

      const voter = gameEngine.getPlayer(room, socket.id);
      const target = gameEngine.getPlayer(room, targetId);
      if (!voter || !target || !voter.alive || !target.alive) {
        return;
      }

      gameEngine.submitVote(room, voter, target);

      const everyoneVoted = gameEngine
        .getAlivePlayers(room)
        .every((player) => room.votes[player.id]);

      if (everyoneVoted) {
        await gameEngine.resolveVoting(room);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);

      const room = requireRoom(socket);
      if (!room) {
        return;
      }

      gameEngine.removePlayer(room, socket.id);
      gameEngine.emitRoomSummary(room);
      gameEngine.emitRoomState(room);
      gameEngine.cleanupRoom(room.code);
    });
  });
}

module.exports = {
  registerSocketHandlers,
};
