// Lógica pura del estado de sesión (`sesion.progreso` / `hechos`), que
// vive sólo en memoria y en gym:sesion:v1 — nunca en `dias`.
//
// `progreso[ejId]` guarda las series parciales de un ejercicio que se dejó
// a medias al volver al menú del día. `hechos[ejId]` marca los ejercicios
// que ya se cerraron del todo y por lo tanto YA se escribieron al historial.

// Quita del progreso parcial al ejercicio que acaba de cerrarse. Sin esto,
// el parcial viejo sobrevive al cierre y `salirSesion` lo vuelve a volcar
// al historial: como agregarEntradaHistorial fusiona por fecha, las series
// parciales quedan sumadas a las de la sesión completa y el día termina
// con más series de las que se hicieron.
export function olvidarProgreso(progreso, ejId) {
  if (!progreso || !(ejId in progreso)) return progreso ?? {};
  const { [ejId]: _quitado, ...resto } = progreso;
  return resto;
}

// Entradas de `progreso` que corresponde volcar al historial al salir de
// la sesión: las que tienen series cargadas, no están salteadas ("hoy no
// lo hago") y no se cerraron ya durante la sesión — esas últimas ya
// escribieron su entrada al cerrarse y volcarlas de nuevo las duplicaría.
export function entradasAVolcar(progreso, { hechos = {}, saltados = {} } = {}) {
  return Object.entries(progreso ?? {}).filter(
    ([id, p]) => p?.series?.length > 0 && !saltados[id] && !hechos[id]
  );
}

/**
 * Edita un campo de una serie ya guardada en la sesión en curso.
 *
 * Corregir el PESO de la ÚLTIMA serie corrige también `pesoActual`, el
 * número de la tarjeta. No es cosmético: `guardarSerie` graba la próxima
 * serie con ese valor, así que si la tarjeta se queda con el peso viejo,
 * el error que se acaba de corregir se repite en la serie siguiente — y
 * además la tarjeta pasa a contradecir a la sugerencia, que sí lee las
 * series.
 *
 * Editar una serie anterior no mueve la tarjeta: la última serie sigue
 * siendo el dato más reciente de con cuánto se está levantando. Editar
 * reps o segundos tampoco, porque no dicen nada sobre el peso.
 *
 * @param {{series: Array, pesoActual: number}} sesion
 * @param {number} i índice de la serie a editar
 * @param {string} campo "peso" | "reps" | "segundos"
 * @param {number} valor
 */
export function editarSerie(sesion, i, campo, valor) {
  const series = (sesion.series ?? []).map((s, idx) => (idx !== i ? s : { ...s, [campo]: valor }));
  const esUltima = i === series.length - 1;
  return {
    ...sesion,
    series,
    pesoActual: esUltima && campo === "peso" ? valor : sesion.pesoActual,
  };
}

// Campos que `cerrarEjercicio` pisa al cerrar un ejercicio: la progresión
// calculada a partir de las series hechas. Se guardan en `sesion.cerrados`
// para poder volver atrás si el cierre fue un error.
const CAMPOS_DE_CIERRE = ["peso", "repsObjetivo", "incremento", "ajustes", "duracionObjetivo"];

/**
 * Foto de un ejercicio justo antes de cerrarlo.
 *
 * Sólo copia los campos que existen: restaurar `duracionObjetivo: undefined`
 * sobre un ejercicio de fuerza le agregaría la clave con valor vacío.
 */
export function instantaneaCierre(ej) {
  const foto = {};
  CAMPOS_DE_CIERRE.forEach((k) => {
    if (ej?.[k] !== undefined) foto[k] = ej[k];
  });
  return foto;
}

/**
 * Deshace el cierre de un ejercicio para poder seguir agregándole series.
 *
 * Es un *undo*, no una edición: saca la entrada de hoy del historial y la
 * devuelve a la sesión. Tiene que ser así porque `agregarEntradaHistorial`
 * concatena las series cuando ya hay una entrada de esa fecha — reabrir sin
 * sacarla duplicaría todo lo ya hecho al cerrar de nuevo. Y porque esa
 * concatenación es la que necesita un ejercicio compartido entrenado dos
 * veces el mismo día, no se puede cambiar por un reemplazo.
 *
 * Restaura además la progresión que el cierre ya había aplicado, así cerrar
 * dos veces no sube el peso dos veces ni acumula dos ajustes por la misma
 * sesión.
 *
 * @returns {{ campos: object, sesion: object }} campos para actualizarCompartido
 */
export function reabrirEjercicio(sesion, ej, fecha) {
  const historial = ej.historial ?? [];
  const entrada = historial.find((h) => h.fecha === fecha);
  const { [ej.id]: foto, ...cerrados } = sesion.cerrados ?? {};
  const { [ej.id]: _hecho, ...hechos } = sesion.hechos ?? {};

  const series = entrada?.series ?? [];
  const ultima = series[series.length - 1];

  return {
    campos: {
      ...(foto ?? {}),
      historial: historial.filter((h) => h.fecha !== fecha),
    },
    sesion: {
      ...sesion,
      series,
      // La tarjeta arranca en lo último que levantó, no en el peso de la
      // plantilla: la serie que viene es la continuación de esas.
      pesoActual: ultima?.peso ?? foto?.peso ?? ej.peso ?? 0,
      hechos,
      cerrados,
    },
  };
}

// ── reloj de la sesión ────────────────────────────────────────────
//
// Hasta ahora la duración que se mandaba a HM era una fórmula sobre el
// historial (45 s por serie + el descanso configurado). Esto mide el tiempo
// de verdad: arranca al empezar la sesión y para al terminarla.
//
// Acumula tiempo ACTIVO, no reloj de pared: al pausar se guarda lo corrido
// y el reloj se detiene, así una sesión pausada a la noche y retomada al
// otro día no suma las horas de por medio.

// Una sesión más larga que esto es casi seguro el reloj y no el
// entrenamiento: la app quedó abierta, o el teléfono se cerró sin pausar y
// la sesión siguió viva. En ese caso es más honesto no reportar nada y caer
// en la estimación vieja que mandar un número inventado.
export const MAX_MINUTOS_SESION = 240;

export function iniciarReloj(ahora = Date.now()) {
  return { inicio: ahora, acumulado: 0 };
}

export function pausarReloj(tiempo, ahora = Date.now()) {
  if (!tiempo?.inicio) return tiempo ?? null; // ya estaba en pausa
  return { inicio: null, acumulado: (tiempo.acumulado ?? 0) + Math.max(0, ahora - tiempo.inicio) };
}

export function reanudarReloj(tiempo, ahora = Date.now()) {
  if (tiempo?.inicio) return tiempo; // ya estaba corriendo
  return { inicio: ahora, acumulado: tiempo?.acumulado ?? 0 };
}

/**
 * Minutos activos de la sesión, o null si no hay un número confiable.
 *
 * Devuelve null —y no 0— cuando no se puede medir, para que quien lo use
 * distinga "no lo sé" de "duró cero" y pueda caer en la estimación.
 */
export function minutosDeSesion(tiempo, ahora = Date.now()) {
  if (!tiempo) return null;
  const corriendo = tiempo.inicio ? Math.max(0, ahora - tiempo.inicio) : 0;
  const minutos = Math.round(((tiempo.acumulado ?? 0) + corriendo) / 60000);
  if (minutos <= 0 || minutos > MAX_MINUTOS_SESION) return null;
  return minutos;
}
