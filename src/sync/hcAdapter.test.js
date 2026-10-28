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

  it("sin sesionesFechas (dato viejo), arma una sola sesión con los días ambiguos listados en `dia`", () => {
    // HC guarda una sesión por fecha: nunca hay que generar dos, aunque no
    // se sepa con certeza cuál de los días se entrenó de verdad.
    const sesiones = construirSesiones(diasConEjercicioCompartido());
    expect(sesiones).toHaveLength(1);
    expect(sesiones[0].dia).toBe("Día A + Día C");
    expect(sesiones[0].ejercicios).toHaveLength(1); // el ejercicio compartido no se duplica
  });

  it("con sesionesFechas, la sesión queda etiquetada con el día realmente entrenado", () => {
    const dias = diasConEjercicioCompartido({ a: { sesionesFechas: ["2026-08-31"] }, c: { sesionesFechas: [] } });
    const sesiones = construirSesiones(dias);
    expect(sesiones).toHaveLength(1);
    expect(sesiones[0].dia).toBe("Día A");
  });

  it("une ejercicios exclusivos de días distintos entrenados la misma fecha en una sola sesión", () => {
    // Caso real: Día A y Día B comparten "Prensa de piernas" pero cada uno
    // tiene además ejercicios propios (Curl bíceps sólo en A, Remo sólo en
    // B). Antes esto generaba dos sesiones con la misma fecha y HC se
    // quedaba con una sola, perdiendo los ejercicios exclusivos del otro día.
    const historialPrensa = [{ fecha: "2026-08-31", series: [{ peso: 90, reps: 8, rir: 1 }] }];
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        sesionesFechas: ["2026-08-31"],
        ejercicios: [
          { id: "prensa", tipo: "fuerza", nombre: "Prensa de piernas", historial: historialPrensa },
          {
            id: "curl-a",
            tipo: "fuerza",
            nombre: "Curl bíceps",
            historial: [{ fecha: "2026-08-31", series: [{ peso: 20, reps: 10, rir: 1 }] }],
          },
        ],
      },
      {
        id: "b",
        nombre: "Día B",
        sesionesFechas: [],
        ejercicios: [
          { id: "prensa", tipo: "fuerza", nombre: "Prensa de piernas", historial: historialPrensa },
          { id: "remo-b", tipo: "fuerza", nombre: "Remo", historial: [] },
        ],
      },
    ];
    const sesiones = construirSesiones(dias);
    expect(sesiones).toHaveLength(1);
    expect(sesiones[0].ejercicios.map((e) => e.nombre).sort()).toEqual(["Curl bíceps", "Prensa de piernas"]);
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

describe("aplicarSesiones — match de nombres tolerante", () => {
  const conNombre = (nombre) => [
    {
      id: "a",
      nombre: "Día A",
      ejercicios: [{ id: "x", nombre, peso: 10, series: 3, historial: [] }],
    },
  ];
  const sesion = (nombre) => [
    {
      fecha: "2026-10-21",
      dia: "Día A",
      ejercicios: [{ nombre, series: [{ peso: 11, reps: 12, rir: 1 }] }],
    },
  ];
  const historialDe = (dias) => dias[0].ejercicios[0].historial;

  it("recupera el historial aunque el nombre traiga un espacio de más", () => {
    const dias = aplicarSesiones(conNombre("Face pull en polea"), sesion("Face pull en polea "));
    expect(historialDe(dias)).toHaveLength(1);
  });

  it("y aunque difiera en mayúsculas", () => {
    const dias = aplicarSesiones(conNombre("Face pull en polea"), sesion("Face Pull En Polea"));
    expect(historialDe(dias)).toHaveLength(1);
  });

  it("y aunque la tilde esté codificada distinto (NFC vs NFD)", () => {
    // El caso que de verdad se cuela al pegar JSON editado fuera de la app.
    const dias = aplicarSesiones(
      conNombre("Extensión tríceps".normalize("NFC")),
      sesion("Extensión tríceps".normalize("NFD"))
    );
    expect(historialDe(dias)).toHaveLength(1);
  });

  it("pero no se trae el historial de otro ejercicio", () => {
    const dias = aplicarSesiones(conNombre("Plancha frontal"), sesion("Plancha lateral"));
    expect(historialDe(dias)).toHaveLength(0);
  });
});

describe("construirSesiones — duración", () => {
  const diaCon = (extra = {}) => [
    {
      id: "a",
      nombre: "Día A",
      ...extra,
      ejercicios: [
        {
          id: "x",
          nombre: "Prensa",
          descanso: 120,
          historial: [
            { fecha: "2026-10-28", series: [{ peso: 80, reps: 10, rir: 1 }, { peso: 80, reps: 10, rir: 1 }] },
          ],
        },
      ],
    },
  ];

  it("usa los minutos medidos cuando la sesión los tiene", () => {
    const [sesion] = construirSesiones(diaCon({ duraciones: { "2026-10-28": 47 } }));
    expect(sesion.duracion_min).toBe(47);
  });

  it("cae en la estimación para las fechas sin medición", () => {
    // 2 series × 45 s + 1 descanso de 120 s = 210 s ≈ 4 min
    const [sesion] = construirSesiones(diaCon());
    expect(sesion.duracion_min).toBe(4);
  });

  it("no confunde la medición de otra fecha", () => {
    const [sesion] = construirSesiones(diaCon({ duraciones: { "2026-10-21": 51 } }));
    expect(sesion.duracion_min).toBe(4);
  });

  it("suma dos entrenamientos distintos de la misma fecha", () => {
    // Día A a la mañana y Día C a la tarde son dos sesiones, no una
    // contada dos veces: cada una la registra su propio día.
    const dias = [
      ...diaCon({ duraciones: { "2026-10-28": 47 } }),
      { id: "c", nombre: "Día C", duraciones: { "2026-10-28": 30 }, ejercicios: [] },
    ];
    const [sesion] = construirSesiones(dias);
    expect(sesion.duracion_min).toBe(77);
  });
});

