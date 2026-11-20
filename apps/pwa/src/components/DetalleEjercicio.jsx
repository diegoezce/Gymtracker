import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { fmt, hoy } from "../utils/format";
import { ejerciciosFusionables } from "../domain/rutina";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";

const DANGER = "#c0392b";

function Label({ children }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 11, color: C.gris, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step = 1, min = 0 }) {
  return (
    <input
      type="number"
      step={step}
      min={min}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Math.max(min, Number(e.target.value)))}
      style={{
        width: "100%",
        background: C.sup2,
        color: C.hueso,
        border: `1px solid ${C.linea}`,
        borderRadius: 4,
        padding: "9px 8px",
        fontFamily: MONO,
        fontSize: 15,
        boxSizing: "border-box",
        textAlign: "center",
        WebkitAppearance: "none",
      }}
    />
  );
}

function DateInput({ value, onChange }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: C.sup2,
        color: C.hueso,
        border: `1px solid ${C.linea}`,
        borderRadius: 4,
        padding: "9px 8px",
        fontFamily: MONO,
        fontSize: 15,
        boxSizing: "border-box",
        colorScheme: "dark",
      }}
    />
  );
}

const SMALL_BTN = {
  background: "none",
  border: `1px solid ${C.linea}`,
  borderRadius: 4,
  color: C.gris,
  fontFamily: SANS,
  fontSize: 13,
  padding: "7px 12px",
  cursor: "pointer",
};

const QUITAR_SERIE_BTN = {
  background: "none",
  border: `1px solid #3a2a2a`,
  borderRadius: 4,
  color: DANGER,
  fontFamily: MONO,
  fontSize: 16,
  width: 34,
  height: 34,
  flexShrink: 0,
  cursor: "pointer",
};

const TARJETA_FUSION = {
  width: "100%",
  textAlign: "left",
  background: C.sup,
  border: `1px solid ${C.linea}`,
  borderRadius: 6,
  padding: "14px 16px",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
};

function resumenEntrada(tipo, h) {
  if (tipo === "cardio") {
    return `${h.duracion} min${h.distancia != null ? ` · ${Number(h.distancia).toFixed(1)} km` : ""}`;
  }
  if (tipo === "tiempo") {
    return h.series.map((s) => `${s.segundos}s`).join("  ");
  }
  return h.series.map((s) => `${fmt(s.peso)}×${s.reps}${s.rir === 0 ? "·fallo" : ` RIR${s.rir}`}`).join("  ");
}

function FormEditor({ tipo, entrada, onGuardar, onCancelar }) {
  const [fecha, setFecha] = useState(entrada.fecha);
  const [series, setSeries] = useState(entrada.series ? entrada.series.map((s) => ({ ...s })) : null);
  const [duracion, setDuracion] = useState(entrada.duracion ?? 0);
  const [distancia, setDistancia] = useState(entrada.distancia ?? null);

  const cambiarSerie = (i, campo, valor) =>
    setSeries(series.map((s, j) => (j === i ? { ...s, [campo]: valor } : s)));

  const agregarSerie = () => {
    const ultima = series[series.length - 1];
    setSeries([...series, tipo === "tiempo" ? { segundos: ultima?.segundos ?? 30 } : { peso: ultima?.peso ?? 0, reps: ultima?.reps ?? 8, rir: 1 }]);
  };

  const quitarSerie = (i) => setSeries(series.filter((_, j) => j !== i));

  const guardar = () => {
    if (!fecha) return;
    if (tipo === "cardio") {
      onGuardar({ fecha, duracion, distancia });
    } else {
      onGuardar({ fecha, series });
    }
  };

  return (
    <div style={{ padding: "12px 14px", background: C.sup2, borderTop: `1px solid ${C.linea}` }}>
      <Label>Fecha</Label>
      <DateInput value={fecha} onChange={setFecha} />

      {tipo === "cardio" ? (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <Label>Duración (min)</Label>
            <NumInput value={duracion} onChange={setDuracion} step={5} min={0} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Distancia (km)</Label>
            <NumInput value={distancia} onChange={setDistancia} step={0.5} min={0} />
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <Label>{tipo === "tiempo" ? "Series (segundos)" : "Series (peso · reps · RIR)"}</Label>
          {series.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-end", marginBottom: 8 }}>
              {tipo === "tiempo" ? (
                <div style={{ flex: 1 }}>
                  <NumInput value={s.segundos} onChange={(v) => cambiarSerie(i, "segundos", v)} step={5} min={0} />
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <NumInput value={s.peso} onChange={(v) => cambiarSerie(i, "peso", v)} step={0.5} min={0} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NumInput value={s.reps} onChange={(v) => cambiarSerie(i, "reps", v)} step={1} min={0} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NumInput value={s.rir} onChange={(v) => cambiarSerie(i, "rir", v)} step={1} min={0} />
                  </div>
                </>
              )}
              {series.length > 1 && (
                <button onClick={() => quitarSerie(i)} style={QUITAR_SERIE_BTN}>×</button>
              )}
            </div>
          ))}
          <button onClick={agregarSerie} style={SMALL_BTN}>+ agregar serie</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onCancelar} style={SMALL_BTN}>Cancelar</button>
        <button onClick={guardar} style={{ ...SMALL_BTN, color: C.sodio, borderColor: C.sodio }} disabled={!fecha}>
          Guardar
        </button>
      </div>
    </div>
  );
}

