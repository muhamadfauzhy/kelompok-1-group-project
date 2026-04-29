import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { LanguageContext } from "../context/languageContext";
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

export default function GamePage() {
  const navigate = useNavigate();
  const { copy, getDirectionLabel, getPhaseLabel, getRoleLabel, getStatusLabel } =
    useContext(LanguageContext);
  const [room, setRoom] = useState(null);
  const [roomSummary, setRoomSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [eventLogs, setEventLogs] = useState([]);
  const usernameRef = useRef(sessionStorage.getItem("username") || "");
  const roomCodeRef = useRef(sessionStorage.getItem("roomCode") || "");
  const roomActionRef = useRef(sessionStorage.getItem("roomAction") || "");
  const hasRequestedRef = useRef(false);

  const countdown = useCountdown(room?.phaseEndsAt ?? null);
  const alivePlayers = room?.players?.filter((player) => player.alive) || [];

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
    if (!usernameRef.current.trim()) {
      navigate("/");
      return undefined;
    }

    function handleConnect() {
      pushEventLog("connect", { socketId: socket.id }, "in");

      if (hasRequestedRef.current) {
        return;
      }

      hasRequestedRef.current = true;

      if (roomActionRef.current === "create") {
        socket.emit("room:create");
        pushEventLog("room:create", null, "out");
      }

      if (roomActionRef.current === "join") {
        socket.emit("room:join", roomCodeRef.current);
        pushEventLog("room:join", roomCodeRef.current, "out");
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
      setError("");
      if (nextRoom?.code) {
        sessionStorage.setItem("roomCode", nextRoom.code);
        roomCodeRef.current = nextRoom.code;
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
      setError(copy.game.socketConnectionError(connectError.message));
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
  }, [copy.game, navigate]);

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
    pushEventLog("chat:send", { message }, "out");
    setMessage("");
  }

  function handleStartGame() {
    socket.emit("game:start");
    pushEventLog("game:start", null, "out");
  }

  function handleNightTarget(targetId) {
    socket.emit("night:action", targetId);
    pushEventLog("night:action", { targetId }, "out");
  }

  function handleVoteTarget(targetId) {
    socket.emit("vote", { targetId });
    pushEventLog("vote", { targetId }, "out");
  }

  if (!room) {
    return (
      <main className="shell">
        <section className="hero-panel">
          <div className="eyebrow">{copy.game.connectingEyebrow}</div>
          <h1>{copy.game.preparingRoomTitle}</h1>
          <p className="hero-copy">{error || copy.game.waitingForRoom}</p>
        </section>
      </main>
    );
  }

  const canStart = room.me?.isHost && room.status === "lobby" && room.players.length >= 4;
  const canChat = room.phase === "lobby" || room.phase === "discussion" || room.phase === "ended";
  const isAlive = room.me?.alive;
  const isNightRole = room.me?.role === "werewolf" || room.me?.role === "seer";
  const nightTargets = alivePlayers.filter((player) => player.id !== room.me?.id);

  return (
    <main className="game-shell">
      <aside className="sidebar">
        <div className="room-header">
          <div>
            <div className="eyebrow">{copy.game.roomCode}</div>
            <div className="room-code">{room.code}</div>
          </div>
          <button className="ghost-btn" onClick={leaveGame}>
            {copy.common.leave}
          </button>
        </div>

        <div className="role-card">
          <div className="eyebrow">{copy.game.yourRole}</div>
          <div className="role-name">{getRoleLabel(room.me?.role)}</div>
          <div className="role-status">
            {room.me?.alive ? copy.common.aliveStatus : copy.common.eliminatedStatus}
          </div>
        </div>

        {privateNote ? (
          <div className="private-card">
            <div className="eyebrow">{copy.common.privateNote}</div>
            <p>{privateNote}</p>
          </div>
        ) : room.me?.nightResult ? (
          <div className="private-card">
            <div className="eyebrow">{copy.common.privateNote}</div>
            <p>{room.me.nightResult}</p>
          </div>
        ) : null}

        <div className="player-list">
          <div className="eyebrow">{copy.game.players}</div>
          {room.players.map((player) => (
            <article key={player.id} className="player-card">
              <div className="player-top">
                <strong>
                  {player.username}
                  {player.id === room.me?.id ? ` (${copy.common.you})` : ""}
                </strong>
                <span className={player.alive ? "alive-pill" : "dead-pill"}>
                  {player.alive ? copy.common.aliveStatus : copy.common.outStatus}
                </span>
              </div>
              <div className="player-meta">
                {player.isHost ? copy.common.host : copy.common.player}
                {room.status === "ended" && player.role ? ` - ${getRoleLabel(player.role)}` : ""}
              </div>
            </article>
          ))}
        </div>
      </aside>

      <section className="main-stage">
        <div className="phase-card">
          <div className="phase-copy">
            <div className="eyebrow">{copy.game.phase}</div>
            <h2>{getPhaseLabel(room.phase)}</h2>
            <p>{room.narration}</p>
          </div>
          <div className="phase-side">
            <div className="timer-label">
              {room.phaseEndsAt ? copy.common.secondsLeft(countdown) : getStatusLabel(room.status)}
            </div>
            {canStart ? (
              <button className="primary-btn" onClick={handleStartGame}>
                {copy.common.startGame}
              </button>
            ) : null}
          </div>
        </div>

        {error ? <div className="error-banner stage-error">{error}</div> : null}

        <section className="action-card">
          <div className="eyebrow">{copy.game.socketSummary}</div>
          <h3>{copy.game.broadcastPreview}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span>{copy.common.room}</span>
              <strong>{roomSummary?.code || room.code}</strong>
            </div>
            <div className="summary-item">
              <span>{copy.common.status}</span>
              <strong>{getStatusLabel(roomSummary?.status || room.status)}</strong>
            </div>
            <div className="summary-item">
              <span>{copy.common.phase}</span>
              <strong>{getPhaseLabel(roomSummary?.phase || room.phase)}</strong>
            </div>
            <div className="summary-item">
              <span>{copy.common.players}</span>
              <strong>{roomSummary?.playerCount || room.players.length}</strong>
            </div>
            <div className="summary-item">
              <span>{copy.common.alive}</span>
              <strong>{roomSummary?.aliveCount || room.aliveCount}</strong>
            </div>
            <div className="summary-item">
              <span>{copy.common.round}</span>
              <strong>{roomSummary?.round || room.round}</strong>
            </div>
          </div>
        </section>

        <div className="action-grid">
          <section className="action-card">
            <div className="eyebrow">{copy.game.nightActions}</div>
            <h3>{copy.game.chooseQuietly}</h3>
            {room.phase !== "night" ? (
              <p className="muted-text">{copy.game.nightOnly}</p>
            ) : !isAlive ? (
              <p className="muted-text">{copy.game.eliminatedNoNight}</p>
            ) : !isNightRole ? (
              <p className="muted-text">{copy.game.villagersSleep}</p>
            ) : (
              <div className="action-list">
                {nightTargets.map((player) => (
                  <button
                    key={player.id}
                    className={room.myNightChoice === player.id ? "action-btn selected" : "action-btn"}
                    onClick={() => handleNightTarget(player.id)}
                  >
                    <span>{player.username}</span>
                    <span>{room.me?.role === "seer" ? copy.game.inspect : copy.game.attack}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="action-card">
            <div className="eyebrow">{copy.game.voting}</div>
            <h3>{copy.game.publicJudgment}</h3>
            {room.phase !== "voting" ? (
              <p className="muted-text">{copy.game.votingAfterDiscussion}</p>
            ) : !isAlive ? (
              <p className="muted-text">{copy.game.eliminatedCannotVote}</p>
            ) : (
              <div className="action-list">
                {alivePlayers
                  .filter((player) => player.id !== room.me?.id)
                  .map((player) => (
                    <button
                      key={player.id}
                      className={room.myVoteTargetId === player.id ? "action-btn selected" : "action-btn"}
                      onClick={() => handleVoteTarget(player.id)}
                    >
                      <span>{player.username}</span>
                      <span>{copy.game.votes(room.voteTally?.[player.id] || 0)}</span>
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
            <div className="eyebrow">{copy.game.narratorChat}</div>
            <h3>{copy.game.villageFeed}</h3>
          </div>
          <div className="timer-chip">{getPhaseLabel(room.phase)}</div>
        </div>

        <div className="feed-list">
          {room.messages.map((entry) => (
            <article
              key={entry.id}
              className={entry.from === "Gemini Narrator" ? toneClass(entry.tone) : "feed-card"}
            >
              <strong>{entry.from}</strong>
              <p>{entry.text}</p>
            </article>
          ))}
        </div>

        <form className="chat-form" onSubmit={submitChat}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={canChat ? copy.game.chatPlaceholder : copy.game.chatDisabled}
            disabled={!canChat || (!isAlive && room.phase !== "ended")}
          />
          <button
            className="primary-btn"
            type="submit"
            disabled={!canChat || (!isAlive && room.phase !== "ended")}
          >
            {copy.common.send}
          </button>
        </form>

        <div className="socket-trace">
          <div className="eyebrow">{copy.game.socketTrace}</div>
          <div className="trace-list">
            {eventLogs.length === 0 ? (
              <div className="log-card">{copy.game.noSocketEvents}</div>
            ) : (
              eventLogs.map((log) => (
                <article key={log.id} className="log-card">
                  <div className="log-head">
                    <strong>{log.eventName}</strong>
                    <span>
                      {getDirectionLabel(log.direction)} - {log.timestamp}
                    </span>
                  </div>
                  <pre>{log.payload || copy.common.noPayload}</pre>
                </article>
              ))
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}
