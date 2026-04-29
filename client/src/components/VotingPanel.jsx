import { useGame } from "../context/GameContext";

export default function VotingPanel({ emit }) {
  const { room, roomCode, socket, voteData, myVote, setMyVote } = useGame();

  const me = room?.players?.find((p) => p.id === socket?.id);
  const isHost = me?.isHost;
  const alivePlayers = room?.players?.filter((p) => p.alive) ?? [];
  const targets = alivePlayers.filter((p) => p.id !== socket?.id);
  const totalAlive = alivePlayers.length;

  const handleVote = (targetId) => {
    if (myVote) return;
    setMyVote(targetId);
    emit("vote", { code: roomCode, targetId });
  };

  return (
    <div className='action-panel'>
      <p className='action-label'>
        🗳️ Vote to eliminate a suspect — <strong>{voteData.totalVotes}</strong>{" "}
        / {totalAlive} voted
      </p>

      <div className='target-list'>
        {targets.map((p) => {
          const count = voteData.tally?.[p.id] ?? 0;
          const isMyChoice = myVote === p.id;
          return (
            <button
              key={p.id}
              className={`target-btn vote-btn ${isMyChoice ? "voted" : ""} ${myVote && !isMyChoice ? "disabled" : ""}`}
              onClick={() => handleVote(p.id)}
              disabled={!!myVote}
            >
              <span className='target-avatar'>{p.name[0]}</span>
              <span className='vote-name'>{p.name}</span>
              {count > 0 && (
                <span className='vote-count'>
                  {count} vote{count !== 1 ? "s" : ""}
                </span>
              )}
              {isMyChoice && <span className='your-vote'>✓ Voted</span>}
            </button>
          );
        })}
      </div>

      {isHost && (
        <button
          className='btn-ghost'
          style={{ marginTop: 12 }}
          onClick={() => emit("force_resolve_vote", { code: roomCode })}
        >
          Force resolve votes (host only)
        </button>
      )}
    </div>
  );
}
