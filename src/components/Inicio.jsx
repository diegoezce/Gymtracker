import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { diasDesdeStr } from "../utils/format";
import { sugerirDia, ultimaVezDia, contarSesiones } from "../domain/inicio";
import { Marco } from "./Marco";
import { Etiqueta } from "./Etiqueta";
import { Boton } from "./Boton";
import { version } from "../../package.json";

function ConfirmarDescartarPausa({ nombrePausado, nombreNuevo, onConfirmar, onCancelar }) {
  return (
    <div
      onClick={onCancelar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.sup,
          borderRadius: "16px 16px 0 0",
          padding: "20px 20px 32px",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.linea, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: C.hueso, marginBottom: 8, textAlign: "center" }}>
          ¿Descartar la sesión en pausa?
        </div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: C.gris, textAlign: "center", marginBottom: 22, lineHeight: 1.4 }}>
          Tenés "{nombrePausado}" en pausa. Si empezás "{nombreNuevo}" ahora, se descarta lo que quedó sin guardar ahí.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Boton tono="fuerte" alto={54} onClick={onConfirmar}>Descartar y empezar</Boton>
          <Boton tono="fantasma" alto={48} onClick={onCancelar}>Cancelar</Boton>
        </div>
      </div>
    </div>
  );
}

export function Inicio({ dias, aviso, sesion, sesionPausada, comenzar, onReanudar, onDescartarYEmpezar, irHistorial, irAjustes }) {
  const [descartando, setDescartando] = useState(null); // día que se quiere empezar en su lugar

  const diaPausado = sesionPausada && sesion ? dias.find((d) => d.id === sesion.diaId) : null;
  // Si hay una sesión en pausa, lo que "toca" es retomarla, no empezar otra.
  const sugerido = diaPausado ?? sugerirDia(dias);
  const otros = dias.filter((d) => d.id !== sugerido?.id);
  const { estaSemana, esteMes } = contarSesiones(dias);

  const tocarDia = (d) => {
    if (diaPausado && d.id === diaPausado.id) return onReanudar();
    if (diaPausado) return setDescartando(d);
    comenzar(d);
  };

  const subtitulo = (d) => {
    const ultima = ultimaVezDia(dias, d);
    const n = d.ejercicios.length;
    return `${n} ejercicio${n !== 1 ? "s" : ""} · ${ultima ? diasDesdeStr(ultima) : "sin registros"}`;
  };

  return (
    <Marco>
      {descartando && (
        <ConfirmarDescartarPausa
          nombrePausado={diaPausado?.nombre}
          nombreNuevo={descartando.nombre}
          onConfirmar={() => { onDescartarYEmpezar(descartando); setDescartando(null); }}
          onCancelar={() => setDescartando(null)}
        />
      )}
      <div style={{ padding: "28px 20px 40px" }}>
        <Etiqueta>Registro</Etiqueta>
        <h1
          style={{
            fontFamily: SANS,
            fontSize: 34,
            fontWeight: 700,
            color: C.hueso,
            margin: "6px 0 2px",
            letterSpacing: "-0.02em",
          }}
        >
          ¿Qué toca hoy?
        </h1>
        {esteMes > 0 && (
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris }}>
            {estaSemana} esta semana · {esteMes} este mes
          </div>
        )}

        {aviso && (
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              background: C.sup,
              borderLeft: `3px solid ${C.sodio}`,
              borderRadius: 2,
              color: C.hueso,
              fontFamily: SANS,
              fontSize: 15,
              lineHeight: 1.45,
            }}
          >
            {aviso}
          </div>
        )}

        {/* El día sugerido ocupa el lugar principal: es la única decisión
            de esta pantalla, y con un toque ya estás entrenando. */}
        {sugerido && (
          <button
            onClick={() => tocarDia(sugerido)}
            style={{
              width: "100%",
              textAlign: "left",
              marginTop: 22,
              background: C.sup,
              border: `1px solid ${C.sodio}`,
              borderRadius: 6,
              padding: "18px 18px 16px",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Etiqueta color={C.sodio}>{diaPausado ? "Sesión en pausa" : "Te toca"}</Etiqueta>
            <div style={{ fontFamily: SANS, fontSize: 26, fontWeight: 700, color: C.hueso, marginTop: 6 }}>
              {sugerido.nombre}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 3 }}>
              {diaPausado ? "Tocá para seguir donde quedaste" : subtitulo(sugerido)}
            </div>
            <div
              style={{
                marginTop: 14,
                background: C.sodio,
                color: "#14120F",
                borderRadius: 4,
                padding: "12px 0",
                textAlign: "center",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {diaPausado ? "Retomar" : "Empezar"}
            </div>
          </button>
        )}

        {otros.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Etiqueta>Otros días</Etiqueta>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {otros.map((d) => (
                <button
                  key={d.id}
                  onClick={() => tocarDia(d)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: C.sup,
                    border: `1px solid ${C.linea}`,
                    borderRadius: 4,
                    padding: "14px 16px",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: C.hueso }}>{d.nombre}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.gris, flexShrink: 0 }}>
                      {subtitulo(d)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
          <Boton tono="fantasma" alto={54} onClick={irHistorial}>
            Progreso
          </Boton>
          <Boton tono="fantasma" alto={54} onClick={irAjustes}>
            Ajustes
          </Boton>
        </div>

        <div style={{ marginTop: 22, textAlign: "center", fontFamily: MONO, fontSize: 11, color: C.gris, opacity: 0.6 }}>
          v{version}
        </div>
      </div>
    </Marco>
  );
}
