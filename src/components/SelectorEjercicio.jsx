import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { campo } from "../styles/helpers";
import {
  ejercicio as nuevoEjercicioFactory,
  ejercicioCardio as nuevoCardioFactory,
  ejercicioTiempo as nuevoTiempoFactory,
} from "../domain/rutina";
import { fmt } from "../utils/format";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";

const tab = (activo) => ({
  flex: 1,
  background: activo ? C.sodio : "none",
  color: activo ? "#14120F" : C.gris,
  border: `1px solid ${activo ? C.sodio : C.linea}`,
  borderRadius: 6,
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 600,
  padding: "10px 0",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
});

const tarjeta = {
  width: "100%",
  textAlign: "left",
  background: C.sup,
  border: `1px solid ${C.linea}`,
  borderRadius: 6,
  padding: "14px 16px",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
};

// candidatos: salida de ejerciciosVinculables(dias, diaId) — cada uno trae `diasDonde`.
// onSeleccionar(ejExistente) y onCrearNuevo(ejNuevo) delegan en el caller la llamada real
// a agregarEjercicioADia; este componente solo elige/crea.
export function SelectorEjercicio({ candidatos, onSeleccionar, onCrearNuevo, volver }) {
  const [modo, setModo] = useState(candidatos.length > 0 ? "existente" : "nuevo");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("fuerza");

  const crear = () => {
    if (!nombre.trim()) return;
    const ej =
      tipo === "cardio"
        ? nuevoCardioFactory(nombre.trim())
        : tipo === "tiempo"
        ? nuevoTiempoFactory(nombre.trim())
        : nuevoEjercicioFactory(nombre.trim(), 20, 2.5, 3, 8, 12, 90);
    onCrearNuevo(ej);
  };

  return (
    <Marco>
      <Cabecera izq="Agregar ejercicio" onSalir={volver} />
      <div style={{ padding: "8px 20px 40px" }}>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => setModo("existente")} style={tab(modo === "existente")}>
            Usar existente
          </button>
          <button onClick={() => setModo("nuevo")} style={tab(modo === "nuevo")}>
            Nuevo
          </button>
        </div>

        {modo === "existente" ? (
          candidatos.length === 0 ? (
            <p style={{ fontFamily: SANS, color: C.gris, fontSize: 14, marginTop: 20, lineHeight: 1.5 }}>
              No hay otros ejercicios todavía para reusar acá — creá uno nuevo.
            </p>
          ) : (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {candidatos.map((e) => (
                <button key={e.id} onClick={() => onSeleccionar(e)} style={tarjeta}>
                  <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: C.hueso }}>{e.nombre}</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 4 }}>
                    {e.tipo === "cardio"
                      ? "Cardio"
                      : e.tipo === "tiempo"
                      ? `${e.duracionObjetivo}s`
                      : `${fmt(e.peso)} kg`}{" "}
                    · también en {e.diasDonde.join(", ")}
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div style={{ marginTop: 20 }}>
            <input
              value={nombre}
              onChange={(ev) => setNombre(ev.target.value)}
              placeholder="Nombre del ejercicio"
              style={campo()}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setTipo("fuerza")} style={tab(tipo === "fuerza")}>
                Fuerza
              </button>
              <button onClick={() => setTipo("cardio")} style={tab(tipo === "cardio")}>
                Cardio
              </button>
              <button onClick={() => setTipo("tiempo")} style={tab(tipo === "tiempo")}>
                Tiempo
              </button>
            </div>
            <div style={{ marginTop: 20 }}>
              <Boton tono="fuerte" alto={52} onClick={crear} style={{ opacity: nombre.trim() ? 1 : 0.5 }}>
                Crear y agregar
              </Boton>
            </div>
          </div>
        )}
      </div>
    </Marco>
  );
}
