import { useState } from "react";
import { C, MONO, SANS } from "../theme";
import { Marco } from "./Marco";
import { Boton } from "./Boton";

// Se muestra al terminar una sesión cuando hay actividad sin sincronizar
// y el auto-sync está apagado — para no depender de acordarse de tocar
// el botón manual en Ajustes.
export function ConfirmarSync({ onSincronizar, onSalirSinSincronizar }) {
  const [estado, setEstado] = useState("idle"); // idle | cargando | error
  const [mensaje, setMensaje] = useState("");

  const sincronizar = async () => {
    setEstado("cargando");
    setMensaje("");
    try {
      await onSincronizar();
    } catch (e) {
      setEstado("error");
      setMensaje(e.message === "401" ? "Token expirado. Podés salir sin sincronizar y reconectarte después." : e.message || "No se pudo sincronizar.");
    }
  };

  return (
    <Marco>
      <div style={{ padding: "20px 20px 40px", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color: C.hueso, marginBottom: 10 }}>
          ¿Sincronizar esta sesión?
        </div>
        <div style={{ fontFamily: SANS, fontSize: 15, color: C.gris, lineHeight: 1.5, marginBottom: 28 }}>
          El auto-sync con Health Monitor está apagado. Si no sincronizás
          ahora, esta sesión sólo va a quedar guardada en este dispositivo.
        </div>

        {mensaje && (
          <div style={{ fontFamily: MONO, fontSize: 13, color: estado === "error" ? "#c0392b" : C.gris, marginBottom: 16, lineHeight: 1.5 }}>
            {mensaje}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Boton tono="fuerte" alto={54} onClick={sincronizar} style={{ opacity: estado === "cargando" ? 0.6 : 1 }}>
            {estado === "cargando" ? "Sincronizando…" : "Sí, sincronizar"}
          </Boton>
          <Boton tono="fantasma" alto={48} onClick={onSalirSinSincronizar}>
            Salir sin sincronizar
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