function FilaHistorial({ tipo, entrada, onEditar, onEliminar }) {
  const [editando, setEditando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);

  return (
    <div style={{ background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 6, marginBottom: 8, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris }}>{entrada.fecha}</div>
          <div style={{ fontFamily: MONO, fontSize: 14, color: C.hueso, marginTop: 3 }}>
            {resumenEntrada(tipo, entrada)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => { setEditando((v) => !v); setConfirmandoBorrar(false); }} style={SMALL_BTN}>
            {editando ? "Cerrar" : "Editar"}
          </button>
          {!confirmandoBorrar ? (
            <button onClick={() => setConfirmandoBorrar(true)} style={{ ...SMALL_BTN, color: DANGER, borderColor: "#3a2a2a" }}>
              Eliminar
            </button>
          ) : null}
        </div>
      </div>

      {confirmandoBorrar && (
        <div style={{ padding: "12px 14px", background: "#2a1a1a", borderTop: `1px solid #3a2a2a` }}>
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.hueso, lineHeight: 1.45 }}>
            ¿Eliminar el registro del {entrada.fecha}? No se puede deshacer.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setConfirmandoBorrar(false)} style={SMALL_BTN}>Cancelar</button>
            <button onClick={() => onEliminar(entrada.fecha)} style={{ ...SMALL_BTN, color: DANGER, borderColor: "#3a2a2a" }}>
              Sí, borrar
            </button>
          </div>
        </div>
      )}

      {editando && (
        <FormEditor
          tipo={tipo}
          entrada={entrada}
          onCancelar={() => setEditando(false)}
          onGuardar={(cambios) => {
            onEditar(entrada.fecha, cambios);
            setEditando(false);
          }}
        />
      )}
    </div>
  );
}

