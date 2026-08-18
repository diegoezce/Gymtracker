const genId = (nombre) =>
  nombre.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).slice(2, 6);

// repsMin/repsMax definen el rango; repsObjetivo arranca en repsMin y sube con la carga
export const ejercicio = (nombre, peso, incremento = 2.5, series = 3, repsMin = 8, repsMax = null, descanso = 90) => ({
  id: genId(nombre),
  tipo: "fuerza",
  nombre,
  peso,
  incremento,
  series,
  repsMin,
  repsMax,
  repsObjetivo: repsMin,
  descanso,
  ajustes: [],
  historial: [],
});

// historial: [{ fecha, duracion, distancia }]
export const ejercicioCardio = (nombre, duracionMin = 30, distanciaKm = null) => ({
  id: genId(nombre),
  tipo: "cardio",
  nombre,
  duracionMin,
  distanciaKm,
  historial: [],
});

// Series por tiempo (planchas, isométricos): cada serie es una ronda
// sostenida `duracionObjetivo` segundos. Sin peso ni ajustes — no hay
// override manual que aprender en esta primera versión.
// historial: [{ fecha, series: [{ segundos }] }]
export const ejercicioTiempo = (nombre, duracionObjetivo = 30, series = 3, descanso = 60, incremento = 5) => ({
  id: genId(nombre),
  tipo: "tiempo",
  nombre,
  duracionObjetivo,
  series,
  descanso,
  incremento,
  historial: [],
});

// ── ejercicios compartidos entre días ──────────────────────────
// Dos ejercicios en días distintos con el mismo `id` se consideran el
// mismo movimiento: peso/incremento/repsObjetivo/ajustes/historial se
// mantienen sincronizados entre copias. Series/reps/descanso (o
// duración/distancia en cardio) quedan libres para variar por día.

const CAMPOS_COMPARTIDOS = ["id", "tipo", "nombre", "peso", "incremento", "repsObjetivo", "duracionObjetivo", "ajustes", "historial", "tecnica", "imagenUrl"];

function camposCompartidos(ej) {
  const out = {};
  CAMPOS_COMPARTIDOS.forEach((k) => {
    if (k in ej) out[k] = ej[k];
  });
  return out;
}

export function diasDondeAparece(dias, id) {
  return dias.filter((d) => d.ejercicios.some((e) => e.id === id)).map((d) => d.nombre);
}

// true si quitar este ejercicio del único día donde aparece se lleva puesto
// su historial. Si está compartido en otro día, la otra copia lo conserva.
export function quitarPierdeHistorial(dias, id) {
  const ej = dias.flatMap((d) => d.ejercicios).find((e) => e.id === id);
  if (!ej?.historial?.length) return false;
  return diasDondeAparece(dias, id).length === 1;
}

// ── días ────────────────────────────────────────────────────────

export function crearDia(nombre) {
  return { id: genId(nombre), nombre, ejercicios: [] };
}

// true si borrar este día se lleva puesto historial que no sobrevive en
// ningún otro día — mismo criterio que quitarPierdeHistorial, por
// ejercicio del día.
export function diaPierdeHistorial(dias, diaId) {
  const dia = dias.find((d) => d.id === diaId);
  if (!dia) return false;
  return dia.ejercicios.some((e) => quitarPierdeHistorial(dias, e.id));
}

// Sube (-1) o baja (1) un ejercicio un lugar dentro de su día. No-op en
// los extremos; no afecta otros días.
export function moverEjercicioOrden(dias, diaId, ejId, direccion) {
  return dias.map((d) => {
    if (d.id !== diaId) return d;
    const idx = d.ejercicios.findIndex((e) => e.id === ejId);
    const destino = idx + direccion;
    if (idx === -1 || destino < 0 || destino >= d.ejercicios.length) return d;
    const ejercicios = [...d.ejercicios];
    [ejercicios[idx], ejercicios[destino]] = [ejercicios[destino], ejercicios[idx]];
    return { ...d, ejercicios };
  });
}

