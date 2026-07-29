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
 * Aprende de cuándo el usuario le pisa la sugerencia de peso: si ajusta
 * manualmente en la misma dirección 3 veces seguidas, recalibra el salto.
 *
 * @param {{peso: number, incremento: number, ajustes: number[]}} ej
 * @param {number} pesoUsado
 */
export function aprender(ej, pesoUsado) {
  if (ej.tipo === "cardio") return { ajustes: [], incremento: 0, aviso: "" };
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
