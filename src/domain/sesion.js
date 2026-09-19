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
