import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Punto de entrada: monta la aplicación React en el <div id="root">.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
