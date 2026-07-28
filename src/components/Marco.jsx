import { C, SANS } from "../theme";

export function Marco({ children }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.fondo,
        color: C.hueso,
        fontFamily: SANS,
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>{children}</div>
      <style>{`
        button:focus-visible, input:focus-visible, select:focus-visible {
          outline: 2px solid ${C.sodio};
          outline-offset: 2px;
        }
        input, select, textarea {
          -webkit-appearance: none;
          font-size: 16px;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
