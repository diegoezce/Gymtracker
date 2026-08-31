import { describe, expect, it } from "vitest";
import { aplicarRutina, aplicarSesiones, construirSesiones } from "./hcAdapter";

const HIST = [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }] }];

function diasLocales() {
  return [
    {
      id: "a",
      nombre: "Día A",
      ejercicios: [
        { id: "banca1", nombre: "Press banca", peso: 60, series: 3, historial: HIST },
        { id: "solo-local", nombre: "Ejercicio sólo local", peso: 20, series: 3, historial: HIST },
      ],
    },
    { id: "z", nombre: "Día sólo local", ejercicios: [] },
  ];
}

describe("aplicarRutina", () => {
  it("reemplaza la estructura local por la de HC", () => {
    const rutinaHC = [
      { id: "a", nombre: "Día A renombrado", ejercicios: [{ id: "banca1", nombre: "Press banca", peso: 80, series: 5 }] },
    ];
    const resultado = aplicarRutina(rutinaHC, diasLocales());

    // el día que sólo estaba local desaparece, y gana el nombre/config de HC
    expect(resultado.map((d) => d.id)).toEqual(["a"]);
    expect(resultado[0].nombre).toBe("Día A renombrado");
    expect(resultado[0].ejercicios.map((e) => e.id)).toEqual(["banca1"]);
    expect(resultado[0].ejercicios[0].peso).toBe(80);
    expect(resultado[0].ejercicios[0].series).toBe(5);
  });

  it("preserva el historial local del ejercicio que coincide por id", () => {
    const rutinaHC = [
      { id: "a", nombre: "Día A", ejercicios: [{ id: "banca1", nombre: "Press banca", peso: 80, series: 5 }] },
    ];
    const resultado = aplicarRutina(rutinaHC, diasLocales());
    expect(resultado[0].ejercicios[0].historial).toEqual(HIST);
  });

  it("deja historial vacío para ejercicios de HC que no existían localmente", () => {
    const rutinaHC = [
      { id: "a", nombre: "Día A", ejercicios: [{ id: "nuevo-de-hc", nombre: "Remo", peso: 50, series: 3 }] },
    ];
    const resultado = aplicarRutina(rutinaHC, diasLocales());
    expect(resultado[0].ejercicios[0].historial).toEqual([]);
  });

  it("no cruza historial entre días distintos aunque el id coincida", () => {
    // el id sólo se busca dentro del día correspondiente de HC
    const rutinaHC = [
      { id: "b", nombre: "Día B", ejercicios: [{ id: "banca1", nombre: "Press banca", peso: 80, series: 5 }] },
    ];
    const resultado = aplicarRutina(rutinaHC, diasLocales());
    expect(resultado[0].ejercicios[0].historial).toEqual([]);
  });
});

describe("aplicarSesiones con tipo tiempo", () => {
  it("reconstruye el historial y recalcula duracionObjetivo desde la última sesión", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [{ id: "plancha1", tipo: "tiempo", nombre: "Plancha", duracionObjetivo: 30, historial: [] }],
      },
    ];
    const sesiones = [
      { fecha: "2026-07-01", dia: "Día A", ejercicios: [{ nombre: "Plancha", tipo: "tiempo", series: [{ segundos: 30 }] }] },
      { fecha: "2026-07-08", dia: "Día A", ejercicios: [{ nombre: "Plancha", tipo: "tiempo", series: [{ segundos: 35 }] }] },
    ];
    const resultado = aplicarSesiones(dias, sesiones);
    const plancha = resultado[0].ejercicios[0];
    expect(plancha.historial).toHaveLength(2);
    expect(plancha.duracionObjetivo).toBe(35);
  });

  it("no toca duracionObjetivo si no hay sesiones para ese ejercicio", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [{ id: "plancha1", tipo: "tiempo", nombre: "Plancha", duracionObjetivo: 30, historial: [] }],
      },
    ];
    const resultado = aplicarSesiones(dias, []);
    expect(resultado[0].ejercicios[0].duracionObjetivo).toBe(30);
  });
});

