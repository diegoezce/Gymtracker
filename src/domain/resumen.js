// Resumen de lo hecho en una fecha, comparado contra el historial previo.
// Todo sale de números ya guardados: no hay nada que inferir ni adivinar.

const volumenDe = (series) =>
  (series ?? []).reduce(
    (sum, s) => sum + (s.peso != null && s.reps != null ? s.peso * s.reps : 0),
    0
  );

const pesoMaxDe = (series) =>
  (series ?? []).reduce((max, s) => (s.peso != null && s.peso > max ? s.peso : max), 0);

const repsDe = (series) => (series ?? []).reduce((sum, s) => sum + (s.reps ?? 0), 0);

const segundosMaxDe = (series) =>
  (series ?? []).reduce((max, s) => (s.segundos != null && s.segundos > max ? s.segundos : max), 0);

// Logros de un ejercicio de fuerza: compara lo de hoy contra la sesión
// anterior (para el "vs la vez pasada") y contra todo el historial previo
// (para los récords).
function logrosFuerza(hoy, previas) {
  const logros = [];
  const conSeries = previas.filter((h) => h.series?.length > 0);

  const pesoMax = pesoMaxDe(hoy.series);
  const volumen = volumenDe(hoy.series);
  const reps = repsDe(hoy.series);

  if (conSeries.length === 0) {
    logros.push({ tipo: "primera", texto: "Primera vez registrado" });
    return logros;
  }

  const maxHistorico = Math.max(...conSeries.map((h) => pesoMaxDe(h.series)));
  const maxVolumen = Math.max(...conSeries.map((h) => volumenDe(h.series)));
  const anterior = conSeries[conSeries.length - 1];
  const pesoAnterior = pesoMaxDe(anterior.series);
  const repsAnterior = repsDe(anterior.series);

  if (pesoMax > maxHistorico) {
    logros.push({ tipo: "pr-peso", texto: `PR de peso: ${pesoMax} kg`, detalle: `antes ${maxHistorico} kg` });
  } else if (pesoMax > pesoAnterior) {
    logros.push({
      tipo: "mas-peso",
      texto: `+${Math.round((pesoMax - pesoAnterior) * 100) / 100} kg vs la vez pasada`,
    });
  }

  if (volumen > maxVolumen) {
    logros.push({ tipo: "pr-volumen", texto: "Récord de volumen", detalle: `${volumen} kg` });
  }

  // Sólo cuenta como "más reps" si el peso no cambió: con más peso, menos
  // reps no es un retroceso, y con menos peso más reps no es un avance.
  if (pesoMax === pesoAnterior && reps > repsAnterior) {
    logros.push({ tipo: "mas-reps", texto: `+${reps - repsAnterior} reps al mismo peso` });
  }

  return logros;
}

function logrosTiempo(hoy, previas) {
  const conSeries = previas.filter((h) => h.series?.length > 0);
  const maxHoy = segundosMaxDe(hoy.series);
  if (conSeries.length === 0) return [{ tipo: "primera", texto: "Primera vez registrado" }];
  const maxHistorico = Math.max(...conSeries.map((h) => segundosMaxDe(h.series)));
  if (maxHoy > maxHistorico) {
    return [{ tipo: "pr-tiempo", texto: `Récord: ${maxHoy}s`, detalle: `antes ${maxHistorico}s` }];
  }
  return [];
}

function logrosCardio(hoy, previas) {
  if (previas.length === 0) return [{ tipo: "primera", texto: "Primera vez registrado" }];
  const logros = [];
  const maxDur = Math.max(...previas.map((h) => h.duracion ?? 0));
  const maxDist = Math.max(...previas.map((h) => h.distancia ?? 0));
  if ((hoy.duracion ?? 0) > maxDur) {
    logros.push({ tipo: "pr-duracion", texto: `Récord de duración: ${hoy.duracion} min` });
  }
  if (hoy.distancia != null && hoy.distancia > maxDist) {
    logros.push({ tipo: "pr-distancia", texto: `Récord de distancia: ${hoy.distancia} km` });
  }
  return logros;
}

/**
 * Arma el resumen de lo entrenado en `fecha`: qué ejercicios se hicieron,
 * con qué series, y qué avances hubo respecto del historial previo.
 *
 * Un ejercicio compartido entre días (mismo id) cuenta una sola vez.
 * Devuelve null si esa fecha no tiene nada registrado.
 */
export function resumenSesion(dias, fecha) {
  const vistos = new Set();
  const ejercicios = [];

  dias.forEach((d) => {
    d.ejercicios.forEach((ej) => {
      if (vistos.has(ej.id)) return;
      const entrada = ej.historial?.find((h) => h.fecha === fecha);
      if (!entrada) return;
      vistos.add(ej.id);

      const previas = (ej.historial ?? []).filter((h) => h.fecha !== fecha);
      const base = { id: ej.id, nombre: ej.nombre, tipo: ej.tipo };

      if (ej.tipo === "cardio") {
        ejercicios.push({
          ...base,
          duracion: entrada.duracion ?? 0,
          distancia: entrada.distancia ?? null,
          series: [],
          volumen: 0,
          logros: logrosCardio(entrada, previas),
        });
        return;
      }

      const series = entrada.series ?? [];
      if (ej.tipo === "tiempo") {
        ejercicios.push({
          ...base,
          series,
          volumen: 0,
          segundosMax: segundosMaxDe(series),
          logros: logrosTiempo(entrada, previas),
        });
        return;
      }

      ejercicios.push({
        ...base,
        series,
        volumen: volumenDe(series),
        pesoMax: pesoMaxDe(series),
        reps: repsDe(series),
        logros: logrosFuerza(entrada, previas),
      });
    });
  });

  if (ejercicios.length === 0) return null;

  const totales = {
    ejercicios: ejercicios.length,
    series: ejercicios.reduce((n, e) => n + e.series.length, 0),
    volumen: ejercicios.reduce((n, e) => n + e.volumen, 0),
    minutosCardio: ejercicios
      .filter((e) => e.tipo === "cardio")
      .reduce((n, e) => n + (e.duracion ?? 0), 0),
  };

  const logros = ejercicios.flatMap((e) => e.logros.map((l) => ({ ...l, ejercicio: e.nombre })));

  return { fecha, ejercicios, totales, logros };
}
