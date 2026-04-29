import { io } from "socket.io-client";

const browserHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const socketUrl = import.meta.env.VITE_SOCKET_URL || `http://${browserHost}:3001`;

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket"],
});
