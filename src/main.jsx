import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ActualizarDisponible } from "./components/ActualizarDisponible";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ActualizarDisponible />
    <App />
  </React.StrictMode>
);
