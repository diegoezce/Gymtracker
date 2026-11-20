import { C, SANS } from "../theme";

export function Boton({ children, onClick, tono = "neutro", alto = 64, style = {} }) {
  const tonos = {
    neutro: { bg: C.sup2, fg: C.hueso, bd: C.linea },
    fuerte: { bg: C.sodio, fg: "#14120F", bd: C.sodio },
    fantasma: { bg: "transparent", fg: C.gris, bd: C.linea },
  }[tono];
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: alto,
        width: "100%",
        background: tonos.bg,
        color: tonos.fg,
        border: `1px solid ${tonos.bd}`,
        borderRadius: 4,
        fontFamily: SANS,
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: "0.01em",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
