import { useContext } from "react";
import { LanguageContext } from "../context/languageContext";

export default function GameAIPage() {
  const { copy } = useContext(LanguageContext);

  return (
    <main className="shell">
      <section className="hero-panel">
        <div className="eyebrow">{copy.gameAI.eyebrow}</div>
        <h1>{copy.gameAI.title}</h1>
        <p className="hero-copy">{copy.gameAI.copy}</p>
      </section>
    </main>
  );
}
