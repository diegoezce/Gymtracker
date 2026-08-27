import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { fmt, fechaCorta } from "../utils/format";
import { ultimaFechaDia } from "../domain/rutina";
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

  const tocarDia = (d) => {
    if (diaPausado && d.id === diaPausado.id) return onReanudar();
    if (diaPausado) return setDescartando(d);
    comenzar(d);
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

        {diaPausado && (
          <button
            onClick={onReanudar}
            style={{
              width: "100%",
              textAlign: "left",
              marginTop: 20,
              padding: "14px 16px",
              background: C.sup,
              border: `1px solid ${C.sodio}`,
              borderRadius: 4,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: C.sodio }}>
              Sesión en pausa · {diaPausado.nombre}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.gris, marginTop: 3 }}>
              Tocá para seguir donde quedaste
            </div>
          </button>
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

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {dias.map((d) => {
            const ultima = d.ultimaSesion ?? ultimaFechaDia(dias, d.id);
            const enPausa = diaPausado?.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => tocarDia(d)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: C.sup,
                  border: `1px solid ${enPausa ? C.sodio : C.linea}`,
                  borderRadius: 4,
                  padding: "20px 18px",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 22,
                      fontWeight: 700,
                      color: C.hueso,
                    }}
                  >
                    {d.nombre}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: enPausa ? C.sodio : C.gris }}>
                    {enPausa ? "en pausa" : ultima ? fechaCorta(ultima) : "sin registros"}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: MONO,
                    fontSize: 12,
                    color: C.gris,
                    lineHeight: 1.6,
                  }}
                >
                  {d.ejercicios.map((e) => `${e.nombre} ${fmt(e.peso)}`).join("  ·  ")}
                </div>
              </button>
            );
          })}
        </div>

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
