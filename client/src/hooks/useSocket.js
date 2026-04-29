import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useGame } from "../context/gameContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export function useSocket() {
  const socketRef = useRef(null);
  const {
    setSocket,
    setConnected,
    setRoomCode,
    updateRoom,
    setMyRole,
    addNarration,
    addChatMessage,
    setVoteData,
    setInvestigationResult,
    setEliminatedPlayer,
    setGameOver,
  } = useGame();

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(SERVER_URL, { autoConnect: true });
    socketRef.current = socket;
    setSocket(socket);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("room_created", ({ code }) => setRoomCode(code));
    socket.on("room_joined", ({ code }) => setRoomCode(code));
    socket.on("room_update", (room) => updateRoom(room));

    socket.on("your_role", ({ role }) => setMyRole(role));

    socket.on("narration", ({ text }) => addNarration(text));
    socket.on("chat_message", (msg) => addChatMessage(msg));
    socket.on("vote_update", (data) => setVoteData(data));
    socket.on("investigation_result", (result) =>
      setInvestigationResult(result),
    );
    socket.on("player_eliminated", ({ player }) => setEliminatedPlayer(player));
    socket.on("game_over", (data) => setGameOver(data));
    socket.on("error", ({ message }) => alert(`⚠️ ${message}`));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emit = (event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Socket not connected — skipping emit "${event}"`);
    }
  };

  return { emit, socket: socketRef.current };
}
