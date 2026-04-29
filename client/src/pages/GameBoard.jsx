import { useGame } from "../context/gameContext";
import Chat from "../components/Chat";
import PlayerList from "../components/PlayerList";
import NightPanel from "../components/NightPanel";
import VotingPanel from "../components/VotingPanel";
import NarrationBox from "../components/NarrationBox";
import GameOverScreen from "../components/GameOverScreen";

const PHASE_LABELS = {
  night: "Night",
  day: "Day",
  voting: "Vote",
  lobby: "Lobby",
};

const ROLE_ICONS = {
  mafia: "🔪",
  doctor: "💉",
  detective: "🔍",
  villager: "👤",
};

export default function GameBoard({ emit }) {
  const {
    phase,
    myRole,
    room,
    socket,
    investigationResult,
    eliminatedPlayer,
    gameOver,
    roomCode,
  } = useGame();

  // Game over → dedicated screen
  if (gameOver) return <GameOverScreen />;

  const me = room?.players?.find((p) => p.id === socket?.id);
  const isAlive = me?.alive ?? true;
  const isHost = me?.isHost;

  return (
    <div className='game-board'>
      {/* ── Header ─────────────────────────────────────── */}
      <div className='game-header'>
        <span className='phase-badge'>{PHASE_LABELS[phase] ?? phase}</span>
        <span className='my-role-badge'>
          {ROLE_ICONS[myRole] ?? "❓"} {myRole ?? "unknown"}
        </span>
        {!isAlive && <span className='dead-badge'>☠️ Eliminated</span>}
      </div>

      {/* ── AI Narration ────────────────────────────────── */}
      <NarrationBox />

      {/* ── Alerts ──────────────────────────────────────── */}
      {eliminatedPlayer && (
        <div className='alert alert-warn'>
          <strong>{eliminatedPlayer.name}</strong> was eliminated — they were a{" "}
          <span className={`role-${eliminatedPlayer.role}`}>
            {eliminatedPlayer.role}
          </span>
          .
        </div>
      )}
      {investigationResult && myRole === "detective" && (
        <div className='alert alert-info'>
          🔍 <strong>{investigationResult.targetName}</strong> is{" "}
          {investigationResult.isMafia ? (
            <span className='role-mafia'>MAFIA</span>
          ) : (
            <span className='role-villager'>not Mafia</span>
          )}
          .
        </div>
      )}

      {/* ── Main content ────────────────────────────────── */}
      <div className='game-main'>
        <div className='game-center'>
          {/* Night phase */}
          {phase === "night" && isAlive && <NightPanel emit={emit} />}
          {phase === "night" && !isAlive && (
            <div className='action-panel muted'>
              <p>🌙 You are eliminated. Watch silently...</p>
            </div>
          )}

          {/* Day phase */}
          {phase === "day" && (
            <div className='action-panel'>
              <p className='action-label'>
                ☀️ Discuss with the village. Who is suspicious?
              </p>
              {isHost && (
                <button
                  className='btn-primary'
                  onClick={() => emit("start_voting", { code: roomCode })}
                >
                  🗳️ Start Voting
                </button>
              )}
              {!isHost && (
                <p className='hint'>Waiting for host to open voting...</p>
              )}

              {/* Host: force-resolve night (escape hatch if a role player disconnects) */}
              {isHost && (
                <button
                  className='btn-ghost'
                  style={{ marginTop: 8 }}
                  onClick={() =>
                    emit("force_resolve_night", { code: roomCode })
                  }
                >
                  Force resolve night (host only)
                </button>
              )}
            </div>
          )}

          {/* Voting phase */}
          {phase === "voting" && isAlive && <VotingPanel emit={emit} />}
          {phase === "voting" && !isAlive && (
            <div className='action-panel muted'>
              <p>🗳️ You are eliminated. You cannot vote.</p>
            </div>
          )}
        </div>

        <PlayerList />
      </div>

      {/* ── Chat (always visible) ───────────────────────── */}
      <Chat emit={emit} />
    </div>
  );
}
