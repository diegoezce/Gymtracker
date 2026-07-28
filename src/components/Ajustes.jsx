import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { campo } from "../styles/helpers";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Etiqueta } from "./Etiqueta";
import { Boton } from "./Boton";

const HC_URL = "https://hc.sparkio.me";
const TOKEN_KEY = "gym:hc:token";
const SYNC_KEY = "gym:hc:ultima-sync";

function leerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function construirSesiones(dias) {
  const sesiones = [];
  dias.forEach((dia) => {
    const fechas = [...new Set(dia.ejercicios.flatMap((e) => e.historial.map((h) => h.fecha)))];
    fechas.forEach((fecha) => {
      const ejercicios = dia.ejercicios
        .map((e) => {
          const entrada = e.historial.find((h) => h.fecha === fecha);
          return entrada ? { nombre: e.nombre, series: entrada.series } : null;
        })
        .filter(Boolean);
      const volumen_kg = ejercicios.reduce(
        (sum, e) => sum + e.series.reduce((s, serie) => s + serie.peso * serie.reps, 0),
        0
      );
      sesiones.push({ fecha, dia: dia.nombre, ejercicios, volumen_kg, duracion_min: null });
    });
  });
  return sesiones.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function SyncPanel({ dias }) {
  const [token, setToken] = useState(leerToken);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | cargando | ok | error
  const [mensaje, setMensaje] = useState("");
  const ultimaSync = localStorage.getItem(SYNC_KEY);

  async function conectar() {
    setEstado("cargando");
    setMensaje("");
    try {
      const res = await fetch(`${HC_URL}/api/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usuario, password: clave }),
      });
      if (!res.ok) throw new Error("Credenciales incorrectas");
      const data = await res.json();
      const t = data.token ?? data.access ?? data.key;
      if (!t) throw new Error("No se recibió token");
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setUsuario("");
      setClave("");
      setEstado("ok");
      setMensaje("Conectado.");
    } catch (e) {
      setEstado("error");
      setMensaje(e.message);
    }
  }

  async function sincronizar() {
    setEstado("cargando");
    setMensaje("");
    try {
      const sesiones = construirSesiones(dias);
      const res = await fetch(`${HC_URL}/api/gymtracker/sync/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ sesiones }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          throw new Error("Token expirado. Volvé a conectarte.");
        }
        throw new Error(`Error ${res.status}`);
      }
      const data = await res.json();
      const ahora = new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
      localStorage.setItem(SYNC_KEY, ahora);
      setEstado("ok");
      setMensaje(`${data.count} sesión${data.count !== 1 ? "es" : ""} sincronizada${data.count !== 1 ? "s" : ""}.`);
    } catch (e) {
      setEstado("error");
      setMensaje(e.message);
    }
  }

  function desconectar() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SYNC_KEY);
    setToken(null);
    setEstado("idle");
    setMensaje("");
  }

  return (
    <div style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${C.linea}` }}>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 17,
          fontWeight: 700,
          color: C.hueso,
          marginBottom: 14,
        }}
      >
        Health Monitor
      </div>

      {!token ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoCapitalize="none"
            style={campo()}
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            style={campo()}
          />
          <div style={{ marginTop: 4 }}>
            <Boton
              tono={estado === "cargando" ? "neutro" : "fuerte"}
              alto={54}
              onClick={conectar}
              style={{ opacity: estado === "cargando" ? 0.5 : 1 }}
            >
              {estado === "cargando" ? "Conectando…" : "Conectar"}
            </Boton>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ultimaSync && (
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris }}>
              Última sync: <span style={{ color: C.hueso }}>{ultimaSync}</span>
            </div>
          )}
          <Boton
            tono={estado === "cargando" ? "neutro" : "fuerte"}
            alto={54}
            onClick={sincronizar}
            style={{ opacity: estado === "cargando" ? 0.5 : 1 }}
          >
            {estado === "cargando" ? "Sincronizando…" : "Sincronizar ahora"}
          </Boton>
          <button
            onClick={desconectar}
            style={{
              background: "none",
              border: "none",
              color: C.gris,
              fontFamily: SANS,
              fontSize: 13,
              cursor: "pointer",
              textAlign: "left",
              padding: 0,
              marginTop: 2,
            }}
          >
            Desconectar cuenta
          </button>
        </div>
      )}

      {mensaje && (
        <div
          style={{
            marginTop: 12,
            fontFamily: SANS,
            fontSize: 14,
            color: estado === "error" ? C.oxido : C.verde,
          }}
        >
          {mensaje}
        </div>
      )}
    </div>
  );
}

export function Ajustes({ dias, setDias, volver }) {
  const editar = (diaId, ejId, campoNombre, valor) =>
    setDias(
      dias.map((d) =>
        d.id !== diaId
          ? d
          : {
              ...d,
              ejercicios: d.ejercicios.map((e) =>
                e.id !== ejId ? e : { ...e, [campoNombre]: valor }
              ),
            }
      )
    );

  return (
    <Marco>
      <Cabecera izq="Ajustes" onSalir={volver} />
      <div style={{ padding: "8px 20px 40px" }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: C.gris,
            lineHeight: 1.5,
            margin: "12px 0 24px",
          }}
        >
          Cambiá los nombres por tus ejercicios reales. El peso inicial es solo el punto de
          partida — después lo maneja la app.
        </p>
        {dias.map((d) => (
          <div key={d.id} style={{ marginBottom: 28 }}>
            <input
              value={d.nombre}
              onChange={(e) =>
                setDias(dias.map((x) => (x.id === d.id ? { ...x, nombre: e.target.value } : x)))
              }
              style={{ ...campo(), fontSize: 20, fontWeight: 700, marginBottom: 10 }}
            />
            {d.ejercicios.map((e) => (
              <div
                key={e.id}
                style={{
                  background: C.sup,
                  border: `1px solid ${C.linea}`,
                  borderRadius: 4,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <input
                  value={e.nombre}
                  onChange={(ev) => editar(d.id, e.id, "nombre", ev.target.value)}
                  style={campo()}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {[
                    ["peso", "kg"],
                    ["series", "series"],
                    ["incremento", "salto"],
                  ].map(([k, lab]) => (
                    <div key={k} style={{ flex: 1 }}>
                      <Etiqueta>{lab}</Etiqueta>
                      <input
                        type="number"
                        step="0.5"
                        value={e[k]}
                        onChange={(ev) =>
                          editar(d.id, e.id, k, Math.max(0, Number(ev.target.value) || 0))
                        }
                        style={{ ...campo(), marginTop: 4, fontFamily: MONO }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <SyncPanel dias={dias} />

        <div style={{ marginTop: 24 }}>
          <Boton tono="fantasma" alto={54} onClick={volver}>
            Listo
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
