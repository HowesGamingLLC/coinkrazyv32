import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Initialize CoinKrazy.com application
const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

console.log("✅ CoinKrazy.com initialized - " + new Date().toISOString());

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept();
}
