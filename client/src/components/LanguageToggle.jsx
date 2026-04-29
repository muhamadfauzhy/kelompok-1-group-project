import { useContext } from "react";
import { LanguageContext } from "../context/languageContext";

export default function LanguageToggle() {
  const { language, setLanguage, copy } = useContext(LanguageContext);

  return (
    <div className="language-toggle-wrap">
      <span className="language-label">{copy.common.language}</span>
      <div className="language-toggle" role="group" aria-label={copy.common.languageToggleLabel}>
        <button
          type="button"
          className={language === "en" ? "lang-btn active" : "lang-btn"}
          aria-pressed={language === "en"}
          onClick={() => setLanguage("en")}
        >
          {copy.common.englishShort}
        </button>
        <button
          type="button"
          className={language === "id" ? "lang-btn active" : "lang-btn"}
          aria-pressed={language === "id"}
          onClick={() => setLanguage("id")}
        >
          {copy.common.indonesianShort}
        </button>
      </div>
    </div>
  );
}
