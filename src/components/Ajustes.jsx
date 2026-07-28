import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { ejercicio as nuevoEjercicio } from "../domain/rutina";
import { campo } from "../styles/helpers";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Etiqueta } from "./Etiqueta";
import { Boton } from "./Boton";
import {
  TOKEN_KEY,
  SYNC_KEY,
  leerToken,
  obtenerToken,
  pushSesiones,
  construirSesiones,
} from "../sync/hcAdapter";

function SyncPanel({ dias, restaurarDesdeHC }) {
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
      const t = await obtenerToken(usuario, clave);
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
      const data = await pushSesiones(token, construirSesiones(dias));
      const ahora = new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
      localStorage.setItem(SYNC_KEY, ahora);
      setEstado("ok");
      setMensaje(
        `${data.count} sesión${data.count !== 1 ? "es" : ""} sincronizada${data.count !== 1 ? "s" : ""}.`
      );
    } catch (e) {
      if (e.message === "401") {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setEstado("error");
        setMensaje("Token expirado. Volvé a conectarte.");
      } else {
        setEstado("error");
        setMensaje(e.message);
      }
    }
  }

  async function restaurar() {
    setEstado("cargando");
    setMensaje("");
    try {
      const count = await restaurarDesdeHC();
      setEstado("ok");
      setMensaje(`Restaurado: ${count} sesión${count !== 1 ? "es" : ""} recuperada${count !== 1 ? "s" : ""}.`);
    } catch (e) {
      if (e.message === "401") {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
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
      <div style={{ fontFamily: SANS, fontSize: 17, fontWeight: 700, color: C.hueso, marginBottom: 14 }}>
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
          <Boton
            tono="fantasma"
            alto={48}
            onClick={restaurar}
            style={{ opacity: estado === "cargando" ? 0.5 : 1 }}
          >
            Restaurar desde HC
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
            fontSize: 16,
            color: estado === "error" ? C.oxido : C.verde,
          }}
        >
          {mensaje}
        </div>
      )}
    </div>
  );
}

export function Ajustes({ dias, setDias, restaurarDesdeHC, volver }) {
  const editar = (diaId, ejId, campoNombre, valor) =>
    setDias(
      dias.map((d) =>
        d.id !== diaId
          ? d
          : { ...d, ejercicios: d.ejercicios.map((e) => (e.id !== ejId ? e : { ...e, [campoNombre]: valor })) }
      )
    );

  const agregarEjercicio = (diaId) =>
    setDias(
      dias.map((d) =>
        d.id !== diaId
          ? d
          : { ...d, ejercicios: [...d.ejercicios, nuevoEjercicio("Nuevo ejercicio", 20)] }
      )
    );

  const quitarEjercicio = (diaId, ejId) =>
    setDias(
      dias.map((d) =>
        d.id !== diaId
          ? d
          : { ...d, ejercicios: d.ejercicios.filter((e) => e.id !== ejId) }
      )
    );

  const moverEjercicio = (diaOrigenId, ejId, diaDestinoId) => {
    if (diaOrigenId === diaDestinoId) return;
    const ej = dias.find((d) => d.id === diaOrigenId)?.ejercicios.find((e) => e.id === ejId);
    if (!ej) return;
    setDias(
      dias.map((d) => {
        if (d.id === diaOrigenId) return { ...d, ejercicios: d.ejercicios.filter((e) => e.id !== ejId) };
        if (d.id === diaDestinoId) return { ...d, ejercicios: [...d.ejercicios, ej] };
        return d;
      })
    );
  };

  return (
    <Marco>
      <Cabecera izq="Ajustes" onSalir={volver} />
      <div style={{ padding: "8px 20px 40px" }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 16,
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
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={e.nombre}
                    onChange={(ev) => editar(d.id, e.id, "nombre", ev.target.value)}
                    style={{ ...campo(), flex: 1 }}
                  />
                  <button
                    onClick={() => quitarEjercicio(d.id, e.id)}
                    style={{
                      background: "none",
                      border: `1px solid ${C.linea}`,
                      borderRadius: 4,
                      color: C.oxido,
                      fontFamily: MONO,
                      fontSize: 20,
                      width: 44,
                      height: 44,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    −
                  </button>
                </div>
                {dias.length > 1 && (
                  <div style={{ marginTop: 6 }}>
                    <Etiqueta>Mover a</Etiqueta>
                    <select
                      value={d.id}
                      onChange={(ev) => moverEjercicio(d.id, e.id, ev.target.value)}
                      style={{
                        ...campo(),
                        marginTop: 4,
                        fontFamily: SANS,
                        fontSize: 16,
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      {dias.map((dx) => (
                        <option key={dx.id} value={dx.id}>
                          {dx.nombre}{dx.id === d.id ? " (actual)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {[
                    ["peso", "kg"],
                    ["series", "series"],
                    ["incremento", "salto"],
                    ["descanso", "desc (s)"],
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
            <button
              onClick={() => agregarEjercicio(d.id)}
              style={{
                width: "100%",
                background: "none",
                border: `1px dashed ${C.linea}`,
                borderRadius: 4,
                color: C.gris,
                fontFamily: SANS,
                fontSize: 16,
                padding: "12px 0",
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              + Agregar ejercicio
            </button>
          </div>
        ))}

        <SyncPanel dias={dias} restaurarDesdeHC={restaurarDesdeHC} />

        <div style={{ marginTop: 24 }}>
          <Boton tono="fantasma" alto={54} onClick={volver}>
            Listo
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
