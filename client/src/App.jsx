import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import GameAIPage from "./views/GameAIPage";
import GamePage from "./views/GamePage";
import HomePage from "./views/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/game-ai" element={<GameAIPage />} />
      </Routes>
    </BrowserRouter>
  );
}
