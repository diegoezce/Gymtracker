// Fotos de técnica guardadas en el teléfono.
//
// No van por el StorageAdapter: ese contrato mueve strings (y termina en
// localStorage, que tiene ~5 MB para TODO el origen, rutina e historial
// incluidos). Una sola foto en base64 se comería una fracción enorme de ese
// presupuesto y lo que se rompería al llenarse es el guardado de los
// entrenamientos. IndexedDB guarda Blobs, tiene cientos de MB y vive aparte.
//
// Todo acá devuelve en vez de tirar: si el navegador bloquea IndexedDB
// (modo privado, sitio sin permisos), la app tiene que seguir funcionando
// sin fotos, no romperse.

const DB = "gym:fotos";
const STORE = "fotos";
const VERSION = 1;

let conexion = null;

function abrir() {
  if (conexion) return conexion;
  conexion = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Sin IndexedDB"));
      return;
    }
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((e) => {
    conexion = null; // que un fallo puntual no deje la caché muerta para siempre
    throw e;
  });
  return conexion;
}

function operar(modo, fn) {
  return abrir().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, modo);
        const req = fn(tx.objectStore(STORE));
        tx.onerror = () => reject(tx.error);
        if (req) {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        } else {
          tx.oncomplete = () => resolve(undefined);
        }
      })
  );
}

/** Id local y estable de una foto. No cambia aunque después se suba a R2. */
export function nuevoId() {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function guardarFoto(id, blob) {
  await operar("readwrite", (store) => store.put(blob, id));
}

/** El Blob, o null si no está acá (otro teléfono, o se limpió el sitio). */
export async function leerFoto(id) {
  try {
    return (await operar("readonly", (store) => store.get(id))) ?? null;
  } catch {
    return null;
  }
}

export async function borrarFoto(id) {
  try {
    await operar("readwrite", (store) => store.delete(id));
  } catch {
    // Borrar una foto que ya no está, o no poder abrir la base, no es algo
    // que el usuario pueda resolver ni necesite ver.
  }
}
