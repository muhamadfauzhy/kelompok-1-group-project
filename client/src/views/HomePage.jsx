import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import { LanguageContext } from "../context/languageContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { copy } = useContext(LanguageContext);
  const [username, setUsername] = useState(sessionStorage.getItem("username") || "");
  const [roomCode, setRoomCode] = useState(sessionStorage.getItem("roomCode") || "");
  const [error, setError] = useState("");

  function goToGame(action) {
    const trimmedUsername = username.trim();
    const normalizedRoomCode = roomCode.trim().toUpperCase();

    if (!trimmedUsername) {
      setError(copy.home.usernameRequired);
      return;
    }

    if (action === "join" && !normalizedRoomCode) {
      setError(copy.home.roomCodeRequired);
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
        <div className="eyebrow">{copy.home.heroEyebrow}</div>
        <h1>{copy.home.heroTitle}</h1>
        <p className="hero-copy">{copy.home.heroCopy}</p>
        <div className="feature-grid">
          {copy.home.features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="entry-panel">
        <div className="entry-card">
          <div className="eyebrow">{copy.home.identityEyebrow}</div>
          <h2>{copy.home.entryTitle}</h2>
          <label className="field">
            <span>{copy.home.usernameLabel}</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={copy.home.usernamePlaceholder}
            />
          </label>
          <div className="entry-actions">
            <button className="primary-btn" onClick={() => goToGame("create")}>
              {copy.home.createRoom}
            </button>
          </div>
        </div>

        <div className="entry-card secondary">
          <div className="eyebrow">{copy.home.joinEyebrow}</div>
          <h2>{copy.home.joinTitle}</h2>
          <label className="field">
            <span>{copy.home.roomCodeLabel}</span>
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              placeholder={copy.home.roomCodePlaceholder}
            />
          </label>
          <div className="entry-actions">
            <button className="secondary-btn" onClick={() => goToGame("join")}>
              {copy.home.joinRoom}
            </button>
          </div>
        </div>

        <div className="status-card">
          <div className="status-label">{copy.home.readyLabel}</div>
          <p>{copy.home.readyCopy}</p>
          {error ? <div className="error-banner">{error}</div> : null}
        </div>
      </section>
    </main>
  );
}
