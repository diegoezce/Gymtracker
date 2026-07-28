import { C, MONO, SANS } from "../theme";
import { barra } from "../styles/helpers";
import { fmt } from "../utils/format";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Etiqueta } from "./Etiqueta";
import { Repeticiones } from "./Repeticiones";

export function Sesion({ dia, ej, sesion, setSesion, guardarSerie, salir }) {
  const serieNum = sesion.series.length + 1;
  return (
    <Marco>
      <Cabecera izq={`${dia.nombre} · ${sesion.idx + 1}/${dia.ejercicios.length}`} onSalir={salir} />
      <div style={{ padding: "8px 20px 32px" }}>
        <h1
          style={{
            fontFamily: SANS,
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1.1,
            color: C.hueso,
            margin: "16px 0 4px",
          }}
        >
          {ej.nombre}
        </h1>
        <Etiqueta>
          Serie {serieNum} de {ej.series} · objetivo {ej.repsObjetivo} reps
        </Etiqueta>

        {/* firma: el peso como número estampado, ajustable con barras anchas */}
        <div
          style={{
            margin: "28px 0 8px",
            border: `1px solid ${C.linea}`,
            borderRadius: 4,
            overflow: "hidden",
            background: C.sup,
          }}
        >
          <div style={{ padding: "22px 0 14px", textAlign: "center" }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 76,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: C.sodio,
                lineHeight: 1,
              }}
            >
              {fmt(sesion.pesoActual)}
            </div>
            <div style={{ marginTop: 6 }}>
              <Etiqueta>kilos</Etiqueta>
            </div>
          </div>
          <div style={{ display: "flex", borderTop: `1px solid ${C.linea}` }}>
            <button
              onClick={() =>
                setSesion({
                  ...sesion,
                  pesoActual: Math.max(0, sesion.pesoActual - ej.incremento),
                })
              }
              style={barra("left")}
            >
              −{fmt(ej.incremento)}
            </button>
            <button
              onClick={() => setSesion({ ...sesion, pesoActual: sesion.pesoActual + ej.incremento })}
              style={barra("right")}
            >
              +{fmt(ej.incremento)}
            </button>
          </div>
        </div>

        <Repeticiones objetivo={ej.repsObjetivo} onGuardar={guardarSerie} series={sesion.series} />

        {sesion.series.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Etiqueta>Series de hoy</Etiqueta>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {sesion.series.map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: MONO,
                    fontSize: 15,
                    color: C.hueso,
                    background: C.sup,
                    border: `1px solid ${C.linea}`,
                    borderRadius: 4,
                    padding: "12px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: C.gris }}>{i + 1}</span>
                  <span>
                    {fmt(s.peso)} kg × {s.reps}
                  </span>
                  <span style={{ color: C.gris }}>RIR {s.rir}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Marco>
  );
}
