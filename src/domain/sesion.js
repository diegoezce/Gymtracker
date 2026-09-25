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
