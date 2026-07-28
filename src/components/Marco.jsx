import { C, SANS } from "../theme";

export function Marco({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.fondo,
        color: C.hueso,
        fontFamily: SANS,
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>{children}</div>
      <style>{`
        button:focus-visible, input:focus-visible {
          outline: 2px solid ${C.sodio};
          outline-offset: 2px;
        }
        input { -webkit-appearance: none; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button {
          -webkit-appearance: none; margin: 0;
        }
      `}</style>
    </div>
  );
}
