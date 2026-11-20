const VERSION = 1;

export function exportarRutina(dias) {
  return JSON.stringify({ v: VERSION, dias });
}

// Parsea y valida el JSON exportado. Preserva el historial y ajustes de
// ejercicios que coincidan por id con los actuales (útil al re-importar).
export function importarRutina(texto, diasActuales = []) {
  let parsed;
  try {
    parsed = JSON.parse(texto);
  } catch {
    throw new Error("El texto no es un JSON válido.");
  }

  const dias = Array.isArray(parsed) ? parsed : parsed?.dias;
  if (!Array.isArray(dias) || dias.length === 0) {
    throw new Error("No se encontraron días en la rutina.");
  }

  const ejerciciosActuales = diasActuales.flatMap((d) => d.ejercicios);

  return dias.map((d) => ({
    ...d,
    ejercicios: (d.ejercicios ?? []).map((e) => {
      const existente = ejerciciosActuales.find((ea) => ea.id === e.id);
      return {
        ...e,
        historial: existente?.historial ?? [],
        ajustes: existente?.ajustes ?? [],
      };
    }),
  }));
}

export function resumenDias(dias) {
  const ne = dias.reduce((n, d) => n + d.ejercicios.length, 0);
  const nd = dias.length;
  return `${nd} día${nd !== 1 ? "s" : ""}, ${ne} ejercicio${ne !== 1 ? "s" : ""}`;
}
