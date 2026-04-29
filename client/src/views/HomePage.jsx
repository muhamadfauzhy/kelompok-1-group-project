import { useState } from "react";
import { useNavigate } from "react-router";
import { useMusicContext } from "../contexts/MusicContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { setPhaseMusic } = useMusicContext();
  const [username, setUsername] = useState(sessionStorage.getItem("username") || "");
  const [roomCode, setRoomCode] = useState(sessionStorage.getItem("roomCode") || "");
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null);

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
    setPhaseMusic("lobby");
    setError("");
    navigate("/game");
  }

  return (
    <main className="home-screen">
      <section className="home-card">
        <div className="home-crest">Village of Wolves</div>
        <div className="home-hero">
          <div className="eyebrow">Realtime Social Deduction</div>
          <h1 className="home-title">Werewolf</h1>
          <p className="home-subtitle">
            Create a private room, invite the village, and survive the shift from lobby to night to day.
          </p>
        </div>

        {!mode ? (
          <div className="home-mode-switch">
            <button className="btn-primary" onClick={() => setMode("create")}>
              Create Room
            </button>
            <button className="btn-secondary" onClick={() => setMode("join")}>
              Join Room
            </button>
          </div>
        ) : (
          <div className="home-form-card">
            <div className="eyebrow">{mode === "create" ? "Host A Match" : "Join A Room"}</div>
            <div className="lobby-form">
              <input
                className="form-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Your name"
                autoFocus
              />
              {mode === "join" ? (
                <input
                  className="form-input"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  placeholder="Room code"
                  maxLength={6}
                />
              ) : null}
              <div className="form-row">
                <button className="btn-ghost" onClick={() => setMode(null)}>
                  Back
                </button>
                <button className="btn-primary" onClick={() => goToGame(mode)}>
                  {mode === "create" ? "Open Lobby" : "Enter Room"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="feature-grid">
          <article className="feature-card">
            <div className="eyebrow">Role Set</div>
            <h3>Villager, Seer, Werewolf</h3>
            <p>Focused roles keep every round readable while still giving players room to bluff.</p>
          </article>
          <article className="feature-card">
            <div className="eyebrow">Timed Flow</div>
            <h3>Lobby, Night, Day</h3>
            <p>Server-driven timers move the match automatically so each phase feels deliberate.</p>
          </article>
          <article className="feature-card">
            <div className="eyebrow">Live Room</div>
            <h3>Private Code Multiplayer</h3>
            <p>Spin up a room code, gather players, and let the narrator carry the tension.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
