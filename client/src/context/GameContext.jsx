import { createContext, useContext, useReducer, useCallback } from "react";

const initialState = {
  // Socket
  socket: null,
  connected: false,

  // Player
  playerName: "",
  myRole: null,

  // Room
  roomCode: null,
  room: null,

  // Game
  phase: "lobby",
  narrations: [],
  chatMessages: [],
  voteData: { tally: {}, totalVotes: 0 },
  investigationResult: null,
  eliminatedPlayer: null,
  gameOver: null,

  // UI flags
  nightActionDone: false,
  myVote: null,
};

// ─── Action Types ─────────────────────────────────────────────────────────────
export const ACTIONS = {
  SET_SOCKET: "SET_SOCKET",
  SET_CONNECTED: "SET_CONNECTED",
  SET_PLAYER_NAME: "SET_PLAYER_NAME",
  SET_ROOM_CODE: "SET_ROOM_CODE",
  UPDATE_ROOM: "UPDATE_ROOM",
  SET_MY_ROLE: "SET_MY_ROLE",
  ADD_NARRATION: "ADD_NARRATION",
  ADD_CHAT_MESSAGE: "ADD_CHAT_MESSAGE",
  SET_VOTE_DATA: "SET_VOTE_DATA",
  SET_MY_VOTE: "SET_MY_VOTE",
  SET_INVESTIGATION_RESULT: "SET_INVESTIGATION_RESULT",
  SET_ELIMINATED_PLAYER: "SET_ELIMINATED_PLAYER",
  SET_GAME_OVER: "SET_GAME_OVER",
  SET_NIGHT_ACTION_DONE: "SET_NIGHT_ACTION_DONE",
  RESET_FOR_NEW_ROUND: "RESET_FOR_NEW_ROUND",
  RESET_GAME: "RESET_GAME",
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function gameReducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.SET_SOCKET:
      return { ...state, socket: payload };

    case ACTIONS.SET_CONNECTED:
      return { ...state, connected: payload };

    case ACTIONS.SET_PLAYER_NAME:
      return { ...state, playerName: payload };

    case ACTIONS.SET_ROOM_CODE:
      return { ...state, roomCode: payload };

    case ACTIONS.UPDATE_ROOM:
      return {
        ...state,
        room: payload,
        phase: payload.phase,
      };

    case ACTIONS.SET_MY_ROLE:
      return { ...state, myRole: payload };

    case ACTIONS.ADD_NARRATION:
      return {
        ...state,
        narrations: [
          ...state.narrations.slice(-20),
          { text: payload, id: Date.now() },
        ],
      };

    case ACTIONS.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, payload],
      };

    case ACTIONS.SET_VOTE_DATA:
      return { ...state, voteData: payload };

    case ACTIONS.SET_MY_VOTE:
      return { ...state, myVote: payload };

    case ACTIONS.SET_INVESTIGATION_RESULT:
      return { ...state, investigationResult: payload };

    case ACTIONS.SET_ELIMINATED_PLAYER:
      return { ...state, eliminatedPlayer: payload };

    case ACTIONS.SET_GAME_OVER:
      return { ...state, gameOver: payload };

    case ACTIONS.SET_NIGHT_ACTION_DONE:
      return { ...state, nightActionDone: payload };

    case ACTIONS.RESET_FOR_NEW_ROUND:
      return {
        ...state,
        nightActionDone: false,
        myVote: null,
        investigationResult: null,
        eliminatedPlayer: null,
        voteData: { tally: {}, totalVotes: 0 },
      };

    case ACTIONS.RESET_GAME:
      return {
        ...initialState,
        socket: state.socket,
        connected: state.connected,
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // ── Action creators (memoised so consumers don't re-render unnecessarily) ──
  const setSocket = useCallback(
    (socket) => dispatch({ type: ACTIONS.SET_SOCKET, payload: socket }),
    [],
  );
  const setConnected = useCallback(
    (val) => dispatch({ type: ACTIONS.SET_CONNECTED, payload: val }),
    [],
  );
  const setPlayerName = useCallback(
    (name) => dispatch({ type: ACTIONS.SET_PLAYER_NAME, payload: name }),
    [],
  );
  const setRoomCode = useCallback(
    (code) => dispatch({ type: ACTIONS.SET_ROOM_CODE, payload: code }),
    [],
  );
  const updateRoom = useCallback((room) => {
    dispatch({ type: ACTIONS.UPDATE_ROOM, payload: room });
    dispatch({ type: ACTIONS.RESET_FOR_NEW_ROUND });
  }, []);
  const setMyRole = useCallback(
    (role) => dispatch({ type: ACTIONS.SET_MY_ROLE, payload: role }),
    [],
  );
  const addNarration = useCallback(
    (text) => dispatch({ type: ACTIONS.ADD_NARRATION, payload: text }),
    [],
  );
  const addChatMessage = useCallback(
    (msg) => dispatch({ type: ACTIONS.ADD_CHAT_MESSAGE, payload: msg }),
    [],
  );
  const setVoteData = useCallback(
    (data) => dispatch({ type: ACTIONS.SET_VOTE_DATA, payload: data }),
    [],
  );
  const setMyVote = useCallback(
    (id) => dispatch({ type: ACTIONS.SET_MY_VOTE, payload: id }),
    [],
  );
  const setInvestigationResult = useCallback(
    (r) => dispatch({ type: ACTIONS.SET_INVESTIGATION_RESULT, payload: r }),
    [],
  );
  const setEliminatedPlayer = useCallback(
    (p) => dispatch({ type: ACTIONS.SET_ELIMINATED_PLAYER, payload: p }),
    [],
  );
  const setGameOver = useCallback(
    (data) => dispatch({ type: ACTIONS.SET_GAME_OVER, payload: data }),
    [],
  );
  const setNightActionDone = useCallback(
    (val) => dispatch({ type: ACTIONS.SET_NIGHT_ACTION_DONE, payload: val }),
    [],
  );
  const resetGame = useCallback(
    () => dispatch({ type: ACTIONS.RESET_GAME }),
    [],
  );

  const value = {
    // state
    ...state,
    // actions
    setSocket,
    setConnected,
    setPlayerName,
    setRoomCode,
    updateRoom,
    setMyRole,
    addNarration,
    addChatMessage,
    setVoteData,
    setMyVote,
    setInvestigationResult,
    setEliminatedPlayer,
    setGameOver,
    setNightActionDone,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
