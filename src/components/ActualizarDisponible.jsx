import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { C, SANS } from "../theme";

const INTERVALO_CHEQUEO_MS = 60 * 60 * 1000;

export function ActualizarDisponible() {
  const registrationRef = useRef(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null;
    },
  });

  useEffect(() => {
    const chequear = () => {
      registrationRef.current?.update().catch(() => {});
    };
    // iOS suspende el WKWebView de la PWA "standalone" en vez de recargarla:
    // al reabrirla no hay navegación real, así que ni el registro inicial ni
    // un setInterval (que se pausa con la página) alcanzan. visibilitychange/
    // pageshow al volver sí disparan de forma confiable.
    const alVolver = () => {
      if (document.visibilityState === "visible") chequear();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("pageshow", chequear);
    window.addEventListener("focus", chequear);
    const intervalo = setInterval(chequear, INTERVALO_CHEQUEO_MS);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("pageshow", chequear);
      window.removeEventListener("focus", chequear);
      clearInterval(intervalo);
    };
  }, []);

  if (!needRefresh) return null;

  return (
    <div style={{ background: C.sup2, borderBottom: `1px solid ${C.linea}` }}>
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 14, color: C.hueso, lineHeight: 1.4 }}>
          Hay una versión nueva de la app
        </span>
        <button
          onClick={() => updateServiceWorker(true)}
          style={{
            flexShrink: 0,
            background: C.sodio,
            color: "#14120F",
            border: "none",
            borderRadius: 4,
            padding: "8px 14px",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
