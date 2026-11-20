import { C, MONO, SANS } from "../theme";
import { fmt, fechaCorta } from "../utils/format";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Etiqueta } from "./Etiqueta";
import { Boton } from "./Boton";

function Tarjeta({ valor, label }) {
  return (
    <div style={{ background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "14px 10px", textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: C.sodio, lineHeight: 1 }}>{valor}</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: C.gris, marginTop: 5 }}>{label}</div>
    </div>
  );
}

// Un logro es un avance concreto contra el historial: un PR, más kilos o
// más reps que la vez pasada. Si no hubo ninguno tampoco se inventa nada.
function Logro({ logro }) {
  return (
    <div style={{ background: C.sup, border: `1px solid ${C.sodio}`, borderRadius: 4, padding: "10px 12px" }}>
      <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.sodio }}>
        {logro.texto}
        {logro.detalle && <span style={{ color: C.gris, fontWeight: 400 }}> · {logro.detalle}</span>}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: C.gris, marginTop: 3 }}>{logro.ejercicio}</div>
    </div>
  );
}

function detalleEjercicio(e) {
  if (e.tipo === "cardio") {
    return `${e.duracion} min${e.distancia != null ? ` · ${Number(e.distancia).toFixed(1)} km` : ""}`;
  }
  if (e.tipo === "tiempo") {
    return e.series.map((s) => `${s.segundos}s`).join("  ");
  }
  return e.series.map((s) => `${fmt(s.peso)}×${s.reps}`).join("  ");
}

export function Resumen({ resumen, volver }) {
  const { totales, ejercicios, logros, fecha } = resumen;

  return (
    <Marco>
      <Cabecera izq="Resumen" onSalir={volver} />
      <div style={{ padding: "8px 20px 40px" }}>
        <h1 style={{ fontFamily: SANS, fontSize: 26, fontWeight: 700, color: C.hueso, margin: "16px 0 2px" }}>
          Sesión terminada
        </h1>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris }}>{fechaCorta(fecha)}</div>

        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Tarjeta valor={totales.ejercicios} label="Ejercicios" />
          <Tarjeta valor={totales.series} label="Series" />
          <Tarjeta valor={Math.round(totales.volumen).toLocaleString("es-AR")} label="Kg totales" />
        </div>

        {totales.minutosCardio > 0 && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.gris, marginTop: 10, textAlign: "center" }}>
            Cardio: <span style={{ color: C.hueso }}>{totales.minutosCardio} min</span>
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <Etiqueta>Avances de hoy</Etiqueta>
          {logros.length > 0 ? (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {logros.map((l, i) => (
                <Logro key={i} logro={l} />
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.gris, marginTop: 8, lineHeight: 1.5 }}>
              Sin récords hoy — sostener la carga también es progreso.
            </p>
          )}
        </div>

        <div style={{ marginTop: 28 }}>
          <Etiqueta>Lo que hiciste</Etiqueta>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {ejercicios.map((e) => (
              <div key={e.id} style={{ borderTop: `1px solid ${C.linea}`, paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.hueso }}>{e.nombre}</span>
                  {e.volumen > 0 && (
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.gris, flexShrink: 0 }}>
                      {Math.round(e.volumen).toLocaleString("es-AR")} kg
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.gris, marginTop: 3 }}>
                  {detalleEjercicio(e)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <Boton tono="fuerte" alto={54} onClick={volver}>
            Listo
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
