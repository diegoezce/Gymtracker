import { useEffect, useRef, useState } from "react";
import { C, MONO, SANS } from "../theme";
import { barra } from "../styles/helpers";
import { fmt } from "../utils/format";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Etiqueta } from "./Etiqueta";
import { Repeticiones } from "./Repeticiones";
import { Boton } from "./Boton";

const R = 54;
const CIRC = 2 * Math.PI * R;

/* ── notificaciones ── */

async function pedirPermiso() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

async function programarNotificacion(finTimestamp) {
  const ok = await pedirPermiso();
  if (!ok || !navigator.serviceWorker) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({
      type: "SCHEDULE_NOTIFICATION",
      tag: "rest-timer",
      title: "¡Terminó el descanso!",
      body: "A moverse. Próxima serie lista.",
      timestamp: finTimestamp,
    });
  } catch (_) {}
}

function cancelarNotificacion() {
  try {
    navigator.serviceWorker?.controller?.postMessage({
      type: "CANCEL_NOTIFICATION",
      tag: "rest-timer",
    });
  } catch (_) {}
}

/* ── timer ── */

function TimerDescanso({ segundos, total, onSaltar }) {
  const progreso = segundos / total;
  const offset = CIRC * (1 - progreso);
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  const urgente = segundos <= 5;
  return (
    <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <Etiqueta>Descansá</Etiqueta>
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx={65} cy={65} r={R} fill="none" stroke={C.linea} strokeWidth={6} />
        <circle
          cx={65} cy={65} r={R} fill="none"
          stroke={urgente ? C.oxido : C.sodio}
          strokeWidth={6}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
        />
        <text x={65} y={68} textAnchor="middle" dominantBaseline="middle"
          fontFamily="ui-monospace, monospace" fontSize={28} fontWeight={700}
          fill={urgente ? C.oxido : C.hueso}>
          {mm}:{ss}
        </text>
      </svg>
      <Boton tono="fantasma" alto={48} onClick={onSaltar}>Saltar descanso</Boton>
    </div>
  );
}

/* ── cardio ── */

