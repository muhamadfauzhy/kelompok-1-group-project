import { useState, useRef, useEffect } from "react";
import { useGame } from "../context/GameContext";

export default function Chat({ emit }) {
  const [input, setInput] = useState("");
  const { chatMessages, roomCode, socket, room } = useGame();
  const bottomRef = useRef(null);

  const me = room?.players?.find((p) => p.id === socket?.id);
  const isAlive = me?.alive ?? true;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const send = () => {
    const msg = input.trim();
    if (!msg || !isAlive) return;
    emit("chat_message", { code: roomCode, message: msg });
    setInput("");
  };

  return (
    <div className='chat-panel'>
      <div className='chat-header'>💬 Village Chat</div>

      <div className='chat-messages'>
        {chatMessages.length === 0 && (
          <p className='chat-empty'>No messages yet. Start the discussion!</p>
        )}
        {chatMessages.map((msg) => {
          const isMe = msg.senderId === socket?.id;
          return (
            <div
              key={`${msg.timestamp}-${msg.senderId}`}
              className={`chat-msg ${isMe ? "mine" : ""}`}
            >
              {!isMe && <span className='chat-sender'>{msg.senderName}</span>}
              <span className='chat-text'>{msg.message}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className='chat-input-row'>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={
            isAlive
              ? "Say something to the village..."
              : "☠️ Eliminated — cannot chat"
          }
          disabled={!isAlive}
        />
        <button className='btn-send' onClick={send} disabled={!isAlive}>
          ↑
        </button>
      </div>
    </div>
  );
}
