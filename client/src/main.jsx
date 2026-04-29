import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { MusicProvider } from "./contexts/MusicContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <MusicProvider>
    <App />
  </MusicProvider>
);
