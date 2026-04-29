import { useGame } from "../context/GameContext";

const ROLE_ICONS = {
  mafia: "🔪",
  doctor: "💉",
  detective: "🔍",
  villager: "👤",
};

export default function GameOverScreen() {
  const { gameOver, myRole, resetGame } = useGame();
  const { winner, players } = gameOver;

  const iWon =
    (winner === "mafia" && myRole === "mafia") ||
    (winner === "villagers" && myRole !== "mafia");

  return (
    <div className='game-over'>
      <div className={`game-over-banner ${iWon ? "win" : "lose"}`}>
        {winner === "villagers" ? "🎉 Villagers Win!" : "💀 Mafia Wins!"}
      </div>

      <p className='game-over-sub'>
        {iWon ? "You were on the winning side." : "Better luck next time."}
      </p>

      <div className='reveal-list'>
        <h3>Role Reveal</h3>
        {players
          .sort((a, b) => {
            const order = { mafia: 0, detective: 1, doctor: 2, villager: 3 };
            return (order[a.role] ?? 9) - (order[b.role] ?? 9);
          })
          .map((p) => (
            <div
              key={p.id}
              className={`reveal-player ${!p.alive ? "dead" : ""}`}
            >
              <span className='reveal-icon'>{ROLE_ICONS[p.role] ?? "❓"}</span>
              <span className='reveal-name'>{p.name}</span>
              <span className={`role-badge role-${p.role}`}>{p.role}</span>
              {!p.alive && <span className='dead-tag'>☠️</span>}
            </div>
          ))}
      </div>

      <button className='btn-primary btn-lg' onClick={resetGame}>
        🔄 Play Again
      </button>
    </div>
  );
}
