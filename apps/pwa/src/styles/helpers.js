import { C, MONO, SANS } from "../theme";

export const barra = (lado) => ({
  flex: 1,
  minHeight: 72,
  background: "transparent",
  color: C.hueso,
  border: "none",
  borderRight: lado === "left" ? `1px solid ${C.linea}` : "none",
  fontFamily: MONO,
  fontSize: 22,
  fontWeight: 600,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
});

export const cuadro = () => ({
  width: 74,
  background: C.sup2,
  color: C.hueso,
  border: `1px solid ${C.linea}`,
  borderRadius: 4,
  fontFamily: MONO,
  fontSize: 28,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
});

export const campo = () => ({
  width: "100%",
  background: C.sup2,
  color: C.hueso,
  border: `1px solid ${C.linea}`,
  borderRadius: 4,
  padding: "14px 12px",
  fontFamily: SANS,
  fontSize: 16,
  boxSizing: "border-box",
});
