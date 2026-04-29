import { useGame } from "../context/GameContext";

export default function NarrationBox() {
  const { narrations } = useGame();
  const latest = narrations[narrations.length - 1];
  if (!latest) return null;

  return (
    <div className='narration-box' key={latest.id}>
      <span className='narration-icon'>🎭</span>
      <p className='narration-text'>{latest.text}</p>
    </div>
  );
}
