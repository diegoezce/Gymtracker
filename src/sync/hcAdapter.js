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

      // Entradas que HC tiene para este ejercicio (match por nombre)
      const desdeHC = sesionesDelDia.flatMap((s) => {
        const ejHC = s.ejercicios.find((e) => e.nombre === ej.nombre);
        if (!ejHC) return [];
        return [
          ej.tipo === "cardio"
            ? { fecha: s.fecha, duracion: ejHC.duracion, distancia: ejHC.distancia }
            : { fecha: s.fecha, series: ejHC.series },
        ];
      });

      // FUSIONA con el historial local en vez de reemplazarlo: así no se
      // pierde el historial de ejercicios que nunca llegaron a HC (p.ej.
      // sesiones hechas con auto-sync apagado). Ante la misma fecha gana HC.
      const porFecha = new Map();
      (ej.historial ?? []).forEach((h) => porFecha.set(h.fecha, h));
      desdeHC.forEach((h) => porFecha.set(h.fecha, h));
      const historial = [...porFecha.values()]
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-40);

      if (ej.tipo === "cardio") {
        return { ...ej, historial };
      }
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

// A qué día(s) confirmó explícitamente cada fecha `marcarSesionDia`. HC
// guarda una sola sesión por fecha (ver construirSesiones), así que esto
// sólo se usa para armar la etiqueta `dia` informativa — nunca para decidir
// qué ejercicios entran, eso siempre es la unión de todos los días.
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

// Nombre de día a mostrar para una fecha. Si algún día confirmó
// explícitamente haberse entrenado esa fecha, se usan esos (lo normal: uno
// solo). Si ninguno la confirmó (historial viejo, de antes de
// sesionesFechas), se listan todos los días donde aparece algún ejercicio
// con esa fecha — puede ser ambiguo, pero es sólo para mostrar, nunca
// decide qué ejercicios se incluyen.
function nombreDiaPara(dias, fecha, diasQueLaConfirman) {
  const nombres = diasQueLaConfirman
    ? dias.filter((d) => diasQueLaConfirman.has(d.id)).map((d) => d.nombre)
    : dias.filter((d) => d.ejercicios.some((e) => e.historial.some((h) => h.fecha === fecha))).map((d) => d.nombre);
  return [...new Set(nombres)].join(" + ");
}

// HC guarda UNA sesión por fecha (upsert que la sobrescribe entera), así
// que arma exactamente una entrada por fecha, con la unión de TODOS los
// ejercicios entrenados ese día en cualquier día de la rutina — nunca por
// día de rutina. Antes se armaba una sesión por (día, fecha), y con
// historial viejo (sin sesionesFechas) una misma fecha podía generar dos
// sesiones con días distintos; como HC sólo se queda con una, cuál
// sobrevivía dependía del orden de los días y los ejercicios exclusivos del
// otro se perdían enteros al pushear.
export function construirSesiones(dias) {
  const confirmadas = fechasConfirmadasPorDia(dias);
  const todasFechas = [
    ...new Set(dias.flatMap((d) => d.ejercicios.flatMap((e) => e.historial.map((h) => h.fecha)))),
  ];

  return todasFechas
    .map((fecha) => {
      // Un ejercicio compartido entre días tiene el mismo id y el mismo
      // historial en todas sus copias — se toma una sola vez.
      const vistos = new Set();
      const entradas = [];
      dias.forEach((d) => {
        d.ejercicios.forEach((e) => {
          if (vistos.has(e.id)) return;
          const entrada = e.historial.find((h) => h.fecha === fecha);
          if (!entrada) return;
          vistos.add(e.id);
          entradas.push({ e, entrada });
        });
      });

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
      const dia = nombreDiaPara(dias, fecha, confirmadas.get(fecha));
      return { fecha, dia, ejercicios, volumen_kg, duracion_min };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
