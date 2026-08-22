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

export function Progreso({ dias, volver, onEditarHistorial, onEliminarHistorial, onFusionarHistorial }) {
  const [detalleId, setDetalleId] = useState(null);
  const ahora = new Date();

  // Par único (diaId, fecha) = una sesión
  const todasSesiones = [
    ...new Set(
      dias.flatMap((d) => d.ejercicios.flatMap((e) => e.historial.map((h) => `${d.id}::${h.fecha}`)))
    ),
  ].sort();

  const todasFechas = [...new Set(todasSesiones.map((s) => s.split("::")[1]))].sort();
  const ultimaFecha = todasFechas[todasFechas.length - 1];

  const estasSemana = todasSesiones.filter((s) => {
    const f = s.split("::")[1];
    return (ahora - new Date(f)) / 86400000 < 7;
  }).length;

  const esteMes = todasSesiones.filter((s) => {
    const d = new Date(s.split("::")[1]);
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  }).length;

  // Un ejercicio compartido entre días (mismo id) aparece una sola vez acá.
  const vistos = new Set();
  const ejerciciosConHistorial = dias.flatMap((d) =>
    d.ejercicios
      .filter((e) => e.historial.length > 0)
      .filter((e) => {
        if (vistos.has(e.id)) return false;
        vistos.add(e.id);
        return true;
      })
      .map((e) => ({ ...e, diaNombre: diasDondeAparece(dias, e.id).join(" · ") }))
  );

  if (detalleId) {
    const ejDetalle = ejerciciosConHistorial.find((e) => e.id === detalleId);
    return (
      <DetalleEjercicio
        ejercicio={ejDetalle}
        dias={dias}
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
            { label: "Total", valor: todasSesiones.length },
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

        {ejerciciosConHistorial.map((e) => {
          const esCardio = e.tipo === "cardio";

          const cabecera = (
            <div style={{ marginTop: 30, paddingTop: 22, borderTop: `1px solid ${C.linea}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: C.hueso }}>{e.nombre}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.gris }}>{e.diaNombre}</div>
              </div>
              <button
                onClick={() => setDetalleId(e.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginTop: 2,
                  color: C.sodio,
                  fontFamily: SANS,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Ver y editar registros →
              </button>
            </div>
          );

          if (esCardio) {
            const durData = e.historial.map((h) => ({ fecha: h.fecha, valor: h.duracion ?? 0 }));
            const distData = e.historial
              .filter((h) => h.distancia != null)
              .map((h) => ({ fecha: h.fecha, valor: h.distancia }));
            const maxDur = Math.max(...durData.map((d) => d.valor));
            const ultima = e.historial[e.historial.length - 1];

            return (
              <div key={e.id}>
                {cabecera}
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.gris, marginBottom: 14 }}>
                  <span style={{ color: C.sodio, fontWeight: 700 }}>Máx {maxDur} min</span>
                  <span> · {e.historial.length} sesión{e.historial.length !== 1 ? "es" : ""}</span>
                  {ultima && <span> · última {fechaCorta(ultima.fecha)}</span>}
                </div>

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
              <div key={e.id}>
                {cabecera}
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.gris, marginBottom: 14 }}>
                  <span style={{ color: C.sodio, fontWeight: 700 }}>Máx {maxSeg}s</span>
                  <span> · {e.historial.length} sesión{e.historial.length !== 1 ? "es" : ""}</span>
                  {ultima && <span> · última {fechaCorta(ultima.fecha)}</span>}
                </div>

                <Etiqueta>Segundos máximos</Etiqueta>
                <div style={{ marginTop: 8, background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "12px 8px 4px" }}>
                  <Grafico datos={segData} color={C.sodio} />
                </div>
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
          const volUltima = volData[volData.length - 1]?.valor ?? 0;

          return (
            <div key={e.id}>
              {cabecera}
              <div style={{ fontFamily: MONO, fontSize: 13, color: C.gris, marginBottom: 14 }}>
                <span style={{ color: C.sodio, fontWeight: 700 }}>PR {fmt(pr)} kg</span>
                {prFecha && <span> · {fechaCorta(prFecha)}</span>}
                <span> · {e.historial.length} sesión{e.historial.length !== 1 ? "es" : ""}</span>
              </div>

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
            </div>
          );
        })}

        <div style={{ marginTop: 36 }}>
          <Boton tono="fantasma" alto={54} onClick={volver}>
            Volver
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
