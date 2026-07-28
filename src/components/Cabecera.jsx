import { C, MONO } from "../theme";
import { Etiqueta } from "./Etiqueta";

export function Cabecera({ izq, onSalir }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 20px 4px",
      }}
    >
      <Etiqueta>{izq}</Etiqueta>
      <button
        onClick={onSalir}
        style={{
          background: "none",
          border: "none",
          color: C.gris,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          cursor: "pointer",
          padding: "8px 0 8px 16px",
        }}
      >
        Salir
      </button>
    </div>
  );
}
