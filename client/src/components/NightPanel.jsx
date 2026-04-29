import { useGame } from "../context/GameContext";

const ACTIONS = {
  mafia: { label: "🔪 Choose someone to eliminate", action: "kill" },
  doctor: { label: "💉 Choose someone to protect", action: "protect" },
  detective: {
    label: "🔍 Choose someone to investigate",
    action: "investigate",
  },
};

export default function NightPanel({ emit }) {
  const {
    myRole,
    room,
    roomCode,
    socket,
    nightActionDone,
    setNightActionDone,
  } = useGame();

  if (myRole === "villager") {
    return (
      <div className='action-panel muted'>
        <p>🌙 You are a villager. Close your eyes and sleep...</p>
      </div>
    );
  }

  if (nightActionDone) {
    return (
      <div className='action-panel muted'>
        <p>✅ Night action submitted. Waiting for others...</p>
      </div>
    );
  }

  const config = ACTIONS[myRole];
  if (!config) return null;

  const targets =
    room?.players?.filter((p) => p.alive && p.id !== socket?.id) ?? [];

  const handleAction = (targetId) => {
    emit("night_action", { code: roomCode, targetId, action: config.action });
    setNightActionDone(true);
  };

  return (
    <div className='action-panel'>
      <p className='action-label'>{config.label}</p>
      <div className='target-list'>
        {targets.map((p) => (
          <button
            key={p.id}
            className='target-btn'
            onClick={() => handleAction(p.id)}
          >
            <span className='target-avatar'>{p.name[0]}</span>
            {p.name}
          </button>
        ))}
        {targets.length === 0 && (
          <p className='hint'>No valid targets available.</p>
        )}
      </div>
    </div>
  );
}