// Aplica `cambios` (subset de campos compartidos) a todo ejercicio, en
// cualquier día, cuyo id coincida.
export function actualizarCompartido(dias, id, cambios) {
  return dias.map((d) => ({
    ...d,
    ejercicios: d.ejercicios.map((e) => (e.id === id ? { ...e, ...cambios } : e)),
  }));
}

// ── edición de historial ───────────────────────────────────────

// Reemplaza la entrada con la misma fecha si ya existe (evita duplicados
// cuando el mismo ejercicio se cierra dos veces el mismo día, p.ej. por
// estar vinculado a dos días entrenados la misma fecha); si no, la agrega.
export function agregarEntradaHistorial(historial, entrada) {
  return [...historial.filter((h) => h.fecha !== entrada.fecha), entrada].slice(-40);
}

// Edita una entrada existente de `historial` (ubicada por fecha original) y
// propaga el cambio a todas las copias del ejercicio compartidas entre
// días. `cambios` puede incluir una nueva `fecha` y los campos propios del
// tipo de ejercicio (series / duracion / distancia). Si la nueva fecha
// choca con otra entrada ya existente, la edición reemplaza a esa entrada.
// No toca peso/repsObjetivo/incremento/ajustes: la progresión sigue
// evolucionando hacia adelante, esto sólo corrige el registro.
export function editarEntradaHistorial(dias, ejId, fechaOriginal, cambios) {
  const ej = dias.flatMap((d) => d.ejercicios).find((e) => e.id === ejId);
  if (!ej) return dias;
  const idx = ej.historial.findIndex((h) => h.fecha === fechaOriginal);
  if (idx === -1) return dias;
  const editada = { ...ej.historial[idx], ...cambios };
  let historial = ej.historial.map((h, i) => (i === idx ? editada : h));
  if (cambios.fecha && cambios.fecha !== fechaOriginal) {
    historial = historial.filter((h, i) => i === idx || h.fecha !== cambios.fecha);
  }
  historial = [...historial].sort((a, b) => a.fecha.localeCompare(b.fecha));
  return actualizarCompartido(dias, ejId, { historial });
}

// Borra una entrada de `historial` por fecha, propagando entre copias
// compartidas del mismo ejercicio.
export function eliminarEntradaHistorial(dias, ejId, fecha) {
  const ej = dias.flatMap((d) => d.ejercicios).find((e) => e.id === ejId);
  if (!ej) return dias;
  return actualizarCompartido(dias, ejId, { historial: ej.historial.filter((h) => h.fecha !== fecha) });
}

// Agrega a `diaDestinoId` una copia de `ejFuente` que preserva su id y
// campos compartidos; `configDia` son los campos propios de ese día
// (series/repsMin/repsMax/descanso, o duracionMin/distanciaKm en cardio),
// con default tomado del propio ejFuente si no se especifican.
export function vincularEjercicio(dias, ejFuente, diaDestinoId, configDia = {}) {
  const compartido = camposCompartidos(ejFuente);
  const configDefault =
    ejFuente.tipo === "cardio"
      ? { duracionMin: ejFuente.duracionMin ?? 30, distanciaKm: ejFuente.distanciaKm ?? null }
      : ejFuente.tipo === "tiempo"
      ? { series: ejFuente.series ?? 3, descanso: ejFuente.descanso ?? 60 }
      : {
          series: ejFuente.series ?? 3,
          repsMin: ejFuente.repsMin ?? 8,
          repsMax: ejFuente.repsMax ?? null,
          descanso: ejFuente.descanso ?? 90,
        };
  const nuevo = { ...compartido, ...configDefault, ...configDia };
  return dias.map((d) => (d.id !== diaDestinoId ? d : { ...d, ejercicios: [...d.ejercicios, nuevo] }));
}

// Candidatos para "usar existente" en `diaId`: ejercicios de otros días,
// deduplicados por id, que todavía no están en `diaId`.
export function ejerciciosVinculables(dias, diaId) {
  const enEsteDia = new Set(dias.find((d) => d.id === diaId)?.ejercicios.map((e) => e.id) ?? []);
  const vistos = new Set();
  const resultado = [];
  dias.forEach((d) => {
    if (d.id === diaId) return;
    d.ejercicios.forEach((e) => {
      if (enEsteDia.has(e.id) || vistos.has(e.id)) return;
      vistos.add(e.id);
      resultado.push({ ...e, diasDonde: diasDondeAparece(dias, e.id) });
    });
  });
  return resultado;
}

