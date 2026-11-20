import { useEffect, useState } from "react";
import { C, MONO, SANS } from "../theme";
import { cuadro } from "../styles/helpers";
import { Etiqueta } from "./Etiqueta";
import { Boton } from "./Boton";

export function Repeticiones({ objetivo, onGuardar, series }) {
  const [reps, setReps] = useState(objetivo);
  const [rir, setRir] = useState(null);
  useEffect(() => {
    setReps(objetivo);
    setRir(null);
  }, [objetivo, series.length]);

  const opciones = [
    { v: 3, t: "3+", d: "sobró" },
    { v: 2, t: "2", d: "cómodo" },
    { v: 1, t: "1", d: "justo" },
    { v: 0, t: "0", d: "al fallo" },
  ];

  return (
    <div style={{ marginTop: 26 }}>
      <Etiqueta>Repeticiones</Etiqueta>
      <div style={{ display: "flex", alignItems: "stretch", gap: 10, marginTop: 10 }}>
        <button onClick={() => setReps(Math.max(1, reps - 1))} style={cuadro()}>
          −
        </button>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.sup,
            border: `1px solid ${C.linea}`,
            borderRadius: 4,
            fontFamily: MONO,
            fontSize: 40,
            fontWeight: 700,
            color: C.hueso,
          }}
        >
          {reps}
        </div>
        <button onClick={() => setReps(reps + 1)} style={cuadro()}>
          +
        </button>
      </div>

      <div style={{ marginTop: 22 }}>
        <Etiqueta>¿Cuánto te sobró?</Etiqueta>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {opciones.map((o) => {
          const activo = rir === o.v;
          return (
            <button
              key={o.v}
              onClick={() => setRir(o.v)}
              style={{
                flex: 1,
                minHeight: 88,
                background: activo ? C.sodio : C.sup,
                color: activo ? "#14120F" : C.hueso,
                border: `1px solid ${activo ? C.sodio : C.linea}`,
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700 }}>{o.t}</span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  opacity: activo ? 0.8 : 0.55,
                }}
              >
                {o.d}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        <Boton
          tono={rir === null ? "neutro" : "fuerte"}
          alto={68}
          onClick={() => rir !== null && onGuardar(reps, rir)}
          style={{ opacity: rir === null ? 0.45 : 1 }}
        >
          Guardar serie
        </Boton>
      </div>
    </div>
  );
}
