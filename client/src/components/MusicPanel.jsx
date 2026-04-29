import { useMusicContext } from "../contexts/MusicContext";

export default function MusicPanel() {
  const {
    currentPhase,
    currentTrack,
    error,
    isEnabled,
    isPlaying,
    normalizePhase,
    pendingAutoplay,
    toggleMusic,
  } = useMusicContext();

  const phaseLabel = normalizePhase(currentPhase).toUpperCase();

  return (
    <div className="music-floating">
      <div className="music-panel">
        <div className="eyebrow">Music</div>
        <strong>{phaseLabel}</strong>
        <p>{isEnabled ? (isPlaying ? "Now playing" : "Ready to play") : "Music is off"}</p>
        <small>{currentTrack || "No track selected"}</small>
        {pendingAutoplay ? <div className="music-note">Click anywhere to unlock audio.</div> : null}
        {error ? <div className="music-error">{error}</div> : null}
        <button className="ghost-btn music-btn" onClick={toggleMusic}>
          {isEnabled ? "Mute Music" : "Enable Music"}
        </button>
      </div>
    </div>
  );
}
