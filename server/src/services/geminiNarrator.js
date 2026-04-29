const { GEMINI_API_KEY, GEMINI_MODEL } = require("../config");

function createGeminiNarrator() {
  async function generate(room, eventName, details, fallbackText) {
    if (!GEMINI_API_KEY) {
      return fallbackText;
    }

    const livingPlayers = room.players
      .filter((player) => player.alive)
      .map((player) => player.username)
      .join(", ");

    const prompt = [
      "You are the narrator of an online Werewolf game.",
      "Write one short atmospheric narration in English, maximum 45 words.",
      "Do not reveal hidden roles unless the details explicitly say that revelation is allowed.",
      `Event: ${eventName}`,
      `Room: ${room.code}`,
      `Living players: ${livingPlayers || "none"}`,
      `Details: ${JSON.stringify(details)}`,
    ].join("\n");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error("Gemini narration failed:", response.status, await response.text());
        return fallbackText;
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || fallbackText;
    } catch (error) {
      console.error("Gemini narration error:", error);
      return fallbackText;
    }
  }

  return {
    generate,
  };
}

module.exports = {
  createGeminiNarrator,
};
