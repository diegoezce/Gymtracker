import { Component } from "react";
import { C, SANS } from "../theme";
import { Marco } from "./Marco";
import { Boton } from "./Boton";

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error no capturado:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Marco>
        <div style={{ padding: "40vh 20px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: C.hueso, marginBottom: 8 }}>
            Algo salió mal
          </div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.gris, marginBottom: 24, lineHeight: 1.4 }}>
            Lo que ya guardaste no se pierde. Recargá para seguir.
          </div>
          <Boton tono="fuerte" alto={54} onClick={() => window.location.reload()}>
            Recargar
          </Boton>
        </div>
      </Marco>
    );
  }
}
