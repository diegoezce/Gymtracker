// Aviso de solapamiento entre el día extra y los días fijos.
//
// El Día D es un extra opcional de accesorios: hay semanas que se hace y
// semanas que no, así que A/B/C conservan todos sus accesorios. Eso deja
// ejercicios repetidos a propósito (tríceps, laterales, face pull), y la
// semana que sí se hace D conviene saber, al abrir A/B/C, qué ya se trabajó
// hace poco — y al revés, al abrir D, qué ya salió en A/B/C.
//
// Es sólo un aviso: no oculta, no bloquea, no toca el ejercicio. La
// decisión de hacerlo liviano o saltearlo es del momento.

import { diasDondeAparece } from "./rutina";
import { mismoNombre } from "./nombre";

// Cuántos días hacia atrás se considera "hace poco".
export const DIAS_VENTANA = 7;

// Días que son extra opcionales, por id. El aviso va sólo entre un día
// extra y los fijos: avisar entre cualquier par de días marcaría Prensa en
// el Día C cada vez que se entrena el A, que es repetición planeada y sería
// ruido constante.
export const DIAS_EXTRA = ["d"];

const esExtra = (dia) => DIAS_EXTRA.includes(dia.id);

/** Los días con los que tiene sentido cruzar, visto desde `diaActual`. */
function diasAComparar(dias, diaActual) {
  return (dias ?? []).filter(
    (d) => d.id !== diaActual.id && esExtra(d) !== esExtra(diaActual)
  );
}

// Restar días en UTC: las fechas se guardan como "YYYY-MM-DD" (un día de
// calendario, no un instante), así que compararlas como texto es exacto y
// no depende de la zona horaria del teléfono.
function desdeHace(dias, hoy) {
  const d = new Date(`${hoy}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Si este ejercicio ya se hizo hace poco en un día del otro grupo.
 *
 * Cruza por id, que es el vínculo fuerte, y cae a nombre normalizado cuando
 * los ids no coinciden — pasa cuando el mismo movimiento quedó cargado dos
 * veces con ids distintos.
 *
 * La fecha tiene que estar a la vez en el historial del ejercicio y en las
 * `sesionesFechas` del otro día: que el ejercicio se haya hecho el martes no
 * alcanza, tiene que haber sido en una sesión de ESE día.
 *
 * @returns {{ dia: string, fecha: string } | null} el día y la fecha más reciente
 */
export function hechoEnOtroDia(dias, diaActual, ej, hoy) {
  if (!ej?.id || !diaActual) return null;
  const desde = desdeHace(DIAS_VENTANA, hoy);

  let mejor = null;
  diasAComparar(dias, diaActual).forEach((otro) => {
    const copia =
      otro.ejercicios.find((e) => e.id === ej.id) ??
      otro.ejercicios.find((e) => mismoNombre(e.nombre, ej.nombre));
    if (!copia) return;

    // El historial es compartido entre copias del mismo id, así que da igual
    // de cuál se lea; para el respaldo por nombre hay que mirar las dos,
    // porque con ids distintos cada una tiene el suyo.
    const fechasDelEj = new Set(
      [...(ej.historial ?? []), ...(copia.historial ?? [])].map((h) => h.fecha)
    );
    const entrenadas = otro.sesionesFechas ?? [];

    entrenadas.forEach((fecha) => {
      if (fecha < desde || fecha > hoy) return;
      if (!fechasDelEj.has(fecha)) return;
      if (!mejor || fecha > mejor.fecha) mejor = { dia: otro.nombre, fecha };
    });
  });

  return mejor;
}

/** Mapa ejId → { dia, fecha } para todos los ejercicios de un día. */
export function solapamientosDelDia(dias, diaActual, hoy) {
  const out = {};
  (diaActual?.ejercicios ?? []).forEach((ej) => {
    const aviso = hechoEnOtroDia(dias, diaActual, ej, hoy);
    if (aviso) out[ej.id] = aviso;
  });
  return out;
}

/** Cuántos días pasaron, en palabras, para la etiqueta. */
export function haceCuanto(fecha, hoy) {
  const dias = Math.round(
    (new Date(`${hoy}T00:00:00Z`) - new Date(`${fecha}T00:00:00Z`)) / 86400000
  );
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}
