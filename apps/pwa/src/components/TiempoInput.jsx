import { useEffect, useState } from "react";
import { C, MONO } from "../theme";
import { cuadro } from "../styles/helpers";
import { Etiqueta } from "./Etiqueta";
import { Boton } from "./Boton";

// Análogo a Repeticiones.jsx pero para series por tiempo: sin RIR, la
// señal de progresión ya es el segundo logueado contra el objetivo.
export function TiempoInput({ objetivo, onGuardar, series }) {
  const [segundos, setSegundos] = useState(objetivo);
  useEffect(() => {
    setSegundos(objetivo);
  }, [objetivo, series.length]);

  return (
    <div style={{ marginTop: 26 }}>
      <Etiqueta>Segundos sostenidos</Etiqueta>
      <div style={{ display: "flex", alignItems: "stretch", gap: 10, marginTop: 10 }}>
        <button onClick={() => setSegundos((s) => Math.max(5, s - 5))} style={cuadro()}>
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
          {segundos}
        </div>
        <button onClick={() => setSegundos((s) => s + 5)} style={cuadro()}>
          +
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <Boton tono="fuerte" alto={68} onClick={() => onGuardar(segundos)}>
          Guardar serie
        </Boton>
      </div>
    </div>
  );
}
