// Fotos de técnica de un ejercicio.
//
// Un ejercicio puede tener su imagen de tres formas, y conviven:
//
//   imagenUrl  — una URL pegada a mano (lo único que había antes).
//   imagenId   — id local y estable de la foto guardada en el teléfono
//                (IndexedDB). No cambia nunca, ni siquiera al subirla.
//   imagenKey  — storage key en R2, una vez que la subida salió bien.
//
// Son dos campos y no uno porque cada uno responde una pregunta distinta:
// `imagenId` dice dónde está la copia local, `imagenKey` si ya existe copia
// remota. Con un solo campo que mutara de local a remoto habría que mover
// también la entrada de IndexedDB, y una subida a medias dejaría la foto
// sin poder mostrarse.

// Una foto de técnica se mira en un celular, al lado de la máquina: 800px
// de lado mayor sobran. Una foto de iPhone pasa de ~3 MB a ~100 KB.
export const MAX_LADO = 800;
export const CALIDAD = 0.7;
export const TIPO_SALIDA = "image/jpeg";

/**
 * A cuánto hay que achicar una imagen de `ancho`×`alto` para que su lado
 * mayor no pase de `maxLado`, manteniendo la proporción.
 *
 * Nunca agranda: una foto ya chica se sube tal cual en vez de interpolarse
 * a un tamaño que no tiene información para llenar.
 */
export function dimensionesDestino(ancho, alto, maxLado = MAX_LADO) {
  if (!(ancho > 0) || !(alto > 0)) return null;
  const mayor = Math.max(ancho, alto);
  if (mayor <= maxLado) return { ancho, alto };
  const escala = maxLado / mayor;
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  };
}

/**
 * De dónde sacar la imagen de un ejercicio, en orden de preferencia.
 *
 * - `local`  — está en el teléfono: se muestra sin red y al instante.
 * - `remota` — hay copia en R2 pero no local (otro teléfono, o se limpió
 *              el sitio): hay que pedir una URL firmada y cachearla.
 * - `url`    — la URL pegada a mano de siempre.
 * - `null`   — el ejercicio no tiene imagen.
 */
export function fuenteImagen(ej) {
  if (ej?.imagenId) return { tipo: "local", id: ej.imagenId, key: ej.imagenKey ?? null };
  if (ej?.imagenKey) return { tipo: "remota", key: ej.imagenKey };
  if (ej?.imagenUrl?.trim()) return { tipo: "url", url: ej.imagenUrl.trim() };
  return null;
}

/** Si el ejercicio tiene algo que mostrar en el modal de técnica. */
export function tieneImagen(ej) {
  return fuenteImagen(ej) !== null;
}

/**
 * Una foto guardada en el teléfono que todavía no llegó a R2. Es lo que
 * distingue "no la subí todavía" de "no tiene foto", para poder ofrecer
 * reintentar en vez de dejarla colgada en silencio.
 */
export function faltaSubir(ej) {
  return Boolean(ej?.imagenId && !ej?.imagenKey);
}

/**
 * Achica y recomprime la foto elegida antes de guardarla o subirla.
 *
 * Sólo corre en el browser (usa canvas y createImageBitmap). Devuelve un
 * Blob JPEG; si el navegador no puede decodificar el archivo, propaga el
 * error para que la UI lo muestre en vez de guardar algo roto.
 */
export async function achicar(file, { maxLado = MAX_LADO, calidad = CALIDAD } = {}) {
  const bitmap = await createImageBitmap(file);
  try {
    const destino = dimensionesDestino(bitmap.width, bitmap.height, maxLado);
    if (!destino) throw new Error("No se pudo leer el tamaño de la imagen");
    const canvas = document.createElement("canvas");
    canvas.width = destino.ancho;
    canvas.height = destino.alto;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, destino.ancho, destino.alto);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, TIPO_SALIDA, calidad)
    );
    if (!blob) throw new Error("No se pudo convertir la imagen");
    return blob;
  } finally {
    bitmap.close?.();
  }
}
