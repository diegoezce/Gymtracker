import { C, MONO, SANS } from "../theme";
import { fmt, fechaCorta } from "../utils/format";
import { Marco } from "./Marco";
import { Etiqueta } from "./Etiqueta";
import { Boton } from "./Boton";
import { version } from "../../package.json";

export function Inicio({ dias, aviso, comenzar, irHistorial, irAjustes }) {
  return (
    <Marco>
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
            const ultima = d.ejercicios
              .flatMap((e) => e.historial.map((h) => h.fecha))
              .sort()
              .slice(-1)[0];
            return (
              <button
                key={d.id}
                onClick={() => comenzar(d)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: C.sup,
                  border: `1px solid ${C.linea}`,
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
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.gris }}>
                    {ultima ? fechaCorta(ultima) : "sin registros"}
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
