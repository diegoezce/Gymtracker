import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ActualizarDisponible } from "./components/ActualizarDisponible";
import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ActualizarDisponible />
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