function SelectorFusion({ ejercicio, candidatos, onConfirmar, volver }) {
  const [elegido, setElegido] = useState(null);

  if (elegido) {
    return (
      <Marco>
        <Cabecera izq="Fusionar ejercicios" onSalir={() => setElegido(null)} />
        <div style={{ padding: "8px 20px 40px" }}>
          <div style={{ padding: "14px 16px", background: "#2a1a1a", border: `1px solid #3a2a2a`, borderRadius: 6 }}>
            <div style={{ fontFamily: SANS, fontSize: 14, color: C.hueso, lineHeight: 1.5 }}>
              Se va a fusionar <strong>"{elegido.nombre}"</strong> con <strong>"{ejercicio.nombre}"</strong>.
              El historial de ambos se une y de acá en más todo va a quedar registrado como{" "}
              <strong>"{ejercicio.nombre}"</strong>. No se puede deshacer.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setElegido(null)} style={SMALL_BTN}>Cancelar</button>
              <button
                onClick={() => onConfirmar(elegido.id)}
                style={{ ...SMALL_BTN, color: DANGER, borderColor: "#3a2a2a" }}
              >
                Sí, fusionar
              </button>
            </div>
          </div>
        </div>
      </Marco>
    );
  }

  return (
    <Marco>
      <Cabecera izq="Fusionar con..." onSalir={volver} />
      <div style={{ padding: "8px 20px 40px" }}>
        {candidatos.length === 0 ? (
          <p style={{ fontFamily: SANS, color: C.gris, fontSize: 14, marginTop: 20, lineHeight: 1.5 }}>
            No hay otros ejercicios del mismo tipo todavía para fusionar.
          </p>
        ) : (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {candidatos.map((c) => (
              <button key={c.id} onClick={() => setElegido(c)} style={TARJETA_FUSION}>
                <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: C.hueso }}>{c.nombre}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 4 }}>
                  también en {c.diasDonde.join(", ")}
                </div>
              </button>
            ))}
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <Boton tono="fantasma" alto={54} onClick={volver}>Cancelar</Boton>
        </div>
      </div>
    </Marco>
  );
}

// Entrada en blanco para cargar una sesión a mano, con la forma que
// corresponde al tipo de ejercicio y sembrada con sus objetivos actuales.
function entradaNueva(ej) {
  const fecha = hoy();
  if (ej.tipo === "cardio") {
    return { fecha, duracion: ej.duracionMin ?? 0, distancia: ej.distanciaKm ?? null };
  }
  if (ej.tipo === "tiempo") {
    return { fecha, series: [{ segundos: ej.duracionObjetivo ?? 30 }] };
  }
  return { fecha, series: [{ peso: ej.peso ?? 0, reps: ej.repsObjetivo ?? 8, rir: 1 }] };
}

export function DetalleEjercicio({ ejercicio, dias, onAgregar, onEditar, onEliminar, onFusionar, volver }) {
  const [fusionando, setFusionando] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const historialDesc = [...ejercicio.historial].sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (fusionando) {
    return (
      <SelectorFusion
        ejercicio={ejercicio}
        candidatos={ejerciciosFusionables(dias, ejercicio.id)}
        onConfirmar={(otroId) => {
          onFusionar(otroId);
          setFusionando(false);
        }}
        volver={() => setFusionando(false)}
      />
    );
  }

  return (
    <Marco>
      <Cabecera izq={ejercicio.nombre} onSalir={volver} />
      <div style={{ padding: "8px 20px 40px" }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: C.gris, marginBottom: 18 }}>
          {historialDesc.length} sesión{historialDesc.length !== 1 ? "es" : ""} registrada{historialDesc.length !== 1 ? "s" : ""}.
          Corregí cualquier registro si se cargó mal, eliminalo, o agregá una sesión que falte.
        </div>

        <div style={{ marginBottom: 14 }}>
          {agregando ? (
            <div style={{ background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", fontFamily: SANS, fontSize: 14, color: C.hueso }}>
                Nueva sesión
              </div>
              <FormEditor
                tipo={ejercicio.tipo}
                entrada={entradaNueva(ejercicio)}
                onCancelar={() => setAgregando(false)}
                onGuardar={(entrada) => {
                  onAgregar(entrada);
                  setAgregando(false);
                }}
              />
            </div>
          ) : (
            <button onClick={() => setAgregando(true)} style={{ ...SMALL_BTN, color: C.sodio, borderColor: C.sodio }}>
              + agregar sesión
            </button>
          )}
        </div>

        {historialDesc.map((h) => (
          <FilaHistorial
            key={h.fecha}
            tipo={ejercicio.tipo}
            entrada={h}
            onEditar={onEditar}
            onEliminar={onEliminar}
          />
        ))}

        <div style={{ marginTop: 20 }}>
          <Boton tono="fantasma" alto={48} onClick={() => setFusionando(true)}>
            Fusionar con otro ejercicio...
          </Boton>
        </div>

        <div style={{ marginTop: 12 }}>
          <Boton tono="fantasma" alto={54} onClick={volver}>
            Volver
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
