import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const MusicContext = createContext(null);

const MUSIC_BY_PHASE = {
  lobby: "/music/lobby.mp3",
  night: "/music/night.mp3",
  day: "/music/day.mp3",
};

function normalizePhase(phase) {
  if (phase === "night") {
    return "night";
  }

  if (phase === "discussion" || phase === "voting" || phase === "day") {
    return "day";
  }

  return "lobby";
}

export function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const [currentPhase, setCurrentPhase] = useState("lobby");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingAutoplay, setPendingAutoplay] = useState(false);
  const [error, setError] = useState("");

  const stopAudio = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const playTrackForPhase = useCallback(async (targetPhase) => {
    const track = MUSIC_BY_PHASE[targetPhase];
    if (!track) {
      stopAudio();
      return;
    }

    try {
      stopAudio();
      const audio = new Audio(track);
      audio.loop = true;
      audio.preload = "auto";
      audio.onerror = () => {
        setError(`Audio gagal dimuat untuk phase "${targetPhase}".`);
        setIsPlaying(false);
      };

      audioRef.current = audio;
      await audio.play();
      setIsPlaying(true);
      setPendingAutoplay(false);
      setError("");
    } catch (playError) {
      setIsPlaying(false);
      audioRef.current = null;

      const message = String(playError?.message || playError || "");
      if (message.toLowerCase().includes("user")) {
        setPendingAutoplay(true);
        setError("Music menunggu interaksi user sebelum bisa diputar.");
        return;
      }

      setError(`Audio gagal diputar: ${message || "unknown error"}`);
    }
  }, [stopAudio]);

  const enableMusic = useCallback(() => {
    setIsEnabled(true);
    setPendingAutoplay(false);
  }, []);

  const disableMusic = useCallback(() => {
    setIsEnabled(false);
    setPendingAutoplay(false);
    setError("");
    stopAudio();
  }, [stopAudio]);

  const toggleMusic = useCallback(() => {
    if (isEnabled) {
      disableMusic();
      return;
    }

    enableMusic();
  }, [disableMusic, enableMusic, isEnabled]);

  const setPhaseMusic = useCallback((nextPhase) => {
    setCurrentPhase(normalizePhase(nextPhase));
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      stopAudio();
      return;
    }

    void playTrackForPhase(currentPhase);
  }, [currentPhase, isEnabled, playTrackForPhase, stopAudio]);

  useEffect(() => {
    if (!pendingAutoplay) {
      return undefined;
    }

    function unlockAudio() {
      setIsEnabled(true);
      void playTrackForPhase(currentPhase);
    }

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [currentPhase, pendingAutoplay, playTrackForPhase]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const replayCurrentTrack = useCallback(() => {
    return playTrackForPhase(currentPhase);
  }, [currentPhase, playTrackForPhase]);

  const value = useMemo(
    () => ({
      currentPhase,
      currentTrack: MUSIC_BY_PHASE[currentPhase] || "",
      normalizePhase,
      isEnabled,
      isPlaying,
      pendingAutoplay,
      error,
      setPhaseMusic,
      enableMusic,
      disableMusic,
      toggleMusic,
      replayCurrentTrack,
    }),
    [
      currentPhase,
      disableMusic,
      enableMusic,
      error,
      isEnabled,
      isPlaying,
      pendingAutoplay,
      replayCurrentTrack,
      setPhaseMusic,
      toggleMusic,
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusicContext() {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error("useMusicContext must be used within MusicProvider");
  }

  return context;
}
