import { ultimaFechaDia } from "./rutina";

// Cuándo se entrenó este día por última vez. `ultimaSesion` es el dato
// confiable (lo estampa marcarSesionDia); ultimaFechaDia es el heurístico
// de migración para días anteriores a ese campo. Devuelve null si nunca.
export function ultimaVezDia(dias, dia) {
  return dia.ultimaSesion ?? ultimaFechaDia(dias, dia.id) ?? null;
}

/**
 * Qué día toca entrenar: el que hace más que no se entrena. Un día sin
 * ningún registro tiene prioridad máxima — es el que falta estrenar.
 *
 * Ante empate gana el que viene primero en la rutina (Array.sort es
 * estable), así el orden que definiste en Ajustes desempata.
 */
export function sugerirDia(dias) {
  if (!dias?.length) return null;
  return [...dias].sort((a, b) => {
    const fa = ultimaVezDia(dias, a);
    const fb = ultimaVezDia(dias, b);
    if (!fa && !fb) return 0;
    if (!fa) return -1;
    if (!fb) return 1;
    return fa.localeCompare(fb); // más antigua primero
  })[0];
}

/**
 * Cuántas sesiones se registraron. Una sesión es una fecha de calendario,
 * sin importar cuántos ejercicios (o días de rutina, si están compartidos)
 * se entrenaron ese día.
 */
export function contarSesiones(dias, ahora = new Date()) {
  const fechas = [
    ...new Set((dias ?? []).flatMap((d) => d.ejercicios.flatMap((e) => (e.historial ?? []).map((h) => h.fecha)))),
  ].sort();

  const estaSemana = fechas.filter((f) => (ahora - new Date(f)) / 86400000 < 7).length;
  const esteMes = fechas.filter((f) => {
    const d = new Date(f);
    return d.getUTCMonth() === ahora.getUTCMonth() && d.getUTCFullYear() === ahora.getUTCFullYear();
  }).length;

  return { fechas, estaSemana, esteMes, total: fechas.length, ultima: fechas[fechas.length - 1] ?? null };
}
