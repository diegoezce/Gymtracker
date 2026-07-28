import { C, MONO, SANS } from "../theme";
import { campo } from "../styles/helpers";
import { Marco } from "./Marco";
import { Cabecera } from "./Cabecera";
import { Etiqueta } from "./Etiqueta";
import { Boton } from "./Boton";

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
        <Boton tono="fantasma" alto={54} onClick={volver}>
          Listo
        </Boton>
      </div>
    </Marco>
  );
}