// Reconcilia ejercicios compartidos (mismo id en más de un día) cuyas
// copias de historial se desincronizaron — típicamente después de
// restaurar desde HC, donde cada día se reconstruye por separado a partir
// de sesiones logueadas con (día, nombre). Une+ordena+dedupea el
// historial de todas las copias y recalcula peso/repsObjetivo/incremento/
// ajustes desde la entrada más reciente, aplicando el resultado a todas.
export function resincronizarCompartidos(dias) {
  const grupos = {};
  dias.forEach((d) => d.ejercicios.forEach((e) => (grupos[e.id] ??= []).push(e)));

  const mergeados = {};
  Object.entries(grupos).forEach(([id, ejs]) => {
    if (ejs.length < 2) return;
    const porFecha = new Map();
    ejs.forEach((e) => (e.historial ?? []).forEach((h) => porFecha.set(h.fecha, h)));
    const historial = [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-40);
    const masReciente = ejs.reduce((mejor, e) => {
      const f = e.historial?.[e.historial.length - 1]?.fecha ?? "";
      const fMejor = mejor.historial?.[mejor.historial.length - 1]?.fecha ?? "";
      return f > fMejor ? e : mejor;
    }, ejs[0]);
    mergeados[id] =
      ejs[0].tipo === "cardio"
        ? { historial }
        : ejs[0].tipo === "tiempo"
        ? { historial, duracionObjetivo: masReciente.duracionObjetivo, incremento: masReciente.incremento }
        : {
            historial,
            peso: masReciente.peso,
            repsObjetivo: masReciente.repsObjetivo,
            incremento: masReciente.incremento,
            ajustes: masReciente.ajustes,
          };
  });

  if (Object.keys(mergeados).length === 0) return dias;
  return dias.map((d) => ({
    ...d,
    ejercicios: d.ejercicios.map((e) => (mergeados[e.id] ? { ...e, ...mergeados[e.id] } : e)),
  }));
}

export const RUTINA_INICIAL = [
  {
    id: "a",
    nombre: "Día A",
    ejercicios: [
      ejercicio("Prensa de piernas",              100, 5,   4, 8,  10, 120),
      ejercicio("Press banca inclinado mancuernas", 18, 2,   4, 8,  10, 120),
      ejercicio("Remo con apoyo de pecho",          50, 2.5, 4, 10, 12,  90),
      ejercicio("Curl femoral sentado",             35, 5,   3, 10, 12,  90),
      ejercicio("Elevaciones laterales",            10, 2,   3, 12, 15,  60),
      ejercicio("Extensión tríceps en polea",       18, 2.5, 3, 10, 12,  60),
      ejercicioCardio("Cardio", 20),
    ],
  },
  {
    id: "b",
    nombre: "Día B",
    ejercicios: [
      ejercicio("Hip thrust con barra",          70, 5,   4, 8,  10, 120),
      ejercicio("Jalón al pecho agarre neutro",  55, 2.5, 4, 8,  10, 120),
      ejercicio("Press de pecho en máquina",     55, 5,   3, 10, 12,  90),
      ejercicio("Extensión de cuádriceps",       40, 5,   3, 12, 15,  90),
      ejercicio("Landmine press",                20, 2.5, 3, 8,  10,  90),
      ejercicio("Curl de bíceps con mancuernas", 12, 2,   3, 10, 12,  60),
      ejercicioCardio("Cardio", 20),
    ],
  },
  {
    id: "c",
    nombre: "Día C",
    ejercicios: [
      ejercicio("Sentadilla búlgara con mancuernas", 16, 2, 3, 8, 10, 120),
      ejercicio("Peso muerto rumano",                60, 5, 3, 8, 10, 120),
      ejercicioCardio("Cardio", 20),
    ],
  },
];