describe("aplicarSesiones preserva historial local no presente en HC", () => {
  it("no borra el historial local de un ejercicio ausente en HC", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [
          {
            id: "elev1",
            tipo: "fuerza",
            nombre: "Elevaciones laterales",
            peso: 6,
            historial: [{ fecha: "2026-08-01", series: [{ peso: 6, reps: 12, rir: 1 }] }],
          },
        ],
      },
    ];
    // HC no tiene ninguna sesión de este ejercicio
    const resultado = aplicarSesiones(dias, []);
    expect(resultado[0].ejercicios[0].historial).toHaveLength(1);
    expect(resultado[0].ejercicios[0].historial[0].fecha).toBe("2026-08-01");
  });

  it("fusiona historial local con el de HC uniendo por fecha", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [
          {
            id: "elev1",
            tipo: "fuerza",
            nombre: "Elevaciones laterales",
            peso: 6,
            historial: [{ fecha: "2026-08-01", series: [{ peso: 6, reps: 12, rir: 1 }] }],
          },
        ],
      },
    ];
    const sesiones = [
      { fecha: "2026-08-08", dia: "Día A", ejercicios: [{ nombre: "Elevaciones laterales", series: [{ peso: 8, reps: 12, rir: 0 }] }] },
    ];
    const resultado = aplicarSesiones(dias, sesiones);
    const fechas = resultado[0].ejercicios[0].historial.map((h) => h.fecha);
    expect(fechas).toEqual(["2026-08-01", "2026-08-08"]);
  });
});

describe("aplicarSesiones con ejercicio compartido entre días", () => {
  // Reproduce el caso real: por el bug de construirSesiones (ya corregido),
  // TODAS las sesiones históricas en HC quedaron etiquetadas "Día C", aunque
  // varias en realidad se entrenaron desde Día A. Como "Prensa de piernas"
  // está compartida (mismo id en ambos días), su historial no debería
  // depender de qué día quedó anotado en la sesión.
  function diasConPrensaCompartida() {
    return [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [{ id: "prensa", tipo: "fuerza", nombre: "Prensa de piernas", peso: 80, historial: [] }],
      },
      {
        id: "c",
        nombre: "Día C",
        ejercicios: [{ id: "prensa", tipo: "fuerza", nombre: "Prensa de piernas", peso: 80, historial: [] }],
      },
    ];
  }

  const sesionesMalEtiquetadas = [
    { fecha: "2026-08-24", dia: "Día C", ejercicios: [{ nombre: "Prensa de piernas", series: [{ peso: 97, reps: 10, rir: 1 }] }] },
    { fecha: "2026-08-31", dia: "Día C", ejercicios: [{ nombre: "Prensa de piernas", series: [{ peso: 86, reps: 9, rir: 0 }] }] },
  ];

  it("le llega el historial completo a la copia de Día A aunque HC etiquete todo como Día C", () => {
    const resultado = aplicarSesiones(diasConPrensaCompartida(), sesionesMalEtiquetadas);
    const prensaA = resultado.find((d) => d.id === "a").ejercicios[0];
    expect(prensaA.historial).toHaveLength(2);
    expect(prensaA.peso).toBe(86); // peso de la sesión más reciente (31/08)
  });

  it("un ejercicio NO compartido sigue filtrando por día (sin falsos positivos)", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [{ id: "solo-a", tipo: "fuerza", nombre: "Curl bíceps", peso: 20, historial: [] }],
      },
      { id: "c", nombre: "Día C", ejercicios: [] },
    ];
    const sesiones = [
      { fecha: "2026-08-24", dia: "Día C", ejercicios: [{ nombre: "Curl bíceps", series: [{ peso: 25, reps: 10, rir: 1 }] }] },
    ];
    const resultado = aplicarSesiones(dias, sesiones);
    expect(resultado[0].ejercicios[0].historial).toEqual([]);
  });
});

