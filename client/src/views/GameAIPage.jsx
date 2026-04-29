import { useEffect } from "react";
import { useMusicContext } from "../contexts/MusicContext";

export default function GameAIPage() {
  const { setPhaseMusic } = useMusicContext();

  useEffect(() => {
    setPhaseMusic("lobby");
  }, [setPhaseMusic]);

  return (
    <main className="shell">
      <section className="hero-panel">
        <div className="eyebrow">Game AI</div>
        <h1>Coming Soon</h1>
        <p className="hero-copy">Halaman mode AI belum diaktifkan di project ini.</p>
      </section>
    </main>
  );
}
