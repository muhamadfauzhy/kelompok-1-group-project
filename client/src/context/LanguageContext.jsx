import { useEffect, useState } from "react";
import { LanguageContext } from "./languageContext";

const dictionary = {
  en: {
    common: {
      language: "Language",
      languageToggleLabel: "Change language",
      englishShort: "EN",
      indonesianShort: "ID",
      leave: "Leave",
      startGame: "Start Game",
      send: "Send",
      room: "Room",
      status: "Status",
      phase: "Phase",
      players: "Players",
      alive: "Alive",
      round: "Round",
      privateNote: "Private Note",
      hidden: "Hidden",
      you: "You",
      host: "Host",
      player: "Player",
      aliveStatus: "Alive",
      eliminatedStatus: "Eliminated",
      outStatus: "Out",
      noPayload: "-",
      secondsLeft: (seconds) => `${seconds}s left`,
      directions: {
        in: "server -> client",
        out: "client -> server",
      },
    },
    home: {
      heroEyebrow: "Realtime Werewolf",
      heroTitle: "Gemini Narrated Village",
      heroCopy:
        "Create a room, invite players, and survive the night. The game uses Express + Socket.IO and gives Gemini the role of narrator for major phase transitions and outcomes.",
      features: [
        {
          title: "Role Set",
          body: "Only three roles are used: Villager, Seer, and Werewolf.",
        },
        {
          title: "Timed Phases",
          body: "Day discussion runs for 1 minute exactly, then the vote opens.",
        },
        {
          title: "Realtime Rooms",
          body: "Create or join a room code and sync gameplay live for every player.",
        },
      ],
      identityEyebrow: "Identity",
      entryTitle: "Enter The Village",
      usernameLabel: "Username",
      usernamePlaceholder: "e.g. Jefry",
      createRoom: "Create Room",
      joinEyebrow: "Join",
      joinTitle: "Already Have A Room?",
      roomCodeLabel: "Room Code",
      roomCodePlaceholder: "ABCDE",
      joinRoom: "Join Room",
      readyLabel: "Ready",
      readyCopy:
        "Minimum 4 players. Host starts the match, roles are randomized, and each player gets their private role through socket state.",
      usernameRequired: "Username is required.",
      roomCodeRequired: "Room code is required to join.",
    },
    game: {
      connectingEyebrow: "Connecting",
      preparingRoomTitle: "Preparing Room",
      waitingForRoom: "Connecting to the werewolf server and waiting for room state.",
      socketConnectionError: (message) =>
        `Failed to connect to the socket server (${message || "unknown error"}). Make sure the server is running on port 3001.`,
      roomCode: "Room Code",
      yourRole: "Your Role",
      players: "Players",
      phase: "Phase",
      socketSummary: "Socket Summary",
      broadcastPreview: "Server Broadcast Preview",
      nightActions: "Night Actions",
      chooseQuietly: "Choose Quietly",
      nightOnly: "Night choices appear only during the night phase.",
      eliminatedNoNight: "Eliminated players can no longer act at night.",
      villagersSleep: "Villagers sleep through the night.",
      inspect: "Inspect",
      attack: "Attack",
      voting: "Voting",
      publicJudgment: "Public Judgment",
      votingAfterDiscussion: "Voting begins after the 1 minute discussion ends.",
      eliminatedCannotVote: "Eliminated players cannot vote.",
      votes: (total) => `${total} votes`,
      narratorChat: "Narrator & Chat",
      villageFeed: "Village Feed",
      chatPlaceholder: "Share your suspicions with the village...",
      chatDisabled: "Chat is disabled outside lobby, discussion, and endgame.",
      socketTrace: "Socket Trace",
      noSocketEvents: "No socket events yet.",
    },
    gameAI: {
      eyebrow: "Game AI",
      title: "Coming Soon",
      copy: "AI mode has not been activated in this project yet.",
    },
  },
  id: {
    common: {
      language: "Bahasa",
      languageToggleLabel: "Ganti bahasa",
      englishShort: "EN",
      indonesianShort: "ID",
      leave: "Keluar",
      startGame: "Mulai Game",
      send: "Kirim",
      room: "Room",
      status: "Status",
      phase: "Fase",
      players: "Pemain",
      alive: "Hidup",
      round: "Ronde",
      privateNote: "Catatan Rahasia",
      hidden: "Tersembunyi",
      you: "Kamu",
      host: "Host",
      player: "Pemain",
      aliveStatus: "Hidup",
      eliminatedStatus: "Tereliminasi",
      outStatus: "Keluar",
      noPayload: "-",
      secondsLeft: (seconds) => `${seconds} dtk tersisa`,
      directions: {
        in: "server -> client",
        out: "client -> server",
      },
    },
    home: {
      heroEyebrow: "Werewolf Realtime",
      heroTitle: "Desa dengan Narator Gemini",
      heroCopy:
        "Buat room, undang pemain, dan bertahan hidup melewati malam. Game ini memakai Express + Socket.IO dan memberi Gemini peran sebagai narator untuk perpindahan fase penting dan hasil permainan.",
      features: [
        {
          title: "Set Role",
          body: "Hanya ada tiga role: Villager, Seer, dan Werewolf.",
        },
        {
          title: "Fase Berwaktu",
          body: "Diskusi siang berjalan tepat 1 menit, lalu voting dibuka.",
        },
        {
          title: "Room Realtime",
          body: "Buat atau join room code lalu sinkronkan permainan langsung untuk semua pemain.",
        },
      ],
      identityEyebrow: "Identitas",
      entryTitle: "Masuk ke Desa",
      usernameLabel: "Username",
      usernamePlaceholder: "Mis. Jefry",
      createRoom: "Buat Room",
      joinEyebrow: "Join",
      joinTitle: "Sudah Punya Room?",
      roomCodeLabel: "Kode Room",
      roomCodePlaceholder: "ABCDE",
      joinRoom: "Join Room",
      readyLabel: "Siap",
      readyCopy:
        "Minimal 4 pemain. Host memulai match, role diacak, dan setiap pemain mendapat role privat melalui socket state.",
      usernameRequired: "Username wajib diisi.",
      roomCodeRequired: "Room code wajib diisi untuk join.",
    },
    game: {
      connectingEyebrow: "Menghubungkan",
      preparingRoomTitle: "Menyiapkan Room",
      waitingForRoom: "Sedang terhubung ke server werewolf dan menunggu state room.",
      socketConnectionError: (message) =>
        `Gagal terhubung ke server socket (${message || "error tidak diketahui"}). Pastikan server berjalan di port 3001.`,
      roomCode: "Kode Room",
      yourRole: "Role Kamu",
      players: "Pemain",
      phase: "Fase",
      socketSummary: "Ringkasan Socket",
      broadcastPreview: "Preview Broadcast Server",
      nightActions: "Aksi Malam",
      chooseQuietly: "Pilih Diam-Diam",
      nightOnly: "Pilihan malam hanya muncul saat fase night.",
      eliminatedNoNight: "Pemain yang tereliminasi tidak bisa beraksi di malam hari.",
      villagersSleep: "Villager tidur sepanjang malam.",
      inspect: "Periksa",
      attack: "Serang",
      voting: "Voting",
      publicJudgment: "Penghakiman Publik",
      votingAfterDiscussion: "Voting dimulai setelah diskusi 1 menit berakhir.",
      eliminatedCannotVote: "Pemain yang tereliminasi tidak bisa vote.",
      votes: (total) => `${total} vote`,
      narratorChat: "Narator & Chat",
      villageFeed: "Feed Desa",
      chatPlaceholder: "Bagikan kecurigaanmu ke desa...",
      chatDisabled: "Chat dinonaktifkan di luar lobby, diskusi, dan endgame.",
      socketTrace: "Jejak Socket",
      noSocketEvents: "Belum ada event socket.",
    },
    gameAI: {
      eyebrow: "Game AI",
      title: "Segera Hadir",
      copy: "Halaman mode AI belum diaktifkan di project ini.",
    },
  },
};

