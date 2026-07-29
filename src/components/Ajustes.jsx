import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { ejercicio as nuevoEjercicio } from "../domain/rutina";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";
import {
  TOKEN_KEY,
  SYNC_KEY,
  AUTOSYNC_KEY,
  leerToken,
  leerAutoSync,
  obtenerToken,
  pushSesiones,
  construirSesiones,
} from "../sync/hcAdapter";

/* ── componentes primitivos ── */

function Label({ children }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 11, color: C.gris, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
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
      onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
      style={{
        width: "100%",
        background: C.sup2,
        color: C.hueso,
        border: `1px solid ${C.linea}`,
        borderRadius: 4,
        padding: "10px 10px",
        fontFamily: MONO,
        fontSize: 16,
        boxSizing: "border-box",
        textAlign: "center",
        WebkitAppearance: "none",
      }}
    />
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "transparent",
        color: C.hueso,
        border: "none",
        borderBottom: `1px solid ${C.linea}`,
        padding: "6px 0",
        fontFamily: SANS,
        fontSize: 17,
        fontWeight: 600,
        boxSizing: "border-box",
        outline: "none",
      }}
    />
  );
}

function Toggle({ activo, onChange }) {
  return (
    <button
      onClick={() => onChange(!activo)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        background: activo ? C.sodio : C.linea,
        border: "none",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: activo ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: activo ? "#14120F" : C.gris,
          transition: "left 0.18s",
        }}
      />
    </button>
  );
}

/* ── tarjeta de ejercicio ── */

