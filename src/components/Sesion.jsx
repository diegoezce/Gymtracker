import { useEffect, useState } from "react";
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

function NumStep({ value, onChange, step = 1, min = 0 }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${C.linea}`, borderRadius: 4, overflow: "hidden" }}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        style={{ ...barra("left"), fontSize: 24, fontWeight: 700, color: C.gris }}
      >−</button>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MONO, fontSize: 48, fontWeight: 700, color: C.sodio, padding: "14px 0" }}>
        {value}
      </div>
      <button
        onClick={() => onChange(value + step)}
        style={{ ...barra("right"), fontSize: 24, fontWeight: 700, color: C.gris }}
      >+</button>
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
              {distancia.toFixed(1)}
            </div>
            <button onClick={() => setDistancia((d) => Math.round((d + 0.5) * 10) / 10)}
              style={{ ...barra("right"), fontSize: 24, fontWeight: 700, color: C.gris }}>+</button>
          </div>
        </div>
      )}

      {ultima && (
        <div style={{ marginTop: 20, padding: "12px 14px", background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4 }}>
          <Etiqueta>Última sesión ({ultima.fecha})</Etiqueta>
          <div style={{ fontFamily: MONO, fontSize: 15, color: C.hueso, marginTop: 6 }}>
            {ultima.duracion} min{ultima.distancia != null ? ` · ${ultima.distancia.toFixed(1)} km` : ""}
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

export function Sesion({ dia, ej, sesion, setSesion, guardarSerie, guardarCardio, salir, terminar }) {
  const [timerSeg, setTimerSeg] = useState(null);
  const serieNum = sesion.series.length + 1;
  const hayMasSeries = sesion.series.length > 0 && sesion.series.length < ej.series;

  useEffect(() => {
    if (hayMasSeries && ej.descanso) {
      setTimerSeg(ej.descanso);
    } else {
      setTimerSeg(null);
    }
  }, [sesion.series.length]);

  useEffect(() => {
    if (timerSeg === null) return;
    if (timerSeg === 0) {
      navigator.vibrate?.([200, 100, 200]);
      setTimerSeg(null);
      return;
    }
    if (timerSeg === 10 || timerSeg === 5) navigator.vibrate?.(80);
    const id = setTimeout(() => setTimerSeg((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timerSeg]);

  useEffect(() => { setTimerSeg(null); }, [ej.id]);

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
            Serie {serieNum} de {ej.series} · objetivo{" "}
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
            <TimerDescanso segundos={timerSeg} total={ej.descanso} onSaltar={() => setTimerSeg(null)} />
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
