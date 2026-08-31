import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { fmt, fechaCorta, diasDesdeStr } from "../utils/format";
import { diasDondeAparece } from "../domain/rutina";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";
import { Etiqueta } from "./Etiqueta";
import { DetalleEjercicio } from "./DetalleEjercicio";

function Grafico({ datos, color = C.sodio }) {
  if (!datos.length) return null;
  const W = 300, H = 90;
  const PAD = { t: 12, r: 8, b: 22, l: 40 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const vals = datos.map((d) => d.valor);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const n = datos.length;
  const px = (i) => PAD.l + (n > 1 ? (i / (n - 1)) * iW : iW / 2);
  const py = (v) => PAD.t + iH - ((v - min) / span) * iH;
  const pts = datos.map((d, i) => `${px(i).toFixed(1)},${py(d.valor).toFixed(1)}`).join(" ");
  const r = n > 15 ? 2 : 3.5;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <line x1={PAD.l} y1={PAD.t} x2={W - PAD.r} y2={PAD.t} stroke={C.linea} strokeWidth={0.5} />
      <line x1={PAD.l} y1={PAD.t + iH} x2={W - PAD.r} y2={PAD.t + iH} stroke={C.linea} strokeWidth={0.5} />
      <text x={PAD.l - 4} y={PAD.t + 4} textAnchor="end" fontSize={9} fill={C.gris} fontFamily="monospace">
        {fmt(max)}
      </text>
      {min !== max && (
        <text x={PAD.l - 4} y={PAD.t + iH + 1} textAnchor="end" fontSize={9} fill={C.gris} fontFamily="monospace">
          {fmt(min)}
        </text>
      )}
      <text x={PAD.l} y={H - 4} textAnchor="start" fontSize={9} fill={C.gris} fontFamily="monospace">
        {fechaCorta(datos[0].fecha)}
      </text>
      {n > 1 && (
        <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize={9} fill={C.gris} fontFamily="monospace">
          {fechaCorta(datos[n - 1].fecha)}
        </text>
      )}
      {n > 1 && (
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {datos.map((d, i) => (
        <circle key={i} cx={px(i)} cy={py(d.valor)} r={r} fill={color} />
      ))}
    </svg>
  );
}

const ORDEN_KEY = "gym:progreso:orden";

function pill(activo) {
  return {
    flex: 1,
    padding: "8px 0",
    borderRadius: 4,
    border: `1px solid ${activo ? C.sodio : C.linea}`,
    background: activo ? C.sodio : "none",
    color: activo ? "#14120F" : C.gris,
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  };
}

export function Progreso({ dias, volver, onAgregarHistorial, onEditarHistorial, onEliminarHistorial, onFusionarHistorial }) {
  const [detalleId, setDetalleId] = useState(null);
  const [expandidos, setExpandidos] = useState(new Set());
  const [orden, setOrden] = useState(() => localStorage.getItem(ORDEN_KEY) ?? "reciente");
  const ahora = new Date();

  const cambiarOrden = (v) => {
    setOrden(v);
    localStorage.setItem(ORDEN_KEY, v);
  };

  const alternarExpandido = (id) =>
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Una sesión = una fecha de calendario, sin importar cuántos ejercicios
  // (o días de rutina, si el ejercicio está compartido) se entrenaron ese día.
  const todasFechas = [
    ...new Set(dias.flatMap((d) => d.ejercicios.flatMap((e) => e.historial.map((h) => h.fecha)))),
  ].sort();

  const ultimaFecha = todasFechas[todasFechas.length - 1];

  const estasSemana = todasFechas.filter((f) => (ahora - new Date(f)) / 86400000 < 7).length;

  const esteMes = todasFechas.filter((f) => {
    const d = new Date(f);
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  }).length;

  // Un ejercicio compartido entre días (mismo id) aparece una sola vez acá.
  const vistos = new Set();
  const todosLosEjercicios = dias.flatMap((d) =>
    d.ejercicios
      .filter((e) => {
        if (vistos.has(e.id)) return false;
        vistos.add(e.id);
        return true;
      })
      .map((e) => ({ ...e, diaNombre: diasDondeAparece(dias, e.id).join(" · ") }))
  );
  const ejerciciosConHistorial = todosLosEjercicios.filter((e) => e.historial.length > 0);
  // Sin registros: no tienen gráfico que mostrar, pero igual hay que poder
  // entrar para cargar una sesión a mano (p.ej. historial que se perdió).
  const ejerciciosSinHistorial = todosLosEjercicios.filter((e) => e.historial.length === 0);

  // El historial de cada ejercicio siempre queda ordenado por fecha
  // ascendente (ver agregarEntradaHistorial), así que la última entrada es
  // la sesión más reciente.
  const ejerciciosOrdenados = [...ejerciciosConHistorial].sort((a, b) => {
    if (orden === "alfabetico") return a.nombre.localeCompare(b.nombre);
    const fechaA = a.historial[a.historial.length - 1].fecha;
    const fechaB = b.historial[b.historial.length - 1].fecha;
    return fechaB.localeCompare(fechaA);
  });

  if (detalleId) {
    const ejDetalle = todosLosEjercicios.find((e) => e.id === detalleId);
    return (
      <DetalleEjercicio
        ejercicio={ejDetalle}
        dias={dias}
        onAgregar={(entrada) => onAgregarHistorial(ejDetalle.id, entrada)}
        onEditar={(fecha, cambios) => onEditarHistorial(ejDetalle.id, fecha, cambios)}
        onEliminar={(fecha) => onEliminarHistorial(ejDetalle.id, fecha)}
        onFusionar={(otroId) => onFusionarHistorial(ejDetalle.id, otroId)}
        volver={() => setDetalleId(null)}
      />
    );
  }

  return (
    <Marco>
      <Cabecera izq="Progreso" onSalir={volver} />
      <div style={{ padding: "8px 20px 40px" }}>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Esta semana", valor: estasSemana },
            { label: "Este mes", valor: esteMes },
            { label: "Total", valor: todasFechas.length },
          ].map(({ label, valor }) => (
            <div
              key={label}
              style={{
                background: C.sup,
                border: `1px solid ${C.linea}`,
                borderRadius: 4,
                padding: "14px 10px",
                textAlign: "center",
              }}
            >
              <div
                style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.sodio, lineHeight: 1 }}
              >
                {valor}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.gris, marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>

        {ultimaFecha && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.gris, marginTop: 10, textAlign: "center" }}>
            Última sesión:{" "}
            <span style={{ color: C.hueso }}>{diasDesdeStr(ultimaFecha)}</span>
          </div>
        )}

        {ejerciciosConHistorial.length === 0 && (
          <p style={{ fontFamily: SANS, color: C.gris, fontSize: 15, marginTop: 28 }}>
            Todavía no hay sesiones. Registrá una y acá vas a ver tu progreso.
          </p>
        )}

        {ejerciciosConHistorial.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            <button onClick={() => cambiarOrden("reciente")} style={pill(orden === "reciente")}>
              Más reciente
            </button>
            <button onClick={() => cambiarOrden("alfabetico")} style={pill(orden === "alfabetico")}>
              A-Z
            </button>
          </div>
        )}

        {ejerciciosOrdenados.map((e) => {
          const esCardio = e.tipo === "cardio";
          const expandido = expandidos.has(e.id);

          const cabecera = (
            <button
              onClick={() => alternarExpandido(e.id)}
              style={{
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: C.hueso }}>{e.nombre}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: C.gris }}>{e.diaNombre}</span>
                  <span
                    style={{
                      display: "inline-block",
                      color: C.gris,
                      fontSize: 12,
                      transition: "transform 0.15s",
                      transform: expandido ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >
                    ›
                  </span>
                </div>
              </div>
            </button>
          );

          const verYEditar = (
            <button
              onClick={() => setDetalleId(e.id)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                marginTop: 10,
                color: C.sodio,
                fontFamily: SANS,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Ver y editar registros →
            </button>
          );

          if (esCardio) {
            const durData = e.historial.map((h) => ({ fecha: h.fecha, valor: h.duracion ?? 0 }));
            const distData = e.historial
              .filter((h) => h.distancia != null)
              .map((h) => ({ fecha: h.fecha, valor: h.distancia }));
            const maxDur = Math.max(...durData.map((d) => d.valor));
            const ultima = e.historial[e.historial.length - 1];

            return (
              <div key={e.id} style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.linea}` }}>
                {cabecera}
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.gris, marginTop: 4 }}>
                  <span style={{ color: C.sodio, fontWeight: 700 }}>Máx {maxDur} min</span>
                  <span> · {e.historial.length} sesión{e.historial.length !== 1 ? "es" : ""}</span>
                  {ultima && <span> · última {fechaCorta(ultima.fecha)}</span>}
                </div>

                {expandido && (
                  <div style={{ marginTop: 14 }}>
                    <Etiqueta>Duración (min)</Etiqueta>
                    <div style={{ marginTop: 8, background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "12px 8px 4px" }}>
                      <Grafico datos={durData} color={C.sodio} />
                    </div>

                    {distData.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <Etiqueta>Distancia (km)</Etiqueta>
                        <div style={{ marginTop: 8, background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "12px 8px 4px" }}>
                          <Grafico datos={distData} color={C.verde} />
                        </div>
                      </div>
                    )}
                    {verYEditar}
                  </div>
                )}
              </div>
            );
          }

          if (e.tipo === "tiempo") {
            const segData = e.historial.map((h) => ({
              fecha: h.fecha,
              valor: h.series?.length ? Math.max(...h.series.map((s) => s.segundos)) : 0,
            }));
            const maxSeg = Math.max(...segData.map((d) => d.valor));
            const ultima = e.historial[e.historial.length - 1];

            return (
              <div key={e.id} style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.linea}` }}>
                {cabecera}
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.gris, marginTop: 4 }}>
                  <span style={{ color: C.sodio, fontWeight: 700 }}>Máx {maxSeg}s</span>
                  <span> · {e.historial.length} sesión{e.historial.length !== 1 ? "es" : ""}</span>
                  {ultima && <span> · última {fechaCorta(ultima.fecha)}</span>}
                </div>

                {expandido && (
                  <div style={{ marginTop: 14 }}>
                    <Etiqueta>Segundos máximos</Etiqueta>
                    <div style={{ marginTop: 8, background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "12px 8px 4px" }}>
                      <Grafico datos={segData} color={C.sodio} />
                    </div>
                    {verYEditar}
                  </div>
                )}
              </div>
            );
          }

          const pesoData = e.historial.map((h) => ({
            fecha: h.fecha,
            valor: h.series?.length ? Math.max(...h.series.map((s) => s.peso)) : 0,
          }));
          const volData = e.historial.map((h) => ({
            fecha: h.fecha,
            valor: h.series?.reduce((sum, s) => sum + s.peso * s.reps, 0) ?? 0,
          }));
          const pr = Math.max(...pesoData.map((d) => d.valor));
          const prFecha = pesoData.find((d) => d.valor === pr)?.fecha;
          const ultima = e.historial[e.historial.length - 1];
          const volUltima = volData[volData.length - 1]?.valor ?? 0;

          return (
            <div key={e.id} style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.linea}` }}>
              {cabecera}
              <div style={{ fontFamily: MONO, fontSize: 13, color: C.gris, marginTop: 4 }}>
                <span style={{ color: C.sodio, fontWeight: 700 }}>PR {fmt(pr)} kg</span>
                {prFecha && <span> · {fechaCorta(prFecha)}</span>}
                <span> · {e.historial.length} sesión{e.historial.length !== 1 ? "es" : ""}</span>
                {ultima && <span> · última {fechaCorta(ultima.fecha)}</span>}
              </div>

              {expandido && (
                <div style={{ marginTop: 14 }}>
                  <Etiqueta>Peso máximo (kg)</Etiqueta>
                  <div style={{ marginTop: 8, background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "12px 8px 4px" }}>
                    <Grafico datos={pesoData} color={C.sodio} />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <Etiqueta>Volumen por sesión (tonelaje)</Etiqueta>
                    <div style={{ marginTop: 8, background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "12px 8px 4px" }}>
                      <Grafico datos={volData} color={C.verde} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 6, textAlign: "right" }}>
                      Última sesión: <span style={{ color: C.hueso }}>{volUltima.toLocaleString("es-AR")} kg</span>
                    </div>
                  </div>
                  {verYEditar}
                </div>
              )}
            </div>
          );
        })}

        {ejerciciosSinHistorial.length > 0 && (
          <div style={{ marginTop: 30, paddingTop: 22, borderTop: `1px solid ${C.linea}` }}>
            <Etiqueta>Sin registros</Etiqueta>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.gris, marginTop: 8, lineHeight: 1.45 }}>
              Todavía no tienen ninguna sesión cargada. Entrá para agregar una a mano.
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {ejerciciosSinHistorial.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setDetalleId(e.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: C.sup,
                    border: `1px solid ${C.linea}`,
                    borderRadius: 4,
                    padding: "12px 14px",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.hueso }}>{e.nombre}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.gris, flexShrink: 0 }}>{e.diaNombre}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 36 }}>
          <Boton tono="fantasma" alto={54} onClick={volver}>
            Volver
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
