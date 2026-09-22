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

// "Día A", "Día B", "Dia 1" son los nombres que vienen por defecto: no
// dicen nada del contenido. Cualquier otra cosa la puso el usuario.
const NOMBRE_GENERICO = /^d[ií]a\s+\S+$/i;

export function esNombreGenerico(nombre) {
  return NOMBRE_GENERICO.test((nombre ?? "").trim());
}

/**
 * Qué mostrar debajo del nombre del día para saber de qué va.
 *
 * Si le pusiste un nombre propio ("Pierna + Empuje"), ese nombre ya lo
 * dice y repetir ejercicios sería ruido. Si todavía tiene el genérico
 * ("Día A"), los primeros ejercicios son lo que de verdad lo distingue —
 * y como el orden se controla en Ajustes, controlás qué aparece acá.
 *
 * Devuelve null cuando no hay nada útil que agregar.
 */
export function descripcionDia(dia, max = 3) {
  if (!dia?.ejercicios?.length) return null;
  if (!esNombreGenerico(dia.nombre)) return null;
  return dia.ejercicios.slice(0, max).map((e) => e.nombre).join(" · ");
}
