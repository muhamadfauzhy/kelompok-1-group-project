const {
  MIN_PLAYERS,
  MAX_MESSAGES,
  ROLE,
  PHASE,
  STATUS,
  PHASE_DURATION_MS,
  CHAT_ENABLED_PHASES,
  NIGHT_ROLES,
} = require("../config");

function createGameEngine({ io, roomStore, narrator }) {
  function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeRoomCode(roomCode) {
    return String(roomCode || "").trim().toUpperCase();
  }

  function randomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let index = 0; index < 5; index += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
  }

  function createRoomCode() {
    let code = randomCode();
    while (roomStore.has(code)) {
      code = randomCode();
    }
    return code;
  }

  function createPlayer(socket, username) {
    return {
      id: socket.id,
      username,
      role: null,
      alive: true,
      connected: true,
    };
  }

  function buildRoom(socket, username) {
    return {
      code: createRoomCode(),
      hostId: socket.id,
      status: STATUS.LOBBY,
      phase: PHASE.LOBBY,
      round: 0,
      narration: "The room is open. Gather the village and prepare for the first night.",
      phaseEndsAt: null,
      phaseTimer: null,
      players: [createPlayer(socket, username)],
      messages: [],
      votes: {},
      voteTally: {},
      nightActions: {},
      privateNotes: {},
    };
  }

  function attachSocketToRoom(socket, room, username) {
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.username = username;
  }

  function getRoomFromSocket(socket) {
    return roomStore.get(socket.data.roomCode);
  }

  function getRoomByCode(roomCode) {
    return roomStore.get(roomCode);
  }

  function getPlayer(room, playerId) {
    return room.players.find((player) => player.id === playerId) || null;
  }

  function getAlivePlayers(room) {
    return room.players.filter((player) => player.alive);
  }

  function getConnectedPlayers(room) {
    return room.players.filter((player) => player.connected);
  }

  function countAliveByRole(room) {
    const alivePlayers = getAlivePlayers(room);
    return {
      werewolf: alivePlayers.filter((player) => player.role === ROLE.WEREWOLF).length,
      villagers: alivePlayers.filter((player) => player.role !== ROLE.WEREWOLF).length,
    };
  }

  function isNightActor(player) {
    return player.alive && NIGHT_ROLES.has(player.role);
  }

  function clearRoomTimer(room) {
    if (!room.phaseTimer) {
      return;
    }

    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }

  function cleanupRoom(roomCode) {
    const room = getRoomByCode(roomCode);
    if (!room) {
      return;
    }

    if (getConnectedPlayers(room).length > 0) {
      return;
    }

    clearRoomTimer(room);
    roomStore.remove(roomCode);
  }

  function emitError(socket, message) {
    socket.emit("room:error", message);
  }

  function pushMessage(room, message) {
    room.messages.push(message);
    if (room.messages.length > MAX_MESSAGES) {
      room.messages.shift();
    }
  }

  function pushPlayerMessage(room, from, text) {
    pushMessage(room, {
      id: makeId(),
      from,
      text,
      tone: "player",
      createdAt: new Date().toISOString(),
    });
  }

  async function addNarratorMessage(room, eventName, details, fallbackText, tone = "narrator") {
    const narration = await narrator.generate(room, eventName, details, fallbackText);
    pushMessage(room, {
      id: makeId(),
      from: "Gemini Narrator",
      text: narration,
      tone,
      createdAt: new Date().toISOString(),
    });
    room.narration = narration;
  }

  function toPublicPlayer(room, currentPlayerId, player) {
    return {
      id: player.id,
      username: player.username,
      alive: player.alive,
      connected: player.connected,
      isHost: player.id === room.hostId,
      role: room.status === STATUS.ENDED || player.id === currentPlayerId ? player.role : null,
    };
  }

  function roomStateFor(room, currentPlayerId) {
    const me = getPlayer(room, currentPlayerId);

    return {
      code: room.code,
      status: room.status,
      phase: room.phase,
      round: room.round,
      hostId: room.hostId,
      narration: room.narration,
      phaseEndsAt: room.phaseEndsAt,
      messages: room.messages,
      players: room.players.map((player) => toPublicPlayer(room, currentPlayerId, player)),
      aliveCount: getAlivePlayers(room).length,
      me: me
        ? {
            id: me.id,
            username: me.username,
            alive: me.alive,
            role: me.role,
            isHost: me.id === room.hostId,
            nightResult: room.privateNotes[me.id] || "",
          }
        : null,
      voteTally: room.voteTally,
      myVoteTargetId: room.votes[currentPlayerId] || null,
      myNightChoice:
        room.phase === PHASE.NIGHT ? room.nightActions[currentPlayerId] || null : null,
    };
  }

  function emitRoomState(room) {
    room.players.forEach((player) => {
      io.to(player.id).emit("room:state", roomStateFor(room, player.id));
    });
  }

  function emitRoomSummary(room) {
    io.to(room.code).emit("room:summary", {
      code: room.code,
      status: room.status,
      phase: room.phase,
      round: room.round,
      playerCount: room.players.length,
      aliveCount: getAlivePlayers(room).length,
      narration: room.narration,
      phaseEndsAt: room.phaseEndsAt,
    });
  }

  function resetVotes(room) {
    room.votes = {};
    room.voteTally = {};
  }

  function tallyVotes(room) {
    const tally = {};
    Object.values(room.votes).forEach((targetId) => {
      tally[targetId] = (tally[targetId] || 0) + 1;
    });
    room.voteTally = tally;
  }

  function shuffle(items) {
    const clone = [...items];

    for (let index = clone.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
    }

    return clone;
  }

  function assignRoles(room) {
    const players = shuffle(room.players);
    const roles = [ROLE.WEREWOLF, ROLE.SEER];

    while (roles.length < players.length) {
      roles.push(ROLE.VILLAGER);
    }

    players.forEach((player, index) => {
      player.role = roles[index];
      player.alive = true;
    });
  }

  function setPrivateNote(room, playerId, note) {
    room.privateNotes[playerId] = note;
    io.to(playerId).emit("private:note", note);
  }

  async function setPhase(room, phase, narrationConfig = null) {
    clearRoomTimer(room);
    room.phase = phase;

    const durationMs = PHASE_DURATION_MS[phase] || null;
    room.phaseEndsAt = durationMs ? Date.now() + durationMs : null;

    if (narrationConfig) {
      await addNarratorMessage(
        room,
        narrationConfig.eventName,
        narrationConfig.details,
        narrationConfig.fallbackText,
        narrationConfig.tone
      );
    }

    emitRoomSummary(room);
    emitRoomState(room);

    if (!durationMs) {
      return;
    }

    room.phaseTimer = setTimeout(() => {
      handlePhaseTimeout(room.code);
    }, durationMs);
  }

  function determineWinner(room) {
    const aliveCounts = countAliveByRole(room);

    if (aliveCounts.werewolf === 0) {
      return "villagers";
    }

    if (aliveCounts.werewolf >= aliveCounts.villagers) {
      return "werewolf";
    }

    return null;
  }

  async function endGame(room, winner) {
    clearRoomTimer(room);
    room.status = STATUS.ENDED;
    room.phase = PHASE.ENDED;
    room.phaseEndsAt = null;

    const fallbackText =
      winner === "villagers"
        ? "The village erupts in relief. The werewolf has fallen, and the town survives the nightmare."
        : "Fear wins tonight. The werewolf now outnumbers the village and claims the town.";

    await addNarratorMessage(
      room,
      "game_end",
      {
        winner,
        roles: room.players.map((player) => ({
          username: player.username,
          role: player.role,
          alive: player.alive,
        })),
      },
      fallbackText,
      winner === "villagers" ? "success" : "danger"
    );

    emitRoomSummary(room);
    emitRoomState(room);
  }

  async function maybeEndGame(room) {
    const winner = determineWinner(room);
    if (!winner) {
      return false;
    }

    await endGame(room, winner);
    return true;
  }

  function getRolePlayer(room, role) {
    return room.players.find((player) => player.alive && player.role === role) || null;
  }

  async function moveToDiscussion(room, killedPlayer) {
    await setPhase(room, PHASE.DISCUSSION, {
      eventName: "discussion_start",
      details: {
        round: room.round,
        killedPlayer: killedPlayer ? killedPlayer.username : null,
        durationSeconds: 180,
      },
      fallbackText: killedPlayer
        ? `${killedPlayer.username} was found lifeless at sunrise. The village must talk before fear chooses another victim.`
        : "Sunrise breaks with no body in sight. Suspicion still hangs over every face in the village.",
      tone: killedPlayer ? "danger" : "info",
    });
  }

  async function moveToVoting(room) {
    await setPhase(room, PHASE.VOTING, {
      eventName: "voting_start",
      details: {
        round: room.round,
        durationSeconds: Math.floor(PHASE_DURATION_MS[PHASE.VOTING] / 1000),
      },
      fallbackText:
        "The discussion ends. The village must vote now, before uncertainty becomes another night of terror.",
      tone: "info",
    });
  }

  async function moveToNight(room, eliminatedPlayer) {
    room.round += 1;

    await setPhase(room, PHASE.NIGHT, {
      eventName: "night_start",
      details: {
        round: room.round,
        eliminatedPlayer: eliminatedPlayer ? eliminatedPlayer.username : null,
      },
      fallbackText: eliminatedPlayer
        ? `${eliminatedPlayer.username} was cast out by the village. Night falls again, and hidden intentions return.`
        : "The village could not decide who to banish. Night returns with doubt left unresolved.",
      tone: "info",
    });
  }

  async function resolveNight(room) {
    const werewolf = getRolePlayer(room, ROLE.WEREWOLF);
    const seer = getRolePlayer(room, ROLE.SEER);
    const killedPlayer = werewolf ? getPlayer(room, room.nightActions[werewolf.id]) : null;
    const inspectedPlayer = seer ? getPlayer(room, room.nightActions[seer.id]) : null;

    room.privateNotes = {};

    if (seer && inspectedPlayer) {
      setPrivateNote(
        room,
        seer.id,
        `${inspectedPlayer.username} is ${
          inspectedPlayer.role === ROLE.WEREWOLF ? "the Werewolf" : "not the Werewolf"
        }.`
      );
    }

    if (killedPlayer?.alive) {
      killedPlayer.alive = false;
    }

    room.nightActions = {};

    if (await maybeEndGame(room)) {
      return;
    }

    await moveToDiscussion(room, killedPlayer || null);
  }

  function findVoteResult(room) {
    tallyVotes(room);
    const sortedVotes = Object.entries(room.voteTally).sort((a, b) => b[1] - a[1]);

    if (sortedVotes.length === 0) {
      return null;
    }

    const highestVoteCount = sortedVotes[0][1];
    const leaders = sortedVotes.filter(([, total]) => total === highestVoteCount);
    if (leaders.length !== 1) {
      return null;
    }

    return getPlayer(room, leaders[0][0]);
  }

  async function resolveVoting(room) {
    const eliminatedPlayer = findVoteResult(room);
    if (eliminatedPlayer) {
      eliminatedPlayer.alive = false;
    }

    resetVotes(room);

    if (await maybeEndGame(room)) {
      return;
    }

    await moveToNight(room, eliminatedPlayer || null);
  }

  function allNightActorsActed(room) {
    return room.players.filter(isNightActor).every((player) => room.nightActions[player.id]);
  }

  async function handlePhaseTimeout(roomCode) {
    const room = getRoomByCode(roomCode);
    if (!room || room.status !== STATUS.PLAYING) {
      return;
    }

    if (room.phase === PHASE.NIGHT) {
      await resolveNight(room);
      return;
    }

    if (room.phase === PHASE.DISCUSSION) {
      await moveToVoting(room);
      return;
    }

    if (room.phase === PHASE.VOTING) {
      await resolveVoting(room);
    }
  }

  async function openRoomForHost(socket, username) {
    const room = buildRoom(socket, username);
    roomStore.set(room.code, room);
    attachSocketToRoom(socket, room, username);

    await addNarratorMessage(
      room,
      "room_created",
      { username, roomCode: room.code },
      `${username} has opened room ${room.code}. The village lanterns flicker as players gather.`,
      "info"
    );

    emitRoomSummary(room);
    emitRoomState(room);
  }

  async function joinExistingRoom(socket, username, roomCode) {
    const room = getRoomByCode(roomCode);
    if (!room) {
      emitError(socket, "Room code tidak ditemukan.");
      return;
    }

    if (room.status !== STATUS.LOBBY) {
      emitError(socket, "Game sudah dimulai. Join hanya bisa saat lobby.");
      return;
    }

    const duplicateName = room.players.some(
      (player) => player.connected && player.username.toLowerCase() === username.toLowerCase()
    );
    if (duplicateName) {
      emitError(socket, "Username sudah dipakai di room ini.");
      return;
    }

    room.players.push(createPlayer(socket, username));
    attachSocketToRoom(socket, room, username);

    await addNarratorMessage(
      room,
      "player_joined",
      { username, roomCode },
      `${username} steps into the village. Another witness joins the coming hunt.`,
      "info"
    );

    emitRoomSummary(room);
    emitRoomState(room);
  }

  async function startGame(room) {
    assignRoles(room);
    room.status = STATUS.PLAYING;
    room.round = 1;
    room.privateNotes = {};
    room.nightActions = {};
    resetVotes(room);

    await setPhase(room, PHASE.NIGHT, {
      eventName: "game_start",
      details: {
        round: room.round,
        players: room.players.map((player) => player.username),
        roles: room.players.map((player) => ({
          username: player.username,
          role: player.role,
        })),
      },
      fallbackText:
        "Night descends on the village. The seer opens their sight, and the werewolf chooses in silence.",
      tone: "info",
    });
  }

  function removePlayer(room, playerId) {
    const player = getPlayer(room, playerId);
    if (!player) {
      return;
    }

    player.connected = false;

    if (room.hostId === player.id) {
      room.hostId = getConnectedPlayers(room).find((entry) => entry.id !== player.id)?.id || null;
    }
  }

  function canPlayerChat(room, player) {
    if (!player) {
      return false;
    }

    if (!CHAT_ENABLED_PHASES.has(room.phase)) {
      return false;
    }

    if (!player.alive && room.phase !== PHASE.ENDED) {
      return false;
    }

    return true;
  }

  function validateNightAction(actor, target) {
    if (!actor || !target || !actor.alive || !target.alive) {
      return "Aksi malam tidak valid.";
    }

    if (actor.role === ROLE.VILLAGER) {
      return "Villager tidak punya aksi malam.";
    }

    if (actor.id === target.id) {
      if (actor.role === ROLE.WEREWOLF) {
        return "Werewolf tidak bisa memilih dirinya sendiri.";
      }

      if (actor.role === ROLE.SEER) {
        return "Seer tidak bisa memeriksa dirinya sendiri.";
      }
    }

    return null;
  }

  function submitNightAction(room, actor, target) {
    room.nightActions[actor.id] = target.id;
    emitRoomSummary(room);
    emitRoomState(room);
  }

  function submitVote(room, voter, target) {
    room.votes[voter.id] = target.id;
    tallyVotes(room);
    emitRoomSummary(room);
    emitRoomState(room);
  }

  return {
    ROLE,
    PHASE,
    STATUS,
    MIN_PLAYERS,
    normalizeRoomCode,
    getRoomFromSocket,
    getRoomByCode,
    getPlayer,
    getAlivePlayers,
    getConnectedPlayers,
    cleanupRoom,
    emitError,
    pushPlayerMessage,
    emitRoomState,
    emitRoomSummary,
    openRoomForHost,
    joinExistingRoom,
    startGame,
    removePlayer,
    canPlayerChat,
    validateNightAction,
    submitNightAction,
    allNightActorsActed,
    resolveNight,
    submitVote,
    resolveVoting,
  };
}

module.exports = {
  createGameEngine,
};