function TarjetaEjercicio({ ej, diaId, dias, onEditar, onQuitar, onMover }) {
  const [abierto, setAbierto] = useState(false);
  const e = (campo, valor) => onEditar(diaId, ej.id, campo, valor);

  return (
    <div
      style={{
        background: C.sup,
        border: `1px solid ${C.linea}`,
        borderRadius: 6,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      {/* cabecera de la tarjeta */}
      <div style={{ padding: "14px 14px 10px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <TextInput
            value={ej.nombre}
            onChange={(v) => e("nombre", v)}
            placeholder="Nombre del ejercicio"
          />
        </div>
        <button
          onClick={() => onQuitar(diaId, ej.id)}
          style={{
            background: "none",
            border: `1px solid ${C.linea}`,
            borderRadius: 4,
            color: C.oxido,
            fontFamily: MONO,
            fontSize: 18,
            width: 36,
            height: 36,
            cursor: "pointer",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* fila principal: series · reps · descanso */}
      <div style={{ padding: "0 14px 12px", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8 }}>
        <div>
          <Label>Series</Label>
          <NumInput value={ej.series} onChange={(v) => e("series", v)} min={1} />
        </div>
        <div>
          <Label>Reps (min – max)</Label>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <NumInput value={ej.repsMin} onChange={(v) => { e("repsMin", v); e("repsObjetivo", v); }} min={1} />
            <span style={{ color: C.gris, fontFamily: MONO, flexShrink: 0 }}>–</span>
            <NumInput value={ej.repsMax} onChange={(v) => e("repsMax", v)} min={1} />
          </div>
        </div>
        <div>
          <Label>Descanso</Label>
          <NumInput value={ej.descanso} onChange={(v) => e("descanso", v)} step={15} />
        </div>
      </div>

      {/* avanzado (colapsable) */}
      <button
        onClick={() => setAbierto((a) => !a)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          borderTop: `1px solid ${C.linea}`,
          color: C.gris,
          fontFamily: SANS,
          fontSize: 12,
          padding: "8px 14px",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Peso inicial · incremento{dias.length > 1 ? " · mover" : ""}</span>
        <span>{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div style={{ padding: "12px 14px 14px", borderTop: `1px solid ${C.linea}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <Label>Peso inicial (kg)</Label>
              <NumInput value={ej.peso} onChange={(v) => e("peso", v)} step={2.5} />
            </div>
            <div>
              <Label>Incremento (kg)</Label>
              <NumInput value={ej.incremento} onChange={(v) => e("incremento", v)} step={0.5} min={0.5} />
            </div>
          </div>

          {dias.length > 1 && (
            <div>
              <Label>Mover a otro día</Label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {dias
                  .filter((d) => d.id !== diaId)
                  .map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onMover(diaId, ej.id, d.id)}
                      style={{
                        background: "none",
                        border: `1px solid ${C.linea}`,
                        borderRadius: 4,
                        color: C.gris,
                        fontFamily: SANS,
                        fontSize: 13,
                        padding: "6px 12px",
                        cursor: "pointer",
                      }}
                    >
                      → {d.nombre}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── panel de sync ── */

function SyncPanel({ dias, restaurarDesdeHC }) {
  const [token, setToken] = useState(leerToken);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState("idle");
  const [mensaje, setMensaje] = useState("");
  const [autoSync, setAutoSync] = useState(leerAutoSync);
  const ultimaSync = localStorage.getItem(SYNC_KEY);

  function toggleAutoSync(v) {
    localStorage.setItem(AUTOSYNC_KEY, v ? "1" : "0");
    setAutoSync(v);
  }

  async function conectar() {
    setEstado("cargando"); setMensaje("");
    try {
      const t = await obtenerToken(usuario, clave);
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t); setUsuario(""); setClave("");
      setEstado("ok"); setMensaje("Conectado.");
    } catch (e) { setEstado("error"); setMensaje(e.message); }
  }

  async function sincronizar() {
    setEstado("cargando"); setMensaje("");
    try {
      const data = await pushSesiones(token, construirSesiones(dias));
      const ahora = new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
      localStorage.setItem(SYNC_KEY, ahora);
      setEstado("ok");
      setMensaje(`${data.count} sesión${data.count !== 1 ? "es" : ""} sincronizada${data.count !== 1 ? "s" : ""}.`);
    } catch (e) {
      if (e.message === "401") { localStorage.removeItem(TOKEN_KEY); setToken(null); }
      setEstado("error"); setMensaje(e.message === "401" ? "Token expirado. Volvé a conectarte." : e.message);
    }
  }

  async function restaurar() {
    setEstado("cargando"); setMensaje("");
    try {
      const count = await restaurarDesdeHC();
      setEstado("ok");
      setMensaje(`${count} sesión${count !== 1 ? "es" : ""} recuperada${count !== 1 ? "s" : ""}.`);
    } catch (e) {
      if (e.message === "401") { localStorage.removeItem(TOKEN_KEY); setToken(null); }
      setEstado("error"); setMensaje(e.message);
    }
  }

  function desconectar() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SYNC_KEY);
    setToken(null); setEstado("idle"); setMensaje("");
  }

  const cargando = estado === "cargando";

  return (
    <div style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${C.linea}` }}>
      <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: C.hueso, marginBottom: 16 }}>
        Health Monitor
      </div>

      {!token ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoCapitalize="none"
            style={{ width: "100%", background: C.sup2, color: C.hueso, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "14px 12px", fontFamily: SANS, fontSize: 16, boxSizing: "border-box" }}
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            style={{ width: "100%", background: C.sup2, color: C.hueso, border: `1px solid ${C.linea}`, borderRadius: 4, padding: "14px 12px", fontFamily: SANS, fontSize: 16, boxSizing: "border-box" }}
          />
          <div style={{ marginTop: 4 }}>
            <Boton tono={cargando ? "neutro" : "fuerte"} alto={54} onClick={conectar} style={{ opacity: cargando ? 0.5 : 1 }}>
              {cargando ? "Conectando…" : "Conectar"}
            </Boton>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* auto-sync toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 6, padding: "12px 14px" }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: C.hueso }}>Sync automática</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.gris, marginTop: 2 }}>Al cerrar cada sesión</div>
            </div>
            <Toggle activo={autoSync} onChange={toggleAutoSync} />
          </div>

          {ultimaSync && (
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris }}>
              Última sync: <span style={{ color: C.hueso }}>{ultimaSync}</span>
            </div>
          )}

          <Boton tono={cargando ? "neutro" : "fuerte"} alto={54} onClick={sincronizar} style={{ opacity: cargando ? 0.5 : 1 }}>
            {cargando ? "Sincronizando…" : "Sincronizar ahora"}
          </Boton>
          <Boton tono="fantasma" alto={46} onClick={restaurar} style={{ opacity: cargando ? 0.5 : 1 }}>
            Restaurar desde HC
          </Boton>
          <button
            onClick={desconectar}
            style={{ background: "none", border: "none", color: C.gris, fontFamily: SANS, fontSize: 13, cursor: "pointer", textAlign: "left", padding: "4px 0" }}
          >
            Desconectar cuenta
          </button>
        </div>
      )}

      {mensaje && (
        <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 14, color: estado === "error" ? C.oxido : C.verde }}>
          {mensaje}
        </div>
      )}
    </div>
  );
}

