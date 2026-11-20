// Subida y lectura de fotos de técnica contra R2, vía el endpoint de HM.
//
// Los bytes no pasan por el servidor: HM firma un PUT para una key que
// elige él, el browser sube directo a Cloudflare, y después HM firma un GET
// cuando hay que mostrarla. La URL de lectura vence (una hora), así que lo
// que se guarda en la rutina es la key, nunca la URL.
//
// Todo esto es opcional por diseño. Si no hay token, no hay red, o el
// servidor todavía no tiene el endpoint (503), la foto ya quedó guardada en
// el teléfono y la app funciona igual — sólo falta la copia remota.

import { HC_HOST } from "./hcAdapter";

const BASE = `https://${HC_HOST}/api/gymtracker/foto/`;

/** El endpoint contestó, pero diciendo que no puede. */
export class FotoRemotaNoDisponible extends Error {}

async function pedir(url, opts, token) {
  let res;
  try {
    res = await fetch(url, {
      ...opts,
      headers: { ...(opts?.headers ?? {}), Authorization: `Token ${token}` },
    });
  } catch {
    throw new FotoRemotaNoDisponible(`No se pudo llegar a ${HC_HOST}.`);
  }
  if (res.status === 503) {
    throw new FotoRemotaNoDisponible("El servidor no tiene configurado el almacenamiento.");
  }
  if (res.status === 404) {
    throw new FotoRemotaNoDisponible("El servidor todavía no tiene el endpoint de fotos.");
  }
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res;
}

/**
 * Sube una foto y devuelve su storage key.
 *
 * Dos pasos: HM firma el PUT (y elige la key, así el cliente no puede
 * apuntar a un objeto ajeno) y el browser sube contra Cloudflare.
 */
export async function subirFoto(token, blob) {
  const contentType = blob.type || "image/jpeg";
  const res = await pedir(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: contentType }),
  }, token);
  const { storage_key: key, upload_url: url } = await res.json();

  let subida;
  try {
    // Sin Authorization: la firma va en la URL y mandar el header de HM a
    // Cloudflare hace que R2 rechace la request.
    subida = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
  } catch {
    // Acá es casi siempre CORS: el bucket no tiene la regla que permite PUT
    // desde este origen. El browser no lo distingue de "no hay red".
    throw new FotoRemotaNoDisponible(
      "La subida no llegó a Cloudflare. Puede faltar el CORS del bucket."
    );
  }
  if (!subida.ok) throw new Error(`R2 respondió ${subida.status}`);
  return key;
}

/** URL firmada para mostrar una foto ya subida. Vence en una hora. */
export async function urlDeLectura(token, key) {
  const res = await pedir(`${BASE}?key=${encodeURIComponent(key)}`, {}, token);
  const { url } = await res.json();
  return url;
}

/** Baja los bytes de una foto remota, para cachearla en el teléfono. */
export async function bajarFoto(token, key) {
  const url = await urlDeLectura(token, key);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status} bajando la foto`);
  return res.blob();
}

/** Borra los bytes en R2 de una foto que la rutina ya no referencia. */
export async function borrarRemota(token, key) {
  await pedir(`${BASE}?key=${encodeURIComponent(key)}`, { method: "DELETE" }, token);
}
