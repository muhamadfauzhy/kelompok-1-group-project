import { useState } from "react";
import { useGame } from "../context/gameContext";

export default function LobbyPage({ emit }) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const { setPlayerName } = useGame();

  const handleCreate = () => {
    if (!name.trim()) return;
    setPlayerName(name.trim());
    emit("create_room", { playerName: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    setPlayerName(name.trim());
    emit("join_room", {
      code: joinCode.trim().toUpperCase(),
      playerName: name.trim(),
    });
  };

  const handleKey = (e, fn) => e.key === "Enter" && fn();

  return (
    <div className='lobby'>
      <div className='lobby-hero'>
        <h1>🎭 Mafia</h1>
        <p>Social deduction. Betrayal. AI-powered drama.</p>
      </div>

      {!mode && (
        <div className='lobby-actions'>
          <button className='btn-primary' onClick={() => setMode("create")}>
            Create Room
          </button>
          <button className='btn-secondary' onClick={() => setMode("join")}>
            Join Room
          </button>
        </div>
      )}

      {mode && (
        <div className='lobby-form'>
          <input
            placeholder='Your name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) =>
              handleKey(e, mode === "create" ? handleCreate : handleJoin)
            }
            autoFocus
          />
          {mode === "join" && (
            <input
              placeholder='Room code (e.g. AB12CD)'
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => handleKey(e, handleJoin)}
              maxLength={6}
            />
          )}
          <div className='form-row'>
            <button className='btn-ghost' onClick={() => setMode(null)}>
              ← Back
            </button>
            <button
              className='btn-primary'
              onClick={mode === "create" ? handleCreate : handleJoin}
            >
              {mode === "create" ? "Create" : "Join"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
