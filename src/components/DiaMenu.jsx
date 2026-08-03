import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { fmt, diasDesdeStr } from "../utils/format";
import { ejerciciosVinculables } from "../domain/rutina";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";
import { SelectorEjercicio } from "./SelectorEjercicio";

export function DiaMenu({ dia, dias, hechos, progreso = {}, onEjercicio, onTerminar, onAgregarEjercicio }) {
  const [agregando, setAgregando] = useState(false);
  const total = dia.ejercicios.length;
  const doneCount = Object.keys(hechos).length;

  if (agregando) {
    return (
      <SelectorEjercicio
        candidatos={ejerciciosVinculables(dias, dia.id)}
        onSeleccionar={(ej) => {
          onAgregarEjercicio(ej);
          setAgregando(false);
        }}
        onCrearNuevo={(ej) => {
          onAgregarEjercicio(ej);
          setAgregando(false);
        }}
        volver={() => setAgregando(false)}
      />
    );
  }

  return (
    <Marco>
      <Cabecera izq={`${dia.nombre} · ${doneCount}/${total}`} onSalir={onTerminar} />
      <div style={{ padding: "8px 20px 40px" }}>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {dia.ejercicios.map((e, idx) => {
            const hecho = !!hechos[e.id];
            const parcial = !hecho && progreso[e.id]?.series?.length > 0 ? progreso[e.id] : null;
            const ultima = e.historial[e.historial.length - 1];
            return (
              <button
                key={e.id}
                onClick={() => !hecho && onEjercicio(idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: C.sup,
                  border: `1px solid ${hecho ? C.verde : parcial ? C.sodio : C.linea}`,
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
                  ) : parcial ? (
                    <span style={{ fontFamily: MONO, fontSize: 13, color: C.sodio }}>
                      {parcial.series.length}/{e.series}
                    </span>
                  ) : e.tipo === "cardio" ? (
                    <span style={{ fontFamily: MONO, fontSize: 13, color: C.gris }}>
                      {e.duracionMin} min
                    </span>
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 13, color: C.gris }}>
                      {fmt(e.peso)} kg
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: parcial ? C.sodio : C.gris, marginTop: 4 }}>
                  {e.tipo === "cardio"
                    ? `Cardio${e.distanciaKm ? ` · ${e.distanciaKm} km` : ""}`
                    : parcial
                    ? `${parcial.series.length} de ${e.series} series hechas`
                    : `${e.series} × ${e.repsMax ? `${e.repsMin}–${e.repsMax}` : e.repsObjetivo} reps${e.descanso ? ` · ${e.descanso}s` : ""}`}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.gris, marginTop: 3, opacity: 0.75 }}>
                  {ultima ? `última vez: ${diasDesdeStr(ultima.fecha)}` : "todavía no hecho"}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setAgregando(true)}
            style={{
              width: "100%",
              background: "none",
              border: `1px dashed ${C.linea}`,
              borderRadius: 6,
              color: C.gris,
              fontFamily: SANS,
              fontSize: 14,
              padding: "13px 0",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            + Agregar ejercicio
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <Boton tono="fantasma" alto={54} onClick={onTerminar}>
            Terminar sesión
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
