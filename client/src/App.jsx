import { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "./socket/socket";
import "./App.css";

function formatPayload(payload) {
  if (!payload) {
    return "";
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function useCountdown(phaseEndsAt) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!phaseEndsAt) {
      setSecondsLeft(0);
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
    return "feed-card feed-danger";
  }

  if (tone === "success") {
    return "feed-card feed-success";
  }

  if (tone === "info") {
    return "feed-card feed-info";
  }

  return "feed-card";
}

export default function App() {
  const [username, setUsername] = useState(sessionStorage.getItem("username") || "");
  const [roomCode, setRoomCode] = useState(sessionStorage.getItem("roomCode") || "");
  const [screen, setScreen] = useState("entry");
  const [room, setRoom] = useState(null);
  const [roomSummary, setRoomSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [eventLogs, setEventLogs] = useState([]);
  const pendingActionRef = useRef(null);
  const hasRequestedRef = useRef(false);
  const countdown = useCountdown(room?.phaseEndsAt);

  const alivePlayers = useMemo(
    () => room?.players?.filter((player) => player.alive) || [],
    [room]
  );

  function pushEventLog(eventName, payload = null, direction = "in") {
    setEventLogs((current) => {
      const next = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          eventName,
          payload: formatPayload(payload),
          direction,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...current,
      ];

      return next.slice(0, 40);
    });
  }

  useEffect(() => {
    function handleConnect() {
      pushEventLog("connect", { socketId: socket.id }, "in");
      if (hasRequestedRef.current || !pendingActionRef.current) {
        return;
      }

      hasRequestedRef.current = true;
      if (pendingActionRef.current === "create") {
        socket.emit("room:create");
      } else {
        socket.emit("room:join", sessionStorage.getItem("roomCode") || "");
      }
    }

    function handleRoomState(nextRoom) {
      pushEventLog(
        "room:state",
        {
          code: nextRoom?.code,
          phase: nextRoom?.phase,
          status: nextRoom?.status,
          round: nextRoom?.round,
          players: nextRoom?.players?.length,
        },
        "in"
      );
      setRoom(nextRoom);
      setScreen("room");
      setError("");
      if (nextRoom?.code) {
        sessionStorage.setItem("roomCode", nextRoom.code);
        setRoomCode(nextRoom.code);
      }
    }

    function handleRoomSummary(nextSummary) {
      pushEventLog("room:summary", nextSummary, "in");
      setRoomSummary(nextSummary);
    }

    function handleRoomError(nextError) {
      pushEventLog("room:error", { message: nextError }, "in");
      setError(nextError);
    }

    function handlePrivateNote(note) {
      pushEventLog("private:note", { note }, "in");
      setPrivateNote(note);
    }

    function handleConnectError(connectError) {
      pushEventLog("connect_error", { message: connectError.message }, "in");
      setError(
        `Gagal terhubung ke server socket (${connectError.message || "unknown error"}). Pastikan server berjalan di port 3001.`
      );
    }

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
  }, []);

  function beginConnection(action) {
    if (!username.trim()) {
      setError("Username wajib diisi.");
      return;
    }

    if (action === "join" && !roomCode.trim()) {
      setError("Room code wajib diisi untuk join.");
      return;
    }

    const normalizedRoomCode = roomCode.trim().toUpperCase();
    sessionStorage.setItem("username", username.trim());
    sessionStorage.setItem("roomCode", normalizedRoomCode);
    pendingActionRef.current = action;
    hasRequestedRef.current = false;
    setError("");
    setPrivateNote("");
    setRoom(null);
    setRoomSummary(null);
    setScreen("connecting");
    socket.auth = { username: username.trim() };
    socket.connect();
    pushEventLog("socket.connect", { username: username.trim() }, "out");

    if (socket.connected) {
      const eventName = action === "create" ? "room:create" : "room:join";
      const payload = action === "create" ? null : normalizedRoomCode;
      socket.emit(eventName, payload);
      pushEventLog(eventName, payload, "out");
      hasRequestedRef.current = true;
    }
  }

  function leaveRoom() {
    socket.disconnect();
    pendingActionRef.current = null;
    hasRequestedRef.current = false;
    sessionStorage.removeItem("roomCode");
    setRoomCode("");
    setRoom(null);
    setRoomSummary(null);
    setPrivateNote("");
    setError("");
    setScreen("entry");
  }

  function sendChat(event) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    socket.emit("chat:send", message);
    pushEventLog("chat:send", { message }, "out");
    setMessage("");
  }

  function startGame() {
    socket.emit("game:start");
    pushEventLog("game:start", null, "out");
  }

  function chooseNightTarget(targetId) {
    socket.emit("night:action", targetId);
    pushEventLog("night:action", { targetId }, "out");
  }

  function voteTarget(targetId) {
    socket.emit("vote", { targetId });
    pushEventLog("vote", { targetId }, "out");
  }

  const canStart = room?.me?.isHost && room?.status === "lobby" && room?.players.length >= 4;
  const canChat =
    room?.phase === "lobby" || room?.phase === "discussion" || room?.phase === "ended";
  const isAlive = room?.me?.alive;
  const isNightRole = room?.me?.role === "werewolf" || room?.me?.role === "seer";
  const nightTargets = alivePlayers.filter((player) => player.id !== room?.me?.id);

  if (screen !== "room" || !room) {
    return (
      <main className="shell">
        <section className="hero-panel">
          <div className="eyebrow">Realtime Werewolf</div>
          <h1>Gemini Narrated Village</h1>
          <p className="hero-copy">
            Create a room, invite players, and survive the night. The game uses
            Express + Socket.IO and gives Gemini the role of narrator for major
            phase transitions and outcomes.
          </p>
          <div className="feature-grid">
            <article className="feature-card">
              <h2>Role Set</h2>
              <p>Only three roles are used: Villager, Seer, and Werewolf.</p>
            </article>
            <article className="feature-card">
              <h2>Timed Phases</h2>
              <p>Day discussion runs for 1 minute exactly, then the vote opens.</p>
            </article>
            <article className="feature-card">
              <h2>Realtime Rooms</h2>
              <p>Create or join a room code and sync gameplay live for every player.</p>
            </article>
          </div>
        </section>

        <section className="entry-panel">
          <div className="entry-card">
            <div className="eyebrow">Identity</div>
            <h2>Enter The Village</h2>
            <label className="field">
              <span>Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Mis. Jefry"
              />
            </label>
            <div className="entry-actions">
              <button className="primary-btn" onClick={() => beginConnection("create")}>
                Create Room
              </button>
            </div>
          </div>

          <div className="entry-card secondary">
            <div className="eyebrow">Join</div>
            <h2>Already Have A Room?</h2>
            <label className="field">
              <span>Room Code</span>
              <input
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="ABCDE"
              />
            </label>
            <div className="entry-actions">
              <button className="secondary-btn" onClick={() => beginConnection("join")}>
                Join Room
              </button>
            </div>
          </div>

          <div className="status-card">
            <div className="status-label">
              {screen === "connecting" ? "Connecting..." : "Ready"}
            </div>
            <p>
              Minimum 4 players. Host starts the match, roles are randomized, and
              each player gets their private role through socket state.
            </p>
            {error ? <div className="error-banner">{error}</div> : null}
          </div>

          <div className="status-card">
            <div className="eyebrow">Socket Illustration</div>
            <p>
              Panel log ini memperlihatkan event yang dikirim ke server dan event
              realtime yang diterima dari server.
            </p>
            <div className="event-log">
              {eventLogs.length === 0 ? (
                <div className="log-card">Belum ada event.</div>
              ) : (
                eventLogs.slice(0, 6).map((log) => (
                  <article key={log.id} className="log-card compact">
                    <div className="log-head">
                      <strong>{log.eventName}</strong>
                      <span>{log.direction === "out" ? "client -> server" : "server -> client"}</span>
                    </div>
                    <pre>{log.payload || "-"}</pre>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <aside className="sidebar">
        <div className="room-header">
          <div>
            <div className="eyebrow">Room Code</div>
            <div className="room-code">{room.code}</div>
          </div>
          <button className="ghost-btn" onClick={leaveRoom}>
            Leave
          </button>
        </div>

        <div className="role-card">
          <div className="eyebrow">Your Role</div>
          <div className="role-name">{room.me?.role || "Hidden"}</div>
          <div className="role-status">{room.me?.alive ? "Alive" : "Eliminated"}</div>
        </div>

        {privateNote ? (
          <div className="private-card">
            <div className="eyebrow">Private Note</div>
            <p>{privateNote}</p>
          </div>
        ) : room.me?.nightResult ? (
          <div className="private-card">
            <div className="eyebrow">Private Note</div>
            <p>{room.me.nightResult}</p>
          </div>
        ) : null}

        <div className="player-list">
          <div className="eyebrow">Players</div>
          {room.players.map((player) => (
            <article key={player.id} className="player-card">
              <div className="player-top">
                <strong>
                  {player.username}
                  {player.id === room.me?.id ? " (You)" : ""}
                </strong>
                <span className={player.alive ? "alive-pill" : "dead-pill"}>
                  {player.alive ? "Alive" : "Out"}
                </span>
              </div>
              <div className="player-meta">
                {player.isHost ? "Host" : "Player"}
                {room.status === "ended" && player.role ? ` • ${player.role}` : ""}
              </div>
            </article>
          ))}
        </div>
      </aside>

      <section className="main-stage">
        <div className="phase-card">
          <div className="phase-copy">
            <div className="eyebrow">Phase</div>
            <h2>{room.phase}</h2>
            <p>{room.narration}</p>
          </div>
          <div className="phase-side">
            <div className="timer-label">
              {room.phaseEndsAt ? `${countdown}s left` : room.status}
            </div>
            {canStart ? (
              <button className="primary-btn" onClick={startGame}>
                Start Game
              </button>
            ) : null}
          </div>
        </div>

        {error ? <div className="error-banner stage-error">{error}</div> : null}

        <section className="action-card">
          <div className="eyebrow">Socket Summary</div>
          <h3>Server Broadcast Preview</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span>Room</span>
              <strong>{roomSummary?.code || room.code}</strong>
            </div>
            <div className="summary-item">
              <span>Status</span>
              <strong>{roomSummary?.status || room.status}</strong>
            </div>
            <div className="summary-item">
              <span>Phase</span>
              <strong>{roomSummary?.phase || room.phase}</strong>
            </div>
            <div className="summary-item">
              <span>Players</span>
              <strong>{roomSummary?.playerCount || room.players.length}</strong>
            </div>
            <div className="summary-item">
              <span>Alive</span>
              <strong>{roomSummary?.aliveCount || room.aliveCount}</strong>
            </div>
            <div className="summary-item">
              <span>Round</span>
              <strong>{roomSummary?.round || room.round}</strong>
            </div>
          </div>
        </section>

        <div className="action-grid">
          <section className="action-card">
            <div className="eyebrow">Night Actions</div>
            <h3>Choose Quietly</h3>
            {room.phase !== "night" ? (
              <p className="muted-text">Night choices appear only during the night phase.</p>
            ) : !isAlive ? (
              <p className="muted-text">Eliminated players can no longer act at night.</p>
            ) : !isNightRole ? (
              <p className="muted-text">Villagers sleep through the night.</p>
            ) : (
              <div className="action-list">
                {nightTargets.map((player) => (
                  <button
                    key={player.id}
                    className={
                      room.myNightChoice === player.id ? "action-btn selected" : "action-btn"
                    }
                    onClick={() => chooseNightTarget(player.id)}
                  >
                    <span>{player.username}</span>
                    <span>
                      {room.me?.role === "seer" ? "Inspect" : "Attack"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="action-card">
            <div className="eyebrow">Voting</div>
            <h3>Public Judgment</h3>
            {room.phase !== "voting" ? (
              <p className="muted-text">Voting begins after the 1 minute discussion ends.</p>
            ) : !isAlive ? (
              <p className="muted-text">Eliminated players cannot vote.</p>
            ) : (
              <div className="action-list">
                {alivePlayers
                  .filter((player) => player.id !== room.me?.id)
                  .map((player) => (
                    <button
                      key={player.id}
                      className={
                        room.myVoteTargetId === player.id ? "action-btn selected" : "action-btn"
                      }
                      onClick={() => voteTarget(player.id)}
                    >
                      <span>{player.username}</span>
                      <span>{room.voteTally?.[player.id] || 0} votes</span>
                    </button>
                  ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <aside className="feed-panel">
        <div className="feed-head">
          <div>
            <div className="eyebrow">Narrator & Chat</div>
            <h3>Village Feed</h3>
          </div>
          <div className="timer-chip">{room.phase}</div>
        </div>

        <div className="feed-list">
          {room.messages.map((entry) => (
            <article
              key={entry.id}
              className={
                entry.from === "Gemini Narrator" ? toneClass(entry.tone) : "feed-card"
              }
            >
              <strong>{entry.from}</strong>
              <p>{entry.text}</p>
            </article>
          ))}
        </div>

        <form className="chat-form" onSubmit={sendChat}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
              canChat
                ? "Share your suspicions with the village..."
                : "Chat is disabled outside lobby, discussion, and endgame."
            }
            disabled={!canChat || (!isAlive && room.phase !== "ended")}
          />
          <button
            className="primary-btn"
            type="submit"
            disabled={!canChat || (!isAlive && room.phase !== "ended")}
          >
            Send
          </button>
        </form>

        <div className="socket-trace">
          <div className="eyebrow">Socket Trace</div>
          <div className="trace-list">
            {eventLogs.length === 0 ? (
              <div className="log-card">Belum ada event socket.</div>
            ) : (
              eventLogs.map((log) => (
                <article key={log.id} className="log-card">
                  <div className="log-head">
                    <strong>{log.eventName}</strong>
                    <span>
                      {log.direction === "out" ? "client -> server" : "server -> client"} • {log.timestamp}
                    </span>
                  </div>
                  <pre>{log.payload || "-"}</pre>
                </article>
              ))
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}
