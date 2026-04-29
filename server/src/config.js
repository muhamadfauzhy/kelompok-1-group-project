const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MIN_PLAYERS = 4;
const MAX_MESSAGES = 80;

const ROLE = {
  VILLAGER: "villager",
  SEER: "seer",
  WEREWOLF: "werewolf",
};

const PHASE = {
  LOBBY: "lobby",
  NIGHT: "night",
  DISCUSSION: "discussion",
  VOTING: "voting",
  ENDED: "ended",
};

const STATUS = {
  LOBBY: "lobby",
  PLAYING: "playing",
  ENDED: "ended",
};

const PHASE_DURATION_MS = {
  [PHASE.NIGHT]: 25_000,
  [PHASE.DISCUSSION]: 60_000,
  [PHASE.VOTING]: 25_000,
};

const CHAT_ENABLED_PHASES = new Set([PHASE.LOBBY, PHASE.DISCUSSION, PHASE.ENDED]);
const NIGHT_ROLES = new Set([ROLE.WEREWOLF, ROLE.SEER]);

module.exports = {
  PORT,
  CLIENT_ORIGINS,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  MIN_PLAYERS,
  MAX_MESSAGES,
  ROLE,
  PHASE,
  STATUS,
  PHASE_DURATION_MS,
  CHAT_ENABLED_PHASES,
  NIGHT_ROLES,
};
