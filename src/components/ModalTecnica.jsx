import { C, SANS } from "../theme";

export function ModalTecnica({ ej, onCerrar }) {
  const tieneTecnica = ej.tecnica?.trim();
  const tieneImagen = ej.imagenUrl?.trim();

  if (!tieneTecnica && !tieneImagen) return null;

  return (
    <div
      onClick={onCerrar}
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
          padding: "20px 20px 40px",
          maxHeight: "80vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* handle */}
        <div style={{ width: 36, height: 4, background: C.linea, borderRadius: 2, margin: "0 auto 20px" }} />

        {/* nombre */}
        <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: C.hueso, marginBottom: 16 }}>
          {ej.nombre}
        </div>

        {/* imagen */}
        {tieneImagen && (
          <img
            src={ej.imagenUrl}
            alt={ej.nombre}
            style={{
              width: "100%",
              borderRadius: 8,
              marginBottom: tieneTecnica ? 16 : 0,
              objectFit: "cover",
              maxHeight: 240,
            }}
          />
        )}

        {/* técnica */}
        {tieneTecnica && (
          <div style={{
            fontFamily: SANS,
            fontSize: 15,
            color: C.hueso,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}>
            {ej.tecnica}
          </div>
        )}

        <button
          onClick={onCerrar}
          style={{
            marginTop: 24,
            width: "100%",
            background: "none",
            border: `1px solid ${C.linea}`,
            borderRadius: 8,
            color: C.gris,
            fontFamily: SANS,
            fontSize: 15,
            padding: "13px 0",
            cursor: "pointer",
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
