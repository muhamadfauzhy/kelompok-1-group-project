const PORT = Number(process.env.PORT) || 3001;
const DEFAULT_CLIENT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || DEFAULT_CLIENT_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
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
  [PHASE.NIGHT]: 30_000,
  [PHASE.DISCUSSION]: 90_000,
  [PHASE.VOTING]: 30_000,
};

const CHAT_ENABLED_PHASES = new Set([PHASE.LOBBY, PHASE.DISCUSSION, PHASE.ENDED]);
const NIGHT_ROLES = new Set([ROLE.WEREWOLF, ROLE.SEER]);

module.exports = {
  PORT,
  CLIENT_ORIGINS,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  MIN_PLAYERS,
  MAX_MESSAGES,
  ROLE,
  PHASE,
  STATUS,
  PHASE_DURATION_MS,
  CHAT_ENABLED_PHASES,
  NIGHT_ROLES,
};