describe("aplicarSesiones — un campo que HC no trae no borra el local", () => {
  const diaConCardio = (entrada) => [
    {
      id: "a",
      nombre: "Día A",
      ejercicios: [{ id: "c", tipo: "cardio", nombre: "Cardio", historial: [entrada] }],
    },
  ];
  const sesionHC = (ejercicio) => [
    { fecha: "2026-10-23", dia: "Día A", ejercicios: [ejercicio] },
  ];
  const cardioDe = (dias) => dias[0].ejercicios[0].historial[0];

  it("conserva los minutos de cardio cuando HC no los tiene", () => {
    // El caso real: HM guarda el cardio como {nombre, series: []}, sin
    // duracion. Antes eso pisaba los minutos locales con undefined y, como
    // HM nunca los tuvo, no volvían nunca.
    const dias = aplicarSesiones(
      diaConCardio({ fecha: "2026-10-23", duracion: 20, distancia: 3.5 }),
      sesionHC({ nombre: "Cardio", series: [] })
    );
    expect(cardioDe(dias)).toMatchObject({ duracion: 20, distancia: 3.5 });
  });

  it("pero deja que HC corrija los minutos cuando sí los tiene", () => {
    const dias = aplicarSesiones(
      diaConCardio({ fecha: "2026-10-23", duracion: 20 }),
      sesionHC({ nombre: "Cardio", series: [], duracion: 35 })
    );
    expect(cardioDe(dias).duracion).toBe(35);
  });

  it("respeta un null explícito de HC: es un dato, no una ausencia", () => {
    const dias = aplicarSesiones(
      diaConCardio({ fecha: "2026-10-23", duracion: 20, distancia: 3.5 }),
      sesionHC({ nombre: "Cardio", series: [], duracion: 20, distancia: null })
    );
    expect(cardioDe(dias).distancia).toBeNull();
  });

  it("lo mismo para las series de un ejercicio de fuerza", () => {
    const dias = aplicarSesiones(
      [
        {
          id: "a",
          nombre: "Día A",
          ejercicios: [
            {
              id: "x",
              nombre: "Prensa",
              historial: [{ fecha: "2026-10-23", series: [{ peso: 80, reps: 10, rir: 1 }] }],
            },
          ],
        },
      ],
      sesionHC({ nombre: "Prensa" }) // sin series
    );
    expect(dias[0].ejercicios[0].historial[0].series).toHaveLength(1);
  });
});

describe("aplicarSesiones — ejercicio pasado a por tiempo", () => {
  const diaConPlancha = (historial = []) => [
    {
      id: "a",
      nombre: "Día A",
      ejercicios: [
        { id: "p", tipo: "tiempo", nombre: "Plancha frontal", duracionObjetivo: 45, historial },
      ],
    },
  ];
  // Lo que HC tiene guardado de antes de la conversión: forma de fuerza.
  const sesionVieja = [
    {
      fecha: "2026-10-21",
      dia: "Día A",
      ejercicios: [{ nombre: "Plancha frontal", series: [{ peso: 0, reps: 40, rir: 2 }] }],
    },
  ];
  const seriesDe = (dias) => dias[0].ejercicios[0].historial[0].series;

  it("traduce las reps viejas a segundos: ese número siempre fue segundos", () => {
    expect(seriesDe(aplicarSesiones(diaConPlancha(), sesionVieja))).toEqual([{ segundos: 40 }]);
  });

  it("no toca las series que ya vienen en segundos", () => {
    const sesion = [
      {
        fecha: "2026-10-21",
        dia: "Día A",
        ejercicios: [{ nombre: "Plancha frontal", series: [{ segundos: 50 }] }],
      },
    ];
    expect(seriesDe(aplicarSesiones(diaConPlancha(), sesion))).toEqual([{ segundos: 50 }]);
  });

  it("deja la duración objetivo en un número, no en NaN", () => {
    // Sin la traducción, Math.max(...[undefined]) daba NaN y rompía la
    // progresión del ejercicio.
    const dias = aplicarSesiones(diaConPlancha(), sesionVieja);
    expect(dias[0].ejercicios[0].duracionObjetivo).toBe(40);
  });

  it("a un ejercicio de fuerza no le toca las series", () => {
    const dias = aplicarSesiones(
      [{ id: "a", nombre: "Día A", ejercicios: [{ id: "x", nombre: "Prensa", historial: [] }] }],
      [{ fecha: "2026-10-21", dia: "Día A", ejercicios: [{ nombre: "Prensa", series: [{ peso: 80, reps: 10, rir: 1 }] }] }]
    );
    expect(dias[0].ejercicios[0].historial[0].series).toEqual([{ peso: 80, reps: 10, rir: 1 }]);
  });
});