const phaseLabels = {
  lobby: {
    en: "Lobby",
    id: "Lobi",
  },
  night: {
    en: "Night",
    id: "Malam",
  },
  discussion: {
    en: "Discussion",
    id: "Diskusi",
  },
  voting: {
    en: "Voting",
    id: "Voting",
  },
  ended: {
    en: "Ended",
    id: "Selesai",
  },
};

const statusLabels = {
  lobby: {
    en: "Lobby",
    id: "Lobi",
  },
  playing: {
    en: "Playing",
    id: "Berjalan",
  },
  ended: {
    en: "Ended",
    id: "Selesai",
  },
};

const roleLabels = {
  villager: {
    en: "Villager",
    id: "Warga",
  },
  seer: {
    en: "Seer",
    id: "Peramal",
  },
  werewolf: {
    en: "Werewolf",
    id: "Manusia Serigala",
  },
};

function resolveInitialLanguage() {
  const savedLanguage = localStorage.getItem("language");
  return savedLanguage === "id" ? "id" : "en";
}

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(resolveInitialLanguage);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  function toggleLanguage() {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "id" : "en"));
  }

  function getPhaseLabel(phase) {
    return phaseLabels[phase]?.[language] || phase || "-";
  }

  function getStatusLabel(status) {
    return statusLabels[status]?.[language] || status || "-";
  }

  function getRoleLabel(role) {
    return roleLabels[role]?.[language] || role || dictionary[language].common.hidden;
  }

  function getDirectionLabel(direction) {
    return dictionary[language].common.directions[direction] || direction;
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        copy: dictionary[language],
        getPhaseLabel,
        getStatusLabel,
        getRoleLabel,
        getDirectionLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
