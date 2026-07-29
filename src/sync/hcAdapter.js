const HC_URL = "https://hc.sparkio.me";

export const TOKEN_KEY = "gym:hc:token";
export const SYNC_KEY = "gym:hc:ultima-sync";
export const AUTOSYNC_KEY = "gym:hc:autosync";
export const leerAutoSync = () => localStorage.getItem(AUTOSYNC_KEY) !== "0";

export function leerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function obtenerToken(username, password) {
  const res = await fetch(`${HC_URL}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Credenciales incorrectas");
  const data = await res.json();
  const t = data.token ?? data.access ?? data.key;
  if (!t) throw new Error("No se recibió token");
  return t;
}

export async function pushSesiones(token, sesiones) {
  const res = await fetch(`${HC_URL}/api/gymtracker/sync/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: JSON.stringify({ sesiones }),
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function fetchSesiones(token) {
  const res = await fetch(`${HC_URL}/api/gymtracker/sync/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json(); // { sesiones: [...] }
}

// Reconstruye el historial de cada ejercicio a partir de las sesiones del HC.
// Actualiza también el peso al último registrado.
export function aplicarSesiones(dias, sesiones) {
  return dias.map((dia) => ({
    ...dia,
    ejercicios: dia.ejercicios.map((ej) => {
      const historial = sesiones
        .filter((s) => s.dia === dia.nombre)
        .flatMap((s) => {
          const ejHC = s.ejercicios.find((e) => e.nombre === ej.nombre);
          return ejHC ? [{ fecha: s.fecha, series: ejHC.series }] : [];
        })
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-40);
      const ultimaSerie = historial[historial.length - 1]?.series;
      const ultimoPeso =
        ultimaSerie?.length ? Math.max(...ultimaSerie.map((s) => s.peso)) : ej.peso;
      return { ...ej, historial, peso: historial.length > 0 ? ultimoPeso : ej.peso };
    }),
  }));
}

// Elimina el historial de cada ejercicio — solo la estructura de la rutina
function extraerEstructura(dias) {
  return dias.map((dia) => ({
    ...dia,
    ejercicios: dia.ejercicios.map(({ historial: _h, ...ej }) => ej),
  }));
}

export async function pushRutina(token, dias) {
  const res = await fetch(`${HC_URL}/api/gymtracker/rutina/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: JSON.stringify({ rutina: extraerEstructura(dias) }),
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function fetchRutina(token) {
  const res = await fetch(`${HC_URL}/api/gymtracker/rutina/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json(); // { rutina: [...] | null }
}

// Combina la estructura del HC con el historial local (si existe)
export function aplicarRutina(rutinaHC, diasLocales) {
  return rutinaHC.map((diaHC) => {
    const diaLocal = diasLocales.find((d) => d.id === diaHC.id);
    return {
      ...diaHC,
      ejercicios: diaHC.ejercicios.map((ejHC) => {
        const ejLocal = diaLocal?.ejercicios.find((e) => e.id === ejHC.id);
        return { ...ejHC, historial: ejLocal?.historial ?? [] };
      }),
    };
  });
}

export function construirSesiones(dias) {
  const sesiones = [];
  dias.forEach((dia) => {
    const fechas = [
      ...new Set(dia.ejercicios.flatMap((e) => e.historial.map((h) => h.fecha))),
    ];
    fechas.forEach((fecha) => {
      const ejercicios = dia.ejercicios
        .map((e) => {
          const entrada = e.historial.find((h) => h.fecha === fecha);
          return entrada ? { nombre: e.nombre, series: entrada.series } : null;
        })
        .filter(Boolean);
      const volumen_kg = ejercicios.reduce(
        (sum, e) => sum + e.series.reduce((s, serie) => s + serie.peso * serie.reps, 0),
        0
      );
      sesiones.push({ fecha, dia: dia.nombre, ejercicios, volumen_kg, duracion_min: null });
    });
  });
  return sesiones.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
