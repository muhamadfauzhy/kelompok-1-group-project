import { useGame } from "../context/gameContext";

function getRolesForCount(count) {
  const roles = [];
  const mafiaCount = Math.max(1, Math.floor(count / 3));
  for (let i = 0; i < mafiaCount; i++) roles.push("mafia");
  if (count >= 4) roles.push("doctor");
  if (count >= 5) roles.push("detective");
  while (roles.length < count) roles.push("villager");
  return roles;
}

export default function WaitingRoom({ emit }) {
  const { room, roomCode, socket } = useGame();

  const players = room?.players ?? [];
  const me = players.find((p) => p.id === socket?.id);
  const isHost = me?.isHost;
  const count = players.length;

  const handleStart = () => emit("start_game", { code: roomCode });

  return (
    <div className='waiting-room'>
      <div className='room-header'>
        <h2>Room Code</h2>
        <div className='room-code'>{roomCode}</div>
        <p className='hint'>Share this code with friends to join</p>
      </div>

      <div className='players-list'>
        <h3>Players ({count})</h3>
        {players.map((p) => (
          <div
            key={p.id}
            className={`player-chip ${p.id === socket?.id ? "me" : ""}`}
          >
            <span className='player-avatar'>{p.name[0].toUpperCase()}</span>
            <span className='player-name'>{p.name}</span>
            {p.isHost && <span className='badge-host'>Host</span>}
            {p.id === socket?.id && <span className='badge-me'>You</span>}
          </div>
        ))}
      </div>

      <div className='role-info'>
        <h3>Roles this game ({count} players)</h3>
        <div className='role-chips'>
          {getRolesForCount(count).map((r, i) => (
            <span key={i} className={`role-chip role-${r}`}>
              {r}
            </span>
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          className='btn-primary btn-lg'
          onClick={handleStart}
          disabled={count < 3}
        >
          {count < 3 ? `Need ${3 - count} more player(s)` : "Start Game ▶"}
        </button>
      ) : (
        <p className='waiting-text'>⏳ Waiting for host to start...</p>
      )}
    </div>
  );
}
