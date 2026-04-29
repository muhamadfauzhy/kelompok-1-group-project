import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMusicContext } from "../contexts/MusicContext";
import { socket } from "../socket/socket";

function useCountdown(phaseEndsAt) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    phaseEndsAt ? Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (!phaseEndsAt) {
      return undefined;
    }

    function tick() {
      setSecondsLeft(Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  return secondsLeft;
}

function toneClass(tone) {
  if (tone === "danger") {
    return "feed-entry feed-danger";
  }

  if (tone === "success") {
    return "feed-entry feed-success";
  }

  if (tone === "info") {
    return "feed-entry feed-info";
  }

  return "feed-entry";
}

function getPhaseLabel(phase) {
  const labels = {
    lobby: "LOBBY",
    night: "NIGHT",
    discussion: "DAY",
    voting: "DAY",
    day: "DAY",
    ended: "ENDED",
  };

  return labels[phase] || phase || "-";
}

function getStatusLabel(status) {
  const labels = {
    lobby: "Lobby",
    playing: "Playing",
    ended: "Ended",
  };

  return labels[status] || status || "-";
}

function getRoleLabel(role) {
  const labels = {
    villager: "Villager",
    seer: "Seer",
    werewolf: "Werewolf",
  };

  return labels[role] || "Hidden";
}

export default function GamePage() {
  const navigate = useNavigate();
  const { setPhaseMusic } = useMusicContext();
  const [room, setRoom] = useState(null);
  const [roomSummary, setRoomSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const usernameRef = useRef(sessionStorage.getItem("username") || "");
  const roomCodeRef = useRef(sessionStorage.getItem("roomCode") || "");
  const roomActionRef = useRef(sessionStorage.getItem("roomAction") || "");
  const hasRequestedRef = useRef(false);
  const lobbyFeedRef = useRef(null);
  const gameFeedRef = useRef(null);

  const countdown = useCountdown(room?.phaseEndsAt ?? null);
  const alivePlayers = room?.players?.filter((player) => player.alive) || [];

  useEffect(() => {
    if (!usernameRef.current.trim()) {
      navigate("/");
      return undefined;
    }

    function handleConnect() {
      if (hasRequestedRef.current) {
        return;
      }

      hasRequestedRef.current = true;

      if (roomActionRef.current === "create") {
        socket.emit("room:create");
      }

      if (roomActionRef.current === "join") {
        socket.emit("room:join", roomCodeRef.current);
      }
    }

    function handleRoomState(nextRoom) {
      setRoom(nextRoom);
      setError("");
      if (nextRoom?.code) {
        sessionStorage.setItem("roomCode", nextRoom.code);
        roomCodeRef.current = nextRoom.code;
      }
    }

    function handleRoomSummary(nextSummary) {
      setRoomSummary(nextSummary);
    }

    function handleRoomError(nextError) {
      setError(nextError);
    }

    function handlePrivateNote(note) {
      setPrivateNote(note);
    }

    function handleConnectError(connectError) {
      setError(
        `Gagal terhubung ke server socket (${connectError.message || "unknown error"}). Pastikan server berjalan di port 3001.`
      );
    }

    socket.auth = { username: usernameRef.current };
    socket.connect();

    socket.on("connect", handleConnect);
    socket.on("room:state", handleRoomState);
    socket.on("room:summary", handleRoomSummary);
    socket.on("room:error", handleRoomError);
    socket.on("private:note", handlePrivateNote);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("room:state", handleRoomState);
      socket.off("room:summary", handleRoomSummary);
      socket.off("room:error", handleRoomError);
      socket.off("private:note", handlePrivateNote);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    setPhaseMusic(room?.phase || "lobby");
  }, [room?.phase, setPhaseMusic]);

  useEffect(() => {
    const activeFeed = room?.status === "lobby" ? lobbyFeedRef.current : gameFeedRef.current;
    if (!activeFeed) {
      return;
    }

    activeFeed.scrollTop = activeFeed.scrollHeight;
  }, [room?.messages, room?.status]);

  function leaveGame() {
    socket.disconnect();
    sessionStorage.removeItem("roomCode");
    sessionStorage.removeItem("roomAction");
    hasRequestedRef.current = false;
    setRoom(null);
    setRoomSummary(null);
    setPrivateNote("");
    setError("");
    navigate("/");
  }

  function submitChat(event) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    socket.emit("chat:send", message);
    setMessage("");
  }

  function handleChatKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!message.trim()) {
        return;
      }

      socket.emit("chat:send", message);
      setMessage("");
    }
  }

  function handleStartGame() {
    socket.emit("game:start");
  }

  function handleNightTarget(targetId) {
    socket.emit("night:action", targetId);
  }

  function handleVoteTarget(targetId) {
    socket.emit("vote", { targetId });
  }

  if (!room) {
    return (
      <main className="screen-shell">
        <section className="connecting-card">
          <div className="eyebrow">Connecting</div>
          <h1>Preparing Room</h1>
          <p className="muted-text">
            {error || "Connecting to the werewolf server and waiting for room state."}
          </p>
        </section>
      </main>
    );
  }

  const canStart = room.me?.isHost && room.status === "lobby" && room.players.length >= 4;
  const canChat = room.phase === "lobby" || room.phase === "discussion" || room.phase === "ended";
  const isAlive = room.me?.alive;
  const myRole = room.me?.role;
  const isNightRole = room.me?.role === "werewolf" || room.me?.role === "seer";
  const nightTargets = alivePlayers.filter((player) => player.id !== room.me?.id);
  const isVotingPhase = room.phase === "voting";
  const canShowNightChoices = room.phase === "night" && isAlive && isNightRole;
  const canShowVotingChoices = isVotingPhase && isAlive;
  const boardGridClassName =
    myRole === "villager" || (!canShowNightChoices && !canShowVotingChoices)
      ? "board-grid board-grid-feed-wide"
      : "board-grid";

  let actionTitle = "Village Status";
  let actionLabel = "Wait for the next important moment in the round.";
  let actionContent = <p className="muted-text">No action is needed right now.</p>;

  if (canShowVotingChoices) {
    actionTitle = "Voting";
    actionLabel = "Public judgment decides who leaves before night returns.";
    actionContent = (
      <div className="action-stack">
        {alivePlayers
          .filter((player) => player.id !== room.me?.id)
          .map((player) => (
            <button
              key={player.id}
              className={room.myVoteTargetId === player.id ? "target-btn selected" : "target-btn"}
              onClick={() => handleVoteTarget(player.id)}
            >
              <span className="target-avatar">{player.username[0]?.toUpperCase()}</span>
              <span>{player.username}</span>
              <span className="vote-count">{room.voteTally?.[player.id] || 0} votes</span>
            </button>
          ))}
      </div>
    );
  } else if (canShowNightChoices) {
    actionTitle = myRole === "seer" ? "Seer Action" : "Werewolf Action";
    actionLabel =
      myRole === "seer"
        ? "Choose one player to inspect before sunrise."
        : "Choose quietly who the pack will attack tonight.";
    actionContent = (
      <div className="action-stack">
        {nightTargets.map((player) => (
          <button
            key={player.id}
            className={room.myNightChoice === player.id ? "target-btn selected" : "target-btn"}
            onClick={() => handleNightTarget(player.id)}
          >
            <span className="target-avatar">{player.username[0]?.toUpperCase()}</span>
            <span>{player.username}</span>
            <span className="target-meta">{myRole === "seer" ? "Inspect" : "Attack"}</span>
          </button>
        ))}
      </div>
    );
  } else if (!isAlive) {
    actionTitle = "Observer";
    actionLabel = "You have been eliminated from the round.";
    actionContent = <p className="muted-text">You can still follow the discussion, but you cannot act.</p>;
  } else if (room.phase === "night") {
    actionTitle = "Night Falls";
    actionLabel = "Villagers sleep while special roles act in secret.";
    actionContent = <p className="muted-text">No night action is available for your role.</p>;
  } else if (room.phase === "discussion") {
    actionTitle = "Discussion";
    actionLabel = "Use the village feed to share suspicions and read the room.";
    actionContent = <p className="muted-text">There is no separate action here. Focus on the conversation.</p>;
  } else if (room.phase === "ended") {
    actionTitle = "Game Ended";
    actionLabel = "The round is over.";
    actionContent = <p className="muted-text">Review the final discussion or leave the room when you are ready.</p>;
  }

  if (room.status === "lobby") {
    return (
      <main className="screen-shell">
        <section className="waiting-layout">
          <div className="waiting-main">
            <article className="waiting-card waiting-hero">
              <div className="eyebrow">Waiting Room</div>
              <h1>Gather The Village</h1>
              <div className="waiting-code">{room.code}</div>
              <p className="muted-text">Share this code so the rest of the players can enter the room.</p>

              <div className="waiting-meta">
                <span className="meta-pill">{room.players.length} players</span>
                <span className="meta-pill">{room.me?.isHost ? "You are host" : "Waiting for host"}</span>
              </div>

              <div className="waiting-actions">
                {canStart ? (
                  <button className="btn-primary" onClick={handleStartGame}>
                    Start Game
                  </button>
                ) : (
                  <div className="waiting-hint">
                    {room.me?.isHost
                      ? "Need at least 4 players before the match can begin."
                      : "The host will start the match when everyone is ready."}
                  </div>
                )}

                <button className="btn-ghost" onClick={leaveGame}>
                  Leave Room
                </button>
              </div>
            </article>

            <article className="waiting-card">
              <div className="section-title">Players</div>
              <div className="player-grid">
                {room.players.map((player) => (
                  <div key={player.id} className={player.id === room.me?.id ? "player-chip me" : "player-chip"}>
                    <span className="player-avatar">{player.username[0]?.toUpperCase()}</span>
                    <div className="player-chip-copy">
                      <strong>{player.username}</strong>
                      <small>{player.isHost ? "Room host" : "Villager"}</small>
                    </div>
                    {player.isHost ? <span className="badge-host">Host</span> : null}
                    {player.id === room.me?.id ? <span className="badge-me">You</span> : null}
                  </div>
                ))}
              </div>
            </article>

            <article className="waiting-card">
              <div className="section-title">Roles In This Match</div>
              <div className="role-preview">
                <span className="role-chip role-werewolf">Werewolf</span>
                <span className="role-chip role-seer">Seer</span>
                {room.players.length > 2
                  ? Array.from({ length: Math.max(1, room.players.length - 2) }).map((_, index) => (
                      <span key={index} className="role-chip role-villager">
                        Villager
                      </span>
                    ))
                  : null}
              </div>
            </article>
          </div>

          <aside className="waiting-sidebar">
            <article className="waiting-card chat-card">
            <div className="section-title">Lobby Chat</div>
            <div className="feed-list" ref={lobbyFeedRef}>
              {room.messages.length === 0 ? (
                <p className="chat-empty">No messages yet. Say hello to the village.</p>
              ) : (
                room.messages.map((entry) => (
                  <article
                    key={entry.id}
                    className={entry.from === "Gemini Narrator" ? toneClass(entry.tone) : "feed-entry"}
                  >
                    <strong>{entry.from}</strong>
                    <p>{entry.text}</p>
                  </article>
                ))
              )}
            </div>

            <form className="chat-input-row" onSubmit={submitChat}>
              <textarea
                className="chat-input"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Chat with the room before the game starts..."
                disabled={!canChat}
              />
              <button className="btn-primary chat-send" type="submit" disabled={!canChat}>
                Send
              </button>
            </form>
            </article>
          </aside>

          {error ? <div className="error-banner">{error}</div> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="screen-shell">
      <section className="game-layout">
        <div className="status-strip">
          <div className="status-group">
            <span className="phase-badge">{getPhaseLabel(room.phase)}</span>
            <span className="my-role-badge">{getRoleLabel(room.me?.role)}</span>
            <span className="status-pill">{getStatusLabel(room.status)}</span>
            {!isAlive ? <span className="dead-badge">Eliminated</span> : null}
          </div>
          <div className="status-group">
            <span className="timer-chip">{room.phaseEndsAt ? `${countdown}s left` : "No timer"}</span>
            <button className="btn-ghost" onClick={leaveGame}>
              Leave Room
            </button>
          </div>
        </div>

        <article className="story-card">
          <div className="eyebrow">Narration</div>
          <p className="story-copy">{room.narration || "The village waits for the next turn."}</p>
        </article>

        {privateNote || room.me?.nightResult ? (
          <article className="alert-card">
            <div className="section-title">Private Note</div>
            <p className="private-copy">{privateNote || room.me?.nightResult}</p>
          </article>
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}

        <div className={boardGridClassName}>
          <div className="left-column">
            <aside className="player-panel player-panel-large">
              <div className="section-title">Players</div>
              <div className="player-list">
                {room.players.map((player) => (
                  <div
                    key={player.id}
                    className={
                      player.id === room.me?.id
                        ? player.alive
                          ? "player-row me"
                          : "player-row me dead"
                        : player.alive
                          ? "player-row"
                          : "player-row dead"
                    }
                  >
                    <span className="player-avatar-sm">{player.username[0]?.toUpperCase()}</span>
                    <div className="player-row-copy">
                      <strong>{player.username}</strong>
                      <small>
                        {player.id === room.me?.id ? "You" : "Player"}{player.isHost ? " | Host" : ""}
                      </small>
                    </div>
                    {!player.alive ? <span className="dead-icon">X</span> : <span className="alive-pill">Alive</span>}
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="center-column">
            <article className="phase-overview phase-overview-compact">
              <div>
                <div className="eyebrow">Current Phase</div>
                <h1>{getPhaseLabel(room.phase)}</h1>
                <p className="muted-text">
                  Room {room.code} | Round {room.round || 1} | {getStatusLabel(room.status)}
                </p>
              </div>
              <div className="summary-grid summary-grid-inline">
                <div className="stat-card">
                  <span>Alive</span>
                  <strong>{roomSummary?.aliveCount || room.aliveCount || alivePlayers.length}</strong>
                </div>
                <div className="stat-card">
                  <span>Players</span>
                  <strong>{roomSummary?.playerCount || room.players.length}</strong>
                </div>
                <div className="stat-card">
                  <span>Phase</span>
                  <strong>{getPhaseLabel(roomSummary?.phase || room.phase)}</strong>
                </div>
              </div>
            </article>

            <article className="action-card">
              <div className="section-title">{actionTitle}</div>
              <p className="action-label">{actionLabel}</p>
              {actionContent}
            </article>
          </div>

          <div className="secondary-column">
            <aside className="chat-card village-feed-card">
              <div className="section-title">Village Feed</div>
              <div className="feed-list" ref={gameFeedRef}>
                {room.messages.length === 0 ? (
                  <p className="chat-empty">No messages yet. Start the discussion.</p>
                ) : (
                  room.messages.map((entry) => (
                    <article
                      key={entry.id}
                      className={entry.from === "Gemini Narrator" ? toneClass(entry.tone) : "feed-entry"}
                    >
                      <strong>{entry.from}</strong>
                      <p>{entry.text}</p>
                    </article>
                  ))
                )}
              </div>

              <form className="chat-input-row" onSubmit={submitChat}>
                <textarea
                  className="chat-input"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder={
                    canChat
                      ? "Share your suspicions with the village..."
                      : "Chat is disabled outside lobby, discussion, and endgame."
                  }
                  disabled={!canChat || (!isAlive && room.phase !== "ended")}
                />
                <button
                  className="btn-primary chat-send"
                  type="submit"
                  disabled={!canChat || (!isAlive && room.phase !== "ended")}
                >
                  Send
                </button>
              </form>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
