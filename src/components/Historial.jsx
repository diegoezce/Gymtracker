import { C, MONO, SANS } from "../theme";
import { fmt, fechaCorta } from "../utils/format";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";

export function Historial({ dias, volver }) {
  const todos = dias.flatMap((d) => d.ejercicios);
  return (
    <Marco>
      <Cabecera izq="Historial" onSalir={volver} />
      <div style={{ padding: "8px 20px 40px" }}>
        {todos.every((e) => e.historial.length === 0) && (
          <p style={{ fontFamily: SANS, color: C.gris, fontSize: 15, marginTop: 20 }}>
            Todavía no hay sesiones. Registrá una y acá vas a ver cómo se movió cada carga.
          </p>
        )}
        {todos
          .filter((e) => e.historial.length)
          .map((e) => (
            <div key={e.id} style={{ marginBottom: 26 }}>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 17,
                  fontWeight: 700,
                  color: C.hueso,
                  marginBottom: 8,
                }}
              >
                {e.nombre}
              </div>
              {e.historial
                .slice()
                .reverse()
                .map((h, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: MONO,
                      fontSize: 13,
                      color: C.gris,
                      padding: "8px 0",
                      borderBottom: `1px solid ${C.linea}`,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{fechaCorta(h.fecha)}</span>
                    <span style={{ color: C.hueso }}>
                      {h.series.map((s) => `${fmt(s.peso)}×${s.reps}`).join("  ")}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        <Boton tono="fantasma" alto={54} onClick={volver}>
          Volver
        </Boton>
      </div>
    </Marco>
  );
}