/* ── pantalla principal ── */

export function Ajustes({ dias, setDias, restaurarDesdeHC, volver }) {
  const editar = (diaId, ejId, campo, valor) =>
    setDias(dias.map((d) =>
      d.id !== diaId ? d : { ...d, ejercicios: d.ejercicios.map((e) => (e.id !== ejId ? e : { ...e, [campo]: valor })) }
    ));

  const agregarEjercicio = (diaId) =>
    setDias(dias.map((d) =>
      d.id !== diaId ? d : { ...d, ejercicios: [...d.ejercicios, nuevoEjercicio("Nuevo ejercicio", 20, 2.5, 3, 8, 12, 90)] }
    ));

  const quitarEjercicio = (diaId, ejId) =>
    setDias(dias.map((d) =>
      d.id !== diaId ? d : { ...d, ejercicios: d.ejercicios.filter((e) => e.id !== ejId) }
    ));

  const moverEjercicio = (diaOrigenId, ejId, diaDestinoId) => {
    const ej = dias.find((d) => d.id === diaOrigenId)?.ejercicios.find((e) => e.id === ejId);
    if (!ej) return;
    setDias(dias.map((d) => {
      if (d.id === diaOrigenId) return { ...d, ejercicios: d.ejercicios.filter((e) => e.id !== ejId) };
      if (d.id === diaDestinoId) return { ...d, ejercicios: [...d.ejercicios, ej] };
      return d;
    }));
  };

  return (
    <Marco>
      <Cabecera izq="Ajustes" onSalir={volver} />
      <div style={{ padding: "12px 20px 60px" }}>

        {dias.map((d) => (
          <div key={d.id} style={{ marginBottom: 32 }}>
            {/* nombre del día */}
            <div style={{ marginBottom: 12, borderBottom: `1px solid ${C.linea}`, paddingBottom: 8 }}>
              <input
                value={d.nombre}
                onChange={(e) => setDias(dias.map((x) => (x.id === d.id ? { ...x, nombre: e.target.value } : x)))}
                style={{
                  background: "transparent",
                  color: C.hueso,
                  border: "none",
                  fontFamily: SANS,
                  fontSize: 20,
                  fontWeight: 700,
                  width: "100%",
                  outline: "none",
                  padding: "4px 0",
                }}
              />
            </div>

            {/* ejercicios */}
            {d.ejercicios.map((e) => (
              <TarjetaEjercicio
                key={e.id}
                ej={e}
                diaId={d.id}
                dias={dias}
                onEditar={editar}
                onQuitar={quitarEjercicio}
                onMover={moverEjercicio}
              />
            ))}

            <button
              onClick={() => agregarEjercicio(d.id)}
              style={{
                width: "100%",
                background: "none",
                border: `1px dashed ${C.linea}`,
                borderRadius: 6,
                color: C.gris,
                fontFamily: SANS,
                fontSize: 15,
                padding: "13px 0",
                cursor: "pointer",
              }}
            >
              + Agregar ejercicio
            </button>
          </div>
        ))}

        <SyncPanel dias={dias} restaurarDesdeHC={restaurarDesdeHC} />

        <div style={{ marginTop: 28 }}>
          <Boton tono="fuerte" alto={54} onClick={volver}>
            Listo
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
