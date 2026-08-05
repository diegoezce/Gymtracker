import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { fmt, diasDesdeStr } from "../utils/format";
import { ejerciciosVinculables } from "../domain/rutina";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";
import { SelectorEjercicio } from "./SelectorEjercicio";

// el dato de la derecha nunca se parte en dos líneas: que envuelva el nombre
const ESTADO_DER = { fontFamily: MONO, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 };

const ACCION_BTN = {
  background: "none",
  border: "none",
  color: C.gris,
  fontFamily: MONO,
  fontSize: 18,
  width: 44,
  alignSelf: "stretch",
  cursor: "pointer",
  flexShrink: 0,
  lineHeight: 1,
  WebkitTapHighlightColor: "transparent",
};

export function DiaMenu({
  dia,
  dias,
  hechos,
  progreso = {},
  saltados = {},
  onEjercicio,
  onAlternarSaltado,
  onTerminar,
  onAgregarEjercicio,
}) {
  const [agregando, setAgregando] = useState(false);
  const total = dia.ejercicios.filter((e) => !saltados[e.id]).length;
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
            const saltado = !hecho && !!saltados[e.id];
            const parcial = !hecho && !saltado && progreso[e.id]?.series?.length > 0 ? progreso[e.id] : null;
            const ultima = e.historial[e.historial.length - 1];
            return (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  background: C.sup,
                  border: `1px solid ${hecho ? C.verde : parcial ? C.sodio : C.linea}`,
                  borderRadius: 4,
                  overflow: "hidden",
                  opacity: hecho ? 0.55 : saltado ? 0.4 : 1,
                }}
              >
                <button
                  onClick={() => !hecho && !saltado && onEjercicio(idx)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "16px 4px 16px 18px",
                    cursor: hecho || saltado ? "default" : "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 17,
                        fontWeight: 600,
                        color: C.hueso,
                        textDecoration: saltado ? "line-through" : "none",
                      }}
                    >
                      {e.nombre}
                    </span>
                    {hecho ? (
                      <span style={{ ...ESTADO_DER, color: C.verde }}>✓</span>
                    ) : saltado ? (
                      <span style={{ ...ESTADO_DER, color: C.gris }}>saltado</span>
                    ) : parcial ? (
                      <span style={{ ...ESTADO_DER, color: C.sodio }}>
                        {parcial.series.length}/{e.series}
                      </span>
                    ) : e.tipo === "cardio" ? (
                      <span style={{ ...ESTADO_DER, color: C.gris }}>
                        {e.duracionMin} min
                      </span>
                    ) : e.tipo === "tiempo" ? (
                      <span style={{ ...ESTADO_DER, color: C.gris }}>
                        {e.duracionObjetivo}s
                      </span>
                    ) : (
                      <span style={{ ...ESTADO_DER, color: C.gris }}>
                        {fmt(e.peso)} kg
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: parcial ? C.sodio : C.gris, marginTop: 4 }}>
                    {e.tipo === "cardio"
                      ? `Cardio${e.distanciaKm ? ` · ${e.distanciaKm} km` : ""}`
                      : parcial
                      ? `${parcial.series.length} de ${e.series} series hechas`
                      : e.tipo === "tiempo"
                      ? `${e.series} × ${e.duracionObjetivo}s${e.descanso ? ` · ${e.descanso}s descanso` : ""}`
                      : `${e.series} × ${e.repsMax ? `${e.repsMin}–${e.repsMax}` : e.repsObjetivo} reps${e.descanso ? ` · ${e.descanso}s` : ""}`}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: C.gris, marginTop: 3, opacity: 0.75 }}>
                    {ultima ? `última vez: ${diasDesdeStr(ultima.fecha)}` : "todavía no hecho"}
                  </div>
                </button>

                {!hecho && (
                  <button
                    onClick={() => onAlternarSaltado(e.id)}
                    title={saltado ? "Volver a incluirlo hoy" : "Saltear hoy"}
                    style={ACCION_BTN}
                  >
                    {saltado ? "↺" : "×"}
                  </button>
                )}
              </div>
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
