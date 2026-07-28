import { C, MONO, SANS } from "../theme";
import { fmt } from "../utils/format";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";

export function DiaMenu({ dia, hechos, onEjercicio, onTerminar }) {
  const total = dia.ejercicios.length;
  const doneCount = Object.keys(hechos).length;

  return (
    <Marco>
      <Cabecera izq={`${dia.nombre} · ${doneCount}/${total}`} onSalir={onTerminar} />
      <div style={{ padding: "8px 20px 40px" }}>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {dia.ejercicios.map((e, idx) => {
            const hecho = !!hechos[e.id];
            return (
              <button
                key={e.id}
                onClick={() => !hecho && onEjercicio(idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: hecho ? C.sup : C.sup,
                  border: `1px solid ${hecho ? C.verde : C.linea}`,
                  borderRadius: 4,
                  padding: "16px 18px",
                  cursor: hecho ? "default" : "pointer",
                  WebkitTapHighlightColor: "transparent",
                  opacity: hecho ? 0.55 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: SANS, fontSize: 17, fontWeight: 600, color: C.hueso }}>
                    {e.nombre}
                  </span>
                  {hecho ? (
                    <span style={{ fontFamily: MONO, fontSize: 13, color: C.verde }}>✓</span>
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 13, color: C.gris }}>
                      {fmt(e.peso)} kg
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 4 }}>
                  {e.series} × {e.repsMax ? `${e.repsMin}–${e.repsMax}` : e.repsObjetivo} reps
                  {e.descanso ? ` · ${e.descanso}s` : ""}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 28 }}>
          <Boton tono={doneCount > 0 ? "fuerte" : "fantasma"} alto={54} onClick={onTerminar}>
            {doneCount > 0 ? "Terminar sesión" : "Cancelar"}
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