describe("construirSesiones con sesión mixta (fuerza + tiempo)", () => {
  it("da un volumen_kg numérico en vez de NaN cuando hay un ejercicio de tiempo ese día", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [
          {
            id: "banca1",
            tipo: "fuerza",
            nombre: "Press banca",
            historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
          },
          {
            id: "plancha1",
            tipo: "tiempo",
            nombre: "Plancha",
            historial: [{ fecha: "2026-07-01", series: [{ segundos: 30 }] }],
          },
        ],
      },
    ];
    const [sesion] = construirSesiones(dias);
    expect(sesion.volumen_kg).toBe(480); // 60 * 8, la plancha no suma ni rompe la cuenta
    expect(Number.isNaN(sesion.volumen_kg)).toBe(false);
  });

  it("taggea tipo: 'tiempo' en el ejercicio de la sesión construida", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [
          {
            id: "plancha1",
            tipo: "tiempo",
            nombre: "Plancha",
            historial: [{ fecha: "2026-07-01", series: [{ segundos: 30 }] }],
          },
        ],
      },
    ];
    const [sesion] = construirSesiones(dias);
    expect(sesion.ejercicios[0]).toEqual({ nombre: "Plancha", tipo: "tiempo", series: [{ segundos: 30 }] });
  });
});

describe("construirSesiones con ejercicios compartidos entre días", () => {
  const historialCompartido = [{ fecha: "2026-08-31", series: [{ peso: 90, reps: 8, rir: 1 }] }];

  function diasConEjercicioCompartido(extra = {}) {
    return [
      {
        id: "a",
        nombre: "Día A",
        ...extra.a,
        ejercicios: [
          { id: "prensa", tipo: "fuerza", descanso: 120, nombre: "Prensa de piernas", historial: historialCompartido },
        ],
      },
      {
        id: "c",
        nombre: "Día C",
        ...extra.c,
        ejercicios: [
          { id: "prensa", tipo: "fuerza", descanso: 120, nombre: "Prensa de piernas", historial: historialCompartido },
        ],
      },
    ];
  }

  it("sin sesionesFechas (dato viejo) genera una sesión fantasma por cada día que comparte el ejercicio", () => {
    const sesiones = construirSesiones(diasConEjercicioCompartido());
    expect(sesiones.map((s) => s.dia)).toEqual(["Día A", "Día C"]);
  });

  it("con sesionesFechas, sólo genera la sesión del día realmente entrenado", () => {
    const dias = diasConEjercicioCompartido({ a: { sesionesFechas: ["2026-08-31"] }, c: { sesionesFechas: [] } });
    const sesiones = construirSesiones(dias);
    expect(sesiones).toHaveLength(1);
    expect(sesiones[0].dia).toBe("Día A");
  });
});

describe("construirSesiones: duración estimada", () => {
  it("estima minutos a partir de series + descanso para fuerza, sin depender de cardio", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [
          {
            id: "banca1",
            tipo: "fuerza",
            descanso: 90,
            nombre: "Press banca",
            historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }, { peso: 60, reps: 8, rir: 1 }] }],
          },
        ],
      },
    ];
    const [sesion] = construirSesiones(dias);
    // 2 series * 45s activos + 1 descanso de 90s = 180s = 3 min
    expect(sesion.duracion_min).toBe(3);
  });

  it("suma la duración real de cardio a la estimación de fuerza/tiempo", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [
          {
            id: "trote1",
            tipo: "cardio",
            nombre: "Trote",
            historial: [{ fecha: "2026-07-01", duracion: 20, distancia: null }],
          },
          {
            id: "banca1",
            tipo: "fuerza",
            descanso: 90,
            nombre: "Press banca",
            historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }, { peso: 60, reps: 8, rir: 1 }] }],
          },
        ],
      },
    ];
    const [sesion] = construirSesiones(dias);
    expect(sesion.duracion_min).toBe(23); // 20 min cardio + 3 min estimados de fuerza
  });
});
