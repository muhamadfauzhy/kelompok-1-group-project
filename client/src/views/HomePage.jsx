import { useState } from "react";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(sessionStorage.getItem("username") || "");
  const [roomCode, setRoomCode] = useState(sessionStorage.getItem("roomCode") || "");
  const [error, setError] = useState("");

  function goToGame(action) {
    const trimmedUsername = username.trim();
    const normalizedRoomCode = roomCode.trim().toUpperCase();

    if (!trimmedUsername) {
      setError("Username wajib diisi.");
      return;
    }

    if (action === "join" && !normalizedRoomCode) {
      setError("Room code wajib diisi untuk join.");
      return;
    }

    sessionStorage.setItem("username", trimmedUsername);
    sessionStorage.setItem("roomCode", normalizedRoomCode);
    sessionStorage.setItem("roomAction", action);
    setError("");
    navigate("/game");
  }

  return (
    <main className="shell">
      <section className="hero-panel">
        <div className="eyebrow">Realtime Werewolf</div>
        <h1>Gemini Narrated Village</h1>
        <p className="hero-copy">
          Create a room, invite players, and survive the night. The game uses Express +
          Socket.IO and gives Gemini the role of narrator for major phase transitions and
          outcomes.
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
            <button className="primary-btn" onClick={() => goToGame("create")}>
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
            <button className="secondary-btn" onClick={() => goToGame("join")}>
              Join Room
            </button>
          </div>
        </div>

        <div className="status-card">
          <div className="status-label">Ready</div>
          <p>
            Minimum 4 players. Host starts the match, roles are randomized, and each player
            gets their private role through socket state.
          </p>
          {error ? <div className="error-banner">{error}</div> : null}
        </div>
      </section>
    </main>
  );
}
