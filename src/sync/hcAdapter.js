import { diasDondeAparece } from "../domain/rutina";

const HC_URL = "https://hc.sparkio.me";

export const TOKEN_KEY = "gym:hc:token";
export const SYNC_KEY = "gym:hc:ultima-sync";
export const AUTOSYNC_KEY = "gym:hc:autosync";
export const leerAutoSync = () => localStorage.getItem(AUTOSYNC_KEY) === "1";

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
      // Un ejercicio compartido entre días (mismo id) puede haberse
      // entrenado bajo cualquiera de esos días, y el campo `dia` de la
      // sesión en HC no siempre es confiable (ver construirSesiones): antes
      // de que existiera `sesionesFechas`, cualquier sesión que tocara un
      // ejercicio compartido podía quedar etiquetada con el día equivocado.
      // Por eso, para ejercicios compartidos se busca en TODAS las
      // sesiones por nombre, sin filtrar por día — total, comparten el
      // mismo historial sin importar bajo cuál día se entrenaron.
      const esCompartido = diasDondeAparece(dias, ej.id).length > 1;
      const sesionesDelDia = esCompartido ? sesiones : sesiones.filter((s) => s.dia === dia.nombre);
      if (ej.tipo === "cardio") {
        const historial = sesionesDelDia
          .flatMap((s) => {
            const ejHC = s.ejercicios.find((e) => e.nombre === ej.nombre);
            return ejHC ? [{ fecha: s.fecha, duracion: ejHC.duracion, distancia: ejHC.distancia }] : [];
          })
          .sort((a, b) => a.fecha.localeCompare(b.fecha))
          .slice(-40);
        return { ...ej, historial };
      }
      const historial = sesionesDelDia
        .flatMap((s) => {
          const ejHC = s.ejercicios.find((e) => e.nombre === ej.nombre);
          return ejHC ? [{ fecha: s.fecha, series: ejHC.series }] : [];
        })
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-40);
      const ultimaSerie = historial[historial.length - 1]?.series;
      if (ej.tipo === "tiempo") {
        const ultimoObjetivo =
          ultimaSerie?.length ? Math.max(...ultimaSerie.map((s) => s.segundos)) : ej.duracionObjetivo;
        return { ...ej, historial, duracionObjetivo: historial.length > 0 ? ultimoObjetivo : ej.duracionObjetivo };
      }
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

// Estimación de tiempo activo por serie de fuerza (ejecución + ajustar
// peso/asiento) para calcular una duración total aproximada — no medimos
// tiempo real de sesión, así que esto es sólo una aproximación razonable.
const SEGUNDOS_ACTIVOS_POR_SERIE = 45;

// A qué día(s) confirmó explícitamente cada fecha `marcarSesionDia`. Sirve
// para desambiguar sesiones de ejercicios compartidos entre días: sin
// esto, una fecha en la que sólo se entrenó Día A pero que comparte algún
// ejercicio con Día C generaba también una sesión fantasma para Día C
// (con esa fecha en su propio historial), y al haber dos sesiones con la
// misma fecha, cuál "ganaba" en el backend dependía del orden de los días.
function fechasConfirmadasPorDia(dias) {
  const porFecha = new Map();
  dias.forEach((d) => {
    (d.sesionesFechas ?? []).forEach((fecha) => {
      if (!porFecha.has(fecha)) porFecha.set(fecha, new Set());
      porFecha.get(fecha).add(d.id);
    });
  });
  return porFecha;
}

export function construirSesiones(dias) {
  const sesiones = [];
  const confirmadas = fechasConfirmadasPorDia(dias);
  dias.forEach((dia) => {
    const fechas = [
      ...new Set(dia.ejercicios.flatMap((e) => e.historial.map((h) => h.fecha))),
    ].filter((fecha) => {
      const diasQueLaConfirman = confirmadas.get(fecha);
      // Si ningún día confirmó explícitamente esta fecha (historial viejo,
      // de antes de sesionesFechas), se mantiene el heurístico anterior:
      // se incluye en todos los días donde aparezca en el historial.
      return !diasQueLaConfirman || diasQueLaConfirman.has(dia.id);
    });

    fechas.forEach((fecha) => {
      const entradas = dia.ejercicios
        .map((e) => {
          const entrada = e.historial.find((h) => h.fecha === fecha);
          return entrada ? { e, entrada } : null;
        })
        .filter(Boolean);

      const ejercicios = entradas.map(({ e, entrada }) => {
        if (e.tipo === "cardio") {
          return { nombre: e.nombre, tipo: "cardio", duracion: entrada.duracion, distancia: entrada.distancia, series: [] };
        }
        if (e.tipo === "tiempo") {
          return { nombre: e.nombre, tipo: "tiempo", series: entrada.series };
        }
        return { nombre: e.nombre, series: entrada.series };
      });
      // Sólo suma series con peso/reps (fuerza) — una serie de tiempo
      // ({segundos}, sin esos campos) daría NaN, y como la suma es
      // contagiosa el volumen de toda la sesión quedaría NaN apenas
      // hubiera un ejercicio de tiempo ese día.
      const volumen_kg = ejercicios.reduce(
        (sum, e) =>
          sum +
          (e.series?.reduce(
            (s, serie) => s + (serie.peso != null && serie.reps != null ? serie.peso * serie.reps : 0),
            0
          ) ?? 0),
        0
      );

      const minutosCardio = entradas
        .filter(({ e }) => e.tipo === "cardio")
        .reduce((sum, { entrada }) => sum + (entrada.duracion ?? 0), 0);

      // Fuerza/tiempo no miden duración real: se estima con el tiempo activo
      // por serie (o los segundos sostenidos, para tipo "tiempo") más el
      // descanso entre series (no después de la última).
      const segundosEstimados = entradas
        .filter(({ e }) => e.tipo !== "cardio")
        .reduce((sum, { e, entrada }) => {
          const numSeries = entrada.series?.length ?? 0;
          if (numSeries === 0) return sum;
          const activo =
            e.tipo === "tiempo"
              ? entrada.series.reduce((s, serie) => s + (serie.segundos ?? 0), 0)
              : numSeries * SEGUNDOS_ACTIVOS_POR_SERIE;
          const descansos = Math.max(0, numSeries - 1) * (e.descanso ?? 0);
          return sum + activo + descansos;
        }, 0);

      const duracion_min = Math.round(minutosCardio + segundosEstimados / 60) || null;
      sesiones.push({ fecha, dia: dia.nombre, ejercicios, volumen_kg, duracion_min });
    });
  });
  return sesiones.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
