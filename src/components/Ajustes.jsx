import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { actualizarCompartido, diasDondeAparece, ejerciciosVinculables, quitarPierdeHistorial } from "../domain/rutina";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Boton } from "./Boton";
import { SelectorEjercicio } from "./SelectorEjercicio";
import {
  TOKEN_KEY,
  SYNC_KEY,
  AUTOSYNC_KEY,
  leerToken,
  leerAutoSync,
  obtenerToken,
  pushSesiones,
  construirSesiones,
  fetchRutina,
  pushRutina,
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

const QUITAR_BTN = {
  background: "none",
  border: `1px solid #3a2a2a`,
  borderRadius: 4,
  color: "#c0392b",
  fontFamily: "ui-monospace, monospace",
  fontSize: 18,
  width: 36,
  height: 36,
  cursor: "pointer",
  flexShrink: 0,
  lineHeight: 1,
};

const CONFIRM_BTN = {
  background: "none",
  border: `1px solid ${C.linea}`,
  borderRadius: 4,
  color: C.gris,
  fontFamily: SANS,
  fontSize: 13,
  padding: "7px 14px",
  cursor: "pointer",
};

function CabeceraCard({ ej, diaId, dias, onEditar, onQuitar }) {
  const [confirmando, setConfirmando] = useState(false);
  const e = (campo, valor) => onEditar(diaId, ej.id, campo, valor);
  const diaActual = dias.find((d) => d.id === diaId)?.nombre;
  const otrosDias = diasDondeAparece(dias, ej.id).filter((n) => n !== diaActual);

  // Sólo preguntamos si al sacarlo se pierde el historial: si está en otro
  // día, esa copia lo conserva y no hay nada que perder.
  const intentarQuitar = () => {
    if (quitarPierdeHistorial(dias, ej.id)) setConfirmando(true);
    else onQuitar(diaId, ej.id);
  };

  return (
    <>
      <div style={{ padding: "14px 14px 10px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <TextInput value={ej.nombre} onChange={(v) => e("nombre", v)} placeholder="Nombre del ejercicio" />
          {otrosDias.length > 0 && (
            <div style={{ fontFamily: SANS, fontSize: 11, color: C.sodio, marginTop: 4 }}>
              también en {otrosDias.join(", ")} · mismo peso/progreso
            </div>
          )}
        </div>
        {ej.tipo === "cardio" && (
          <span style={{ fontFamily: SANS, fontSize: 11, color: C.sodio, background: "#1a2a1a", borderRadius: 3, padding: "2px 6px", flexShrink: 0 }}>
            CARDIO
          </span>
        )}
        <button onClick={intentarQuitar} style={QUITAR_BTN}>×</button>
      </div>

      {confirmando && (
        <div style={{ padding: "12px 14px", background: "#2a1a1a", borderTop: `1px solid #3a2a2a` }}>
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.hueso, lineHeight: 1.45 }}>
            Tiene {ej.historial.length}{" "}
            {ej.historial.length === 1 ? "sesión registrada" : "sesiones registradas"}. Si lo
            quitás se pierde ese historial.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setConfirmando(false)} style={CONFIRM_BTN}>
              Cancelar
            </button>
            <button
              onClick={() => { setConfirmando(false); onQuitar(diaId, ej.id); }}
              style={{ ...CONFIRM_BTN, color: "#c0392b", borderColor: "#3a2a2a" }}
            >
              Quitar igual
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function TarjetaCardio({ ej, diaId, dias, onEditar, onQuitar, onMover }) {
  const [abierto, setAbierto] = useState(false);
  const e = (campo, valor) => onEditar(diaId, ej.id, campo, valor);

  return (
    <div style={{ background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 6, marginBottom: 8, overflow: "hidden" }}>
      <CabeceraCard ej={ej} diaId={diaId} dias={dias} onEditar={onEditar} onQuitar={onQuitar} />

      <div style={{ padding: "0 14px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <Label>Duración objetivo (min)</Label>
          <NumInput value={ej.duracionMin} onChange={(v) => e("duracionMin", v)} step={5} min={1} />
        </div>
        <div>
          <Label>Distancia objetivo (km)</Label>
          <NumInput value={ej.distanciaKm ?? 0} onChange={(v) => e("distanciaKm", v === 0 ? null : v)} step={0.5} />
        </div>
      </div>

      {dias.length > 1 && (
        <>
          <button
            onClick={() => setAbierto((a) => !a)}
            style={{ width: "100%", background: "none", border: "none", borderTop: `1px solid ${C.linea}`, color: C.gris, fontFamily: SANS, fontSize: 12, padding: "8px 14px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}
          >
            <span>Mover a otro día</span>
            <span>{abierto ? "▲" : "▼"}</span>
          </button>
          {abierto && (
            <div style={{ padding: "10px 14px 14px", borderTop: `1px solid ${C.linea}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {dias.filter((d) => d.id !== diaId).map((d) => (
                <button key={d.id} onClick={() => onMover(diaId, ej.id, d.id)}
                  style={{ background: "none", border: `1px solid ${C.linea}`, borderRadius: 4, color: C.gris, fontFamily: SANS, fontSize: 13, padding: "6px 12px", cursor: "pointer" }}>
                  → {d.nombre}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TarjetaFuerza({ ej, diaId, dias, onEditar, onQuitar, onMover }) {
  const [abierto, setAbierto] = useState(false);
  const e = (campo, valor) => onEditar(diaId, ej.id, campo, valor);

  return (
    <div style={{ background: C.sup, border: `1px solid ${C.linea}`, borderRadius: 6, marginBottom: 8, overflow: "hidden" }}>
      <CabeceraCard ej={ej} diaId={diaId} dias={dias} onEditar={onEditar} onQuitar={onQuitar} />

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
        style={{ width: "100%", background: "none", border: "none", borderTop: `1px solid ${C.linea}`, color: C.gris, fontFamily: SANS, fontSize: 12, padding: "8px 14px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}
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
                      style={{ background: "none", border: `1px solid ${C.linea}`, borderRadius: 4, color: C.gris, fontFamily: SANS, fontSize: 13, padding: "6px 12px", cursor: "pointer" }}
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

function TarjetaEjercicio(props) {
  return props.ej.tipo === "cardio"
    ? <TarjetaCardio {...props} />
    : <TarjetaFuerza {...props} />;
}

/* ── panel de sync ── */

const contarRutina = (ds) => ({
  dias: ds.length,
  ejercicios: ds.reduce((n, d) => n + d.ejercicios.length, 0),
});

// "3 días, 17 ejercicios" / "1 día, 1 ejercicio"
const resumenRutina = (ds) => {
  const { dias: d, ejercicios: e } = contarRutina(ds);
  return `${d} día${d !== 1 ? "s" : ""}, ${e} ejercicio${e !== 1 ? "s" : ""}`;
};

function SyncPanel({ dias, traerHistorialDeHC, aplicarRutinaDeHC }) {
  const [token, setToken] = useState(leerToken);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState("idle");
  const [mensaje, setMensaje] = useState("");
  const [autoSync, setAutoSync] = useState(leerAutoSync);
  const [rutinaHC, setRutinaHC] = useState(null); // bajada, esperando confirmación de traer
  const [envioPendiente, setEnvioPendiente] = useState(null); // rutina remota que se pisaría al enviar
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

  async function traerHistorial() {
    setEstado("cargando"); setMensaje("");
    try {
      const count = await traerHistorialDeHC();
      setEstado("ok");
      setMensaje(`${count} sesión${count !== 1 ? "es" : ""} recuperada${count !== 1 ? "s" : ""}.`);
    } catch (e) {
      if (e.message === "401") { localStorage.removeItem(TOKEN_KEY); setToken(null); }
      setEstado("error"); setMensaje(e.message);
    }
  }

  // Dos fases: bajamos la rutina primero para poder mostrar en la
  // confirmación qué se va a reemplazar por qué.
  async function pedirRutina() {
    setEstado("cargando"); setMensaje(""); setRutinaHC(null);
    try {
      const { rutina } = await fetchRutina(token);
      if (!rutina?.length) {
        setEstado("error");
        setMensaje("No hay ninguna rutina guardada en HC todavía.");
        return;
      }
      setRutinaHC(rutina);
      setEstado("idle");
    } catch (e) {
      if (e.message === "401") { localStorage.removeItem(TOKEN_KEY); setToken(null); }
      setEstado("error"); setMensaje(e.message === "401" ? "Token expirado. Volvé a conectarte." : e.message);
    }
  }

  function confirmarRutina() {
    const resumen = resumenRutina(rutinaHC);
    aplicarRutinaDeHC(rutinaHC);
    setRutinaHC(null);
    setEstado("ok");
    setMensaje(`Rutina traída de HC: ${resumen}.`);
  }

  async function enviarRutina() {
    const resumen = resumenRutina(dias);
    await pushRutina(token, dias);
    setEnvioPendiente(null);
    setEstado("ok");
    setMensaje(`Rutina enviada a HC: ${resumen}.`);
  }

  // pushRutina reemplaza lo que haya en HC, así que primero miramos qué hay
  // del otro lado: si ya existe una rutina, pedimos confirmación.
  async function pedirEnviarRutina() {
    setEstado("cargando"); setMensaje(""); setEnvioPendiente(null);
    try {
      const { rutina } = await fetchRutina(token);
      if (!rutina?.length) {
        await enviarRutina(); // no hay nada que pisar
        return;
      }
      setEnvioPendiente(rutina);
      setEstado("idle");
    } catch (e) {
      if (e.message === "401") { localStorage.removeItem(TOKEN_KEY); setToken(null); }
      setEstado("error"); setMensaje(e.message === "401" ? "Token expirado. Volvé a conectarte." : e.message);
    }
  }

  async function confirmarEnvio() {
    setEstado("cargando"); setMensaje("");
    try {
      await enviarRutina();
    } catch (e) {
      if (e.message === "401") { localStorage.removeItem(TOKEN_KEY); setToken(null); }
      setEstado("error"); setMensaje(e.message === "401" ? "Token expirado. Volvé a conectarte." : e.message);
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
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.gris, marginTop: 2 }}>
                Sube las sesiones al cerrar cada ejercicio
              </div>
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

          <Boton tono="fantasma" alto={46} onClick={pedirRutina} style={{ opacity: cargando ? 0.5 : 1 }}>
            Traer rutina de HC
          </Boton>

          {rutinaHC && (
            <div style={{ background: C.sup, border: `1px solid ${C.sodio}`, borderRadius: 6, padding: "12px 14px" }}>
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.hueso, lineHeight: 1.5 }}>
                Tu rutina local ({resumenRutina(dias)}) se reemplaza por la de HC (
                {resumenRutina(rutinaHC)}). El historial de los ejercicios que coincidan se
                conserva.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => { setRutinaHC(null); setMensaje(""); }} style={CONFIRM_BTN}>
                  Cancelar
                </button>
                <button onClick={confirmarRutina} style={{ ...CONFIRM_BTN, color: C.sodio, borderColor: C.sodio }}>
                  Traer igual
                </button>
              </div>
            </div>
          )}

          <Boton tono="fantasma" alto={46} onClick={pedirEnviarRutina} style={{ opacity: cargando ? 0.5 : 1 }}>
            Enviar rutina a HC
          </Boton>

          {envioPendiente && (
            <div style={{ background: C.sup, border: `1px solid ${C.sodio}`, borderRadius: 6, padding: "12px 14px" }}>
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.hueso, lineHeight: 1.5 }}>
                La rutina que hay en HC ({resumenRutina(envioPendiente)}) se reemplaza por la tuya
                ({resumenRutina(dias)}).
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => { setEnvioPendiente(null); setMensaje(""); }} style={CONFIRM_BTN}>
                  Cancelar
                </button>
                <button onClick={confirmarEnvio} style={{ ...CONFIRM_BTN, color: C.sodio, borderColor: C.sodio }}>
                  Enviar igual
                </button>
              </div>
            </div>
          )}

          <Boton tono="fantasma" alto={46} onClick={traerHistorial} style={{ opacity: cargando ? 0.5 : 1 }}>
            Traer historial de HC
          </Boton>

          <div style={{ fontFamily: SANS, fontSize: 12, color: C.gris, lineHeight: 1.5 }}>
            En un dispositivo nuevo: primero traé la rutina, después el historial.
            La rutina sólo se envía cuando lo pedís acá.
          </div>

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

// Campos compartidos entre copias del mismo ejercicio en distintos días —
// ver actualizarCompartido en domain/rutina.js.
const CAMPOS_COMPARTIDOS = new Set(["nombre", "peso", "incremento", "repsObjetivo"]);

export function Ajustes({ dias, setDias, agregarEjercicioADia, traerHistorialDeHC, aplicarRutinaDeHC, volver }) {
  const [agregandoEnDia, setAgregandoEnDia] = useState(null);

  const editar = (diaId, ejId, campo, valor) => {
    if (CAMPOS_COMPARTIDOS.has(campo)) {
      setDias(actualizarCompartido(dias, ejId, { [campo]: valor }));
    } else {
      setDias(dias.map((d) =>
        d.id !== diaId ? d : { ...d, ejercicios: d.ejercicios.map((e) => (e.id !== ejId ? e : { ...e, [campo]: valor })) }
      ));
    }
  };

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

  if (agregandoEnDia) {
    return (
      <SelectorEjercicio
        candidatos={ejerciciosVinculables(dias, agregandoEnDia)}
        onSeleccionar={(ej) => {
          agregarEjercicioADia(agregandoEnDia, ej);
          setAgregandoEnDia(null);
        }}
        onCrearNuevo={(ej) => {
          agregarEjercicioADia(agregandoEnDia, ej);
          setAgregandoEnDia(null);
        }}
        volver={() => setAgregandoEnDia(null)}
      />
    );
  }

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
              onClick={() => setAgregandoEnDia(d.id)}
              style={{ width: "100%", background: "none", border: `1px dashed ${C.linea}`, borderRadius: 6, color: C.gris, fontFamily: SANS, fontSize: 14, padding: "13px 0", cursor: "pointer" }}
            >
              + Agregar ejercicio
            </button>
          </div>
        ))}

        <SyncPanel
          dias={dias}
          traerHistorialDeHC={traerHistorialDeHC}
          aplicarRutinaDeHC={aplicarRutinaDeHC}
        />

        <div style={{ marginTop: 28 }}>
          <Boton tono="fuerte" alto={54} onClick={volver}>
            Listo
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
