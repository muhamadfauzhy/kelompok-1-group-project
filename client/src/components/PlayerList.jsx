import { useGame } from "../context/GameContext";

const ROLE_ICONS = {
  mafia: "🔪",
  doctor: "💉",
  detective: "🔍",
  villager: "👤",
};

export default function PlayerList() {
  const { room, socket, myRole } = useGame();

  const players = room?.players ?? [];
  const mafiaIds = new Set(
    players.filter((p) => p.role === "mafia").map((p) => p.id),
  );

  return (
    <div className='player-list-panel'>
      <h3>Players ({players.length})</h3>
      {players.map((p) => {
        const isMe = p.id === socket?.id;
        // Mafia members can see each other
        const showAsMafia = myRole === "mafia" && mafiaIds.has(p.id) && !isMe;

        return (
          <div
            key={p.id}
            className={`player-row ${!p.alive ? "dead" : ""} ${isMe ? "me" : ""}`}
          >
            <span className='player-avatar-sm'>{p.name[0].toUpperCase()}</span>
            <span className='player-name-row'>
              {p.name}
              {isMe && <span className='you-tag'> (you)</span>}
            </span>
            {showAsMafia && (
              <span className='mafia-tag' title='Fellow Mafia'>
                🔪
              </span>
            )}
            {!p.alive && <span className='dead-icon'>☠️</span>}
          </div>
        );
      })}
    </div>
  );
}
