import { fmt } from "../utils/format";

/**
 * Progresión basada en rango de reps:
 * - Si todas las series alcanzan repsMax → subir el mínimo incremento y volver a repsMin.
 * - Si dos sesiones seguidas al fallo → bajar el peso.
 * - En cualquier otro caso → repetir el mismo peso.
 *
 * Para ejercicios sin repsMax (legado) se mantiene la lógica original basada en RIR.
 *
 * @param {{peso: number, incremento: number, repsObjetivo: number, repsMin?: number, repsMax?: number, historial: Array}} ej
 * @param {Array<{peso: number, reps: number, rir: number}>} seriesHechas
 */
export function progresar(ej, seriesHechas) {
  if (ej.tipo === "cardio") return { peso: 0, repsObjetivo: 0, nota: "" };
  if (ej.tipo === "tiempo") {
    const todasAlTope = seriesHechas.every((s) => s.segundos >= ej.duracionObjetivo);
    const duracionObjetivo = todasAlTope ? ej.duracionObjetivo + ej.incremento : ej.duracionObjetivo;
    const nota = todasAlTope
      ? `Todas al tope. Próxima: ${duracionObjetivo}s.`
      : `Repetimos ${ej.duracionObjetivo}s.`;
    return { duracionObjetivo, nota };
  }
  const inc = ej.incremento;
  let peso = ej.peso;
  let repsObjetivo = ej.repsObjetivo;
  let nota = "";

  const ultimas = ej.historial.slice(-1)[0];
  const rirPrevio = ultimas?.series?.slice(-1)[0]?.rir;
  const rirFinal = seriesHechas[seriesHechas.length - 1]?.rir ?? 2;

  if (ej.repsMax != null) {
    const repsMin = ej.repsMin ?? ej.repsObjetivo;
    const todasAlTope = seriesHechas.every((s) => s.reps >= ej.repsMax);
    if (todasAlTope) {
      peso = ej.peso + inc;
      repsObjetivo = repsMin;
      nota = `Todas al tope. Próxima: ${fmt(peso)} kg, volvés a ${repsMin} reps.`;
    } else if (rirFinal === 0 && rirPrevio === 0) {
      peso = Math.max(inc, ej.peso - inc * 2);
      repsObjetivo = repsMin;
      nota = `Segunda al fallo seguida. Bajamos a ${fmt(peso)} kg.`;
    } else {
      nota = `Repetimos ${fmt(peso)} kg.`;
    }
  } else {
    if (rirFinal >= 3) {
      peso = ej.peso + inc;
      nota = `Sobró margen. Próxima: ${fmt(peso)} kg.`;
    } else if (rirFinal >= 1) {
      repsObjetivo = ej.repsObjetivo + 1;
      nota = `Mismo peso, buscá ${repsObjetivo} reps.`;
    } else {
      if (rirPrevio === 0) {
        peso = Math.max(inc, ej.peso - inc * 2);
        nota = `Segunda al fallo seguida. Bajamos a ${fmt(peso)} kg.`;
      } else {
        nota = `Al fallo. Repetimos ${fmt(peso)} kg.`;
      }
    }
  }
  return { peso, repsObjetivo, nota };
}

/**
 * Sugiere el peso de la PRÓXIMA serie dentro de la sesión en curso, mirando
 * cómo vino la serie recién hecha. Es autorregulación intra-sesión: distinto
 * de progresar(), que decide el peso de la próxima *sesión* al cerrar el
 * ejercicio.
 *
 * Arranca del peso de la última serie hecha (no de ej.peso), así respeta los
 * ajustes que el usuario ya hizo a mano durante la sesión.
 *
 * Devuelve null cuando no hay nada que sugerir: cardio, tiempo, o todavía no
 * se hizo ninguna serie (para la primera manda ej.peso, que ya viene de
 * progresar()).
 *
 * @param {{peso: number, incremento: number, repsObjetivo: number, repsMin?: number, repsMax?: number}} ej
 * @param {Array<{peso: number, reps: number, rir: number}>} seriesHechas
 * @returns {{peso: number, delta: number, motivo: string} | null}
 */
export function sugerirPeso(ej, seriesHechas) {
  if (ej.tipo === "cardio" || ej.tipo === "tiempo") return null;
  if (!seriesHechas?.length) return null;

  const ultima = seriesHechas[seriesHechas.length - 1];
  const previa = seriesHechas[seriesHechas.length - 2];
  if (ultima?.peso == null || ultima?.reps == null) return null;

  const inc = ej.incremento || 1;
  const min = ej.repsMin ?? ej.repsObjetivo;
  const max = ej.repsMax ?? ej.repsObjetivo;
  const base = ultima.peso;

  const bajar = (motivo) => ({ peso: Math.max(inc, base - inc), delta: -inc, motivo });
  const subir = (motivo) => ({ peso: base + inc, delta: inc, motivo });
  const mantener = (motivo) => ({ peso: base, delta: 0, motivo });

  // Dos al fallo seguidas: la fatiga ya se acumuló, bajar para sostener reps.
  if (ultima.rir === 0 && previa?.rir === 0) return bajar("Dos series al fallo seguidas");
  // Al fallo sin llegar al piso del rango: el peso es demasiado para hoy.
  if (ultima.rir === 0 && ultima.reps < min) return bajar(`Al fallo sin llegar a ${min} reps`);
  if (ultima.rir === 0) return mantener("Al fallo pero dentro del rango");
  // Techo del rango con margen de sobra: el peso quedó corto.
  if (ultima.rir >= 3 && ultima.reps >= max) return subir(`${ultima.reps} reps y te sobró margen`);
  // Margen pero sin llegar al techo: primero ganar reps, después peso.
  if (ultima.rir >= 3) return mantener(`Te sobró margen: buscá llegar a ${max} reps`);
  if (ultima.reps < min) return mantener(`Cortaste antes de ${min} reps`);
  return mantener("Vas en el rango");
}

/**
 * Aprende de cuándo el usuario le pisa la sugerencia de peso: si ajusta
 * manualmente en la misma dirección 3 veces seguidas, recalibra el salto.
 *
 * @param {{peso: number, incremento: number, ajustes: number[]}} ej
 * @param {number} pesoUsado
 */
export function aprender(ej, pesoUsado) {
  if (ej.tipo === "cardio" || ej.tipo === "tiempo") return { ajustes: [], incremento: ej.incremento ?? 0, aviso: "" };
  const delta = pesoUsado - ej.peso;
  if (Math.abs(delta) < 0.01) return { ajustes: [], incremento: ej.incremento, aviso: "" };
  const ajustes = [...(ej.ajustes || []), Math.sign(delta)].slice(-3);
  if (ajustes.length === 3 && Math.abs(ajustes.reduce((a, b) => a + b, 0)) === 3) {
    const sube = ajustes[0] > 0;
    const incremento = sube
      ? Math.round((ej.incremento + 1.25) * 100) / 100
      : Math.max(1.25, Math.round((ej.incremento - 1.25) * 100) / 100);
    return {
      ajustes: [],
      incremento,
      aviso: `Le venís pisando la sugerencia ${sube ? "para arriba" : "para abajo"}. Salto ajustado a ${fmt(incremento)} kg.`,
    };
  }
  return { ajustes, incremento: ej.incremento, aviso: "" };
}