function NumStep({ value, onChange, step = 1, min = 0 }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${C.linea}`, borderRadius: 4, overflow: "hidden" }}>
      <button onClick={() => onChange(Math.max(min, value - step))}
        style={{ ...barra("left"), fontSize: 24, fontWeight: 700, color: C.gris }}>−</button>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MONO, fontSize: 48, fontWeight: 700, color: C.sodio, padding: "14px 0" }}>
        {value}
      </div>
      <button onClick={() => onChange(value + step)}
        style={{ ...barra("right"), fontSize: 24, fontWeight: 700, color: C.gris }}>+</button>
    </div>
  );
}

function SesionCardio({ ej, guardarCardio, salir, terminar }) {
  const ultima = ej.historial[ej.historial.length - 1];
  const [duracion, setDuracion] = useState(ultima?.duracion ?? ej.duracionMin);
  const [distancia, setDistancia] = useState(ultima?.distancia ?? ej.distanciaKm ?? 0);
  const trackDist = ej.distanciaKm !== null;

  return (
    <div style={{ padding: "8px 20px 32px" }}>
      <h1 style={{ fontFamily: SANS, fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: C.hueso, margin: "16px 0 4px" }}>
        {ej.nombre}
      </h1>
      <Etiqueta>Cardio · objetivo {ej.duracionMin} min{trackDist ? ` · ${ej.distanciaKm} km` : ""}</Etiqueta>

      <div style={{ marginTop: 28 }}>
        <Etiqueta>Duración (min)</Etiqueta>
        <div style={{ marginTop: 8 }}>
          <NumStep value={duracion} onChange={setDuracion} step={5} min={1} />
        </div>
      </div>

      {trackDist && (
        <div style={{ marginTop: 20 }}>
          <Etiqueta>Distancia (km)</Etiqueta>
          <div style={{ marginTop: 8, display: "flex", border: `1px solid ${C.linea}`, borderRadius: 4, overflow: "hidden" }}>
            <button onClick={() => setDistancia((d) => Math.max(0, Math.round((d - 0.5) * 10) / 10))}
              style={{ ...barra("left"), fontSize: 24, fontWeight: 700, color: C.gris }}>−</button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: MONO, fontSize: 48, fontWeight: 700, color: C.sodio, padding: "14px 0" }}>
              {(distancia ?? 0).toFixed(1)}
            </div>
            <button onClick={() => setDistancia((d) => Math.round(((d ?? 0) + 0.5) * 10) / 10)}
              style={{ ...barra("right"), fontSize: 24, fontWeight: 700, color: C.gris }}>+</button>
          </div>
        </div>
      )}

      {ultima && (
        <div style={{ marginTop: 20, padding: "12px 14px", background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4 }}>
          <Etiqueta>Última sesión ({ultima.fecha})</Etiqueta>
          <div style={{ fontFamily: MONO, fontSize: 15, color: C.hueso, marginTop: 6 }}>
            {ultima.duracion} min{ultima.distancia != null ? ` · ${Number(ultima.distancia).toFixed(1)} km` : ""}
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <Boton tono="fuerte" alto={54} onClick={() => guardarCardio(duracion, trackDist ? distancia : null)}>
          Registrar
        </Boton>
      </div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <Boton tono="fantasma" alto={48} onClick={salir}>Volver al menú del día</Boton>
        <Boton tono="fantasma" alto={44} onClick={terminar} style={{ opacity: 0.5 }}>Terminar sesión</Boton>
      </div>
    </div>
  );
}

/* ── sesión principal ── */

export function Sesion({ dia, ej, sesion, setSesion, guardarSerie, guardarCardio, salir, terminar }) {
  // Timestamp-based timer: more reliable than countdown-by-1 when tab is backgrounded.
  // timerFin = absolute ms when rest ends; timerSeg = display value recalculated from Date.now().
  const [timerFin, setTimerFin] = useState(null);
  const [timerSeg, setTimerSeg] = useState(null);
  const prevSeg = useRef(null);

  const hayMasSeries = sesion.series.length > 0 && sesion.series.length < ej.series;

  // Start/stop timer when series count changes
  useEffect(() => {
    if (hayMasSeries && ej.descanso) {
      const fin = Date.now() + ej.descanso * 1000;
      setTimerFin(fin);
      setTimerSeg(ej.descanso);
      prevSeg.current = ej.descanso;
      programarNotificacion(fin);
    } else {
      setTimerFin(null);
      setTimerSeg(null);
      prevSeg.current = null;
    }
  }, [sesion.series.length]);

  // Recalculate remaining time from real timestamp every ~500ms
  useEffect(() => {
    if (!timerFin) return;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((timerFin - Date.now()) / 1000));
      if (rem !== prevSeg.current) {
        prevSeg.current = rem;
        setTimerSeg(rem);
        if (rem === 0) {
          navigator.vibrate?.([200, 100, 200]);
          setTimerFin(null);
        } else if (rem === 10 || rem === 5) {
          navigator.vibrate?.(80);
        }
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerFin]);

  // Reset timer when switching exercise
  useEffect(() => {
    cancelarNotificacion();
    setTimerFin(null);
    setTimerSeg(null);
    prevSeg.current = null;
  }, [ej.id]);

  const saltarTimer = () => {
    cancelarNotificacion();
    setTimerFin(null);
    setTimerSeg(null);
    prevSeg.current = null;
  };

  return (
    <Marco>
      <Cabecera izq={`${dia.nombre} · ${sesion.ejIdx + 1}/${dia.ejercicios.length}`} onSalir={salir} />
      {ej.tipo === "cardio" ? (
        <SesionCardio ej={ej} guardarCardio={guardarCardio} salir={salir} terminar={terminar} />
      ) : (
        <div style={{ padding: "8px 20px 32px" }}>
          <h1 style={{ fontFamily: SANS, fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: C.hueso, margin: "16px 0 4px" }}>
            {ej.nombre}
          </h1>
          <Etiqueta>
            Serie {sesion.series.length + 1} de {ej.series} · objetivo{" "}
            {ej.repsMax ? `${ej.repsObjetivo}–${ej.repsMax}` : ej.repsObjetivo} reps
            {ej.descanso ? ` · ${ej.descanso}s descanso` : ""}
          </Etiqueta>

          <div style={{ margin: "28px 0 8px", border: `1px solid ${C.linea}`, borderRadius: 4, overflow: "hidden", background: C.sup }}>
            <div style={{ padding: "22px 0 14px", textAlign: "center" }}>
              <div style={{ fontFamily: MONO, fontSize: 76, fontWeight: 700, letterSpacing: "-0.04em", color: C.sodio, lineHeight: 1 }}>
                {fmt(sesion.pesoActual)}
              </div>
              <div style={{ marginTop: 6 }}><Etiqueta>kilos</Etiqueta></div>
            </div>
            <div style={{ display: "flex", borderTop: `1px solid ${C.linea}` }}>
              <button
                onClick={() => setSesion({ ...sesion, pesoActual: Math.max(0, sesion.pesoActual - ej.incremento) })}
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

          {timerSeg !== null ? (
            <TimerDescanso segundos={timerSeg} total={ej.descanso} onSaltar={saltarTimer} />
          ) : (
            <Repeticiones objetivo={ej.repsObjetivo} onGuardar={guardarSerie} series={sesion.series} />
          )}

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
            <Boton tono="fantasma" alto={48} onClick={salir}>Volver al menú del día</Boton>
            <Boton tono="fantasma" alto={44} onClick={terminar} style={{ opacity: 0.5 }}>Terminar sesión</Boton>
          </div>

          {sesion.series.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Etiqueta>Series de hoy</Etiqueta>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {sesion.series.map((s, i) => (
                  <div key={i} style={{
                    fontFamily: MONO, fontSize: 15, color: C.hueso,
                    background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4,
                    padding: "12px 14px", display: "flex", justifyContent: "space-between",
                  }}>
                    <span style={{ color: C.gris }}>{i + 1}</span>
                    <span>{fmt(s.peso)} kg × {s.reps}</span>
                    <span style={{ color: C.gris }}>RIR {s.rir}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Marco>
  );
}
