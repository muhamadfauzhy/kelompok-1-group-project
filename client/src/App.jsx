import { useSocket } from "./hooks/useSocket";
import { useGame } from "./context/gameContext";
import LobbyPage from "./pages/LobbyPage";
import WaitingRoom from "./pages/WaitingRoom";
import GameBoard from "./pages/GameBoard";

function AppInner() {
  const { emit } = useSocket();
  const { roomCode, phase, connected } = useGame();

  let page;
  if (!roomCode) {
    page = <LobbyPage emit={emit} />;
  } else if (phase === "lobby") {
    page = <WaitingRoom emit={emit} />;
  } else {
    page = <GameBoard emit={emit} />;
  }

  return (
    <div className='app'>
      <div
        className='connection-dot'
        title={connected ? "Connected" : "Disconnected"}
      >
        <span className={connected ? "dot-green" : "dot-red"} />
      </div>
      {page}
    </div>
  );
}

export default function App() {
  return <AppInner />;
}
