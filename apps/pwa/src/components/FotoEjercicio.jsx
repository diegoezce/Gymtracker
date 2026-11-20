import { useEffect, useState } from "react";
import { C, SANS } from "../theme";
import { fuenteImagen } from "../domain/imagen";
import { guardarFoto, leerFoto } from "../storage/fotosLocal";
import { bajarFoto } from "../sync/fotos";
import { leerToken } from "../sync/hcAdapter";

/**
 * La foto de técnica de un ejercicio, venga de donde venga.
 *
 * Orden: el teléfono primero. Es lo que hace que la foto abra al instante y
 * sin señal, que es la situación real — mirás la técnica parado al lado de
 * la máquina, no en casa con wifi.
 *
 * Si no está local pero hay copia en R2, la baja una vez y la cachea, así
 * la siguiente vez ya no necesita red. Un teléfono nuevo, o un borrado de
 * datos del sitio, se recupera solo de esta forma.
 */
export function FotoEjercicio({ ej, style, alt }) {
  const [src, setSrc] = useState(null);
  const [estado, setEstado] = useState("cargando"); // cargando | ok | falta

  const { imagenId, imagenKey, imagenUrl } = ej ?? {};

  useEffect(() => {
    let vivo = true;
    let creada = null; // object URL propio, a revocar al desmontar
    const mostrar = (url, propia) => {
      if (!vivo) {
        if (propia) URL.revokeObjectURL(url);
        return;
      }
      if (propia) creada = url;
      setSrc(url);
      setEstado("ok");
    };

    const fuente = fuenteImagen({ imagenId, imagenKey, imagenUrl });
    if (!fuente) {
      setEstado("falta");
      return undefined;
    }
    if (fuente.tipo === "url") {
      setSrc(fuente.url);
      setEstado("ok");
      return undefined;
    }

    setEstado("cargando");
    // Una foto sólo remota se cachea bajo su propia key: no tiene id local
    // que la rutina pueda recordar hasta que se edite el ejercicio.
    const idCache = fuente.tipo === "local" ? fuente.id : fuente.key;
    const key = fuente.key;

    (async () => {
      const local = await leerFoto(idCache);
      if (local) {
        mostrar(URL.createObjectURL(local), true);
        return;
      }
      const token = leerToken();
      if (!key || !token) {
        if (vivo) setEstado("falta");
        return;
      }
      try {
        const blob = await bajarFoto(token, key);
        await guardarFoto(idCache, blob); // la próxima vez ya no hace falta red
        mostrar(URL.createObjectURL(blob), true);
      } catch {
        if (vivo) setEstado("falta");
      }
    })();

    return () => {
      vivo = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [imagenId, imagenKey, imagenUrl]);

  if (estado === "ok") return <img src={src} alt={alt ?? ej?.nombre ?? ""} style={style} />;
  if (estado === "falta") return null;
  return (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.sup2,
        minHeight: 80,
        fontFamily: SANS,
        fontSize: 12,
        color: C.gris,
      }}
    >
      cargando foto…
    </div>
  );
}
