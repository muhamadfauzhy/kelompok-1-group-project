const { OPENAI_API_KEY, OPENAI_MODEL } = require("../config");

function createOpenAINarrator() {
  async function generate(room, eventName, details, fallbackText) {
    if (!OPENAI_API_KEY) {
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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: "developer",
              content:
                "You narrate Werewolf rounds with concise, atmospheric prose. Stay under 45 words and never reveal hidden roles unless explicitly allowed.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error("OpenAI narration failed:", response.status, await response.text());
        return fallbackText;
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content?.trim() || fallbackText;
    } catch (error) {
      console.error("OpenAI narration error:", error);
      return fallbackText;
    }
  }

  return {
    generate,
  };
}

module.exports = {
  createOpenAINarrator,
};
