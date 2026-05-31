import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

const SETTINGS_KEY = "financeflow.settings.v1";

try {
  const rawSettings = localStorage.getItem(SETTINGS_KEY);
  if (rawSettings) {
    const parsed = JSON.parse(rawSettings);
    document.documentElement.classList.toggle("dark-mode", Boolean(parsed?.dark_mode));
  }
} catch {
  document.documentElement.classList.toggle("dark-mode", false);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
