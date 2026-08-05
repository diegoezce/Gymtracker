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
