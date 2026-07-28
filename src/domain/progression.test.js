import { describe, expect, it } from "vitest";
import { progresar, aprender } from "./progression";

function ej(overrides = {}) {
  return {
    peso: 60,
    incremento: 2.5,
    repsObjetivo: 8,
    ajustes: [],
    historial: [],
    ...overrides,
  };
}

describe("progresar", () => {
  it("sube el peso un incremento cuando la última serie tuvo RIR >= 3", () => {
    const { peso, repsObjetivo, nota } = progresar(ej(), [{ peso: 60, reps: 8, rir: 3 }]);
    expect(peso).toBe(62.5);
    expect(repsObjetivo).toBe(8);
    expect(nota).toMatch(/Sobró margen/);
  });

  it("mantiene el peso y sube el objetivo de reps con RIR 1 o 2", () => {
    const r1 = progresar(ej(), [{ peso: 60, reps: 8, rir: 1 }]);
    expect(r1.peso).toBe(60);
    expect(r1.repsObjetivo).toBe(9);

    const r2 = progresar(ej(), [{ peso: 60, reps: 8, rir: 2 }]);
    expect(r2.peso).toBe(60);
    expect(r2.repsObjetivo).toBe(9);
  });

  it("repite el mismo peso al fallo (RIR 0) si la sesión previa no terminó también al fallo", () => {
    const { peso, nota } = progresar(ej(), [{ peso: 60, reps: 5, rir: 0 }]);
    expect(peso).toBe(60);
    expect(nota).toMatch(/Al fallo/);
  });

  it("baja el peso dos incrementos si la sesión previa también terminó al fallo", () => {
    const exercise = ej({
      historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 5, rir: 0 }] }],
    });
    const { peso, nota } = progresar(exercise, [{ peso: 60, reps: 4, rir: 0 }]);
    expect(peso).toBe(55); // 60 - 2.5*2
    expect(nota).toMatch(/Segunda al fallo seguida/);
  });

  it("no baja el peso por debajo de un incremento", () => {
    const exercise = ej({
      peso: 3,
      incremento: 2.5,
      historial: [{ fecha: "2026-07-01", series: [{ peso: 3, reps: 5, rir: 0 }] }],
    });
    const { peso } = progresar(exercise, [{ peso: 3, reps: 4, rir: 0 }]);
    expect(peso).toBe(2.5);
  });

  it("usa RIR 2 por defecto cuando no hay series registradas", () => {
    const { peso, repsObjetivo } = progresar(ej(), []);
    expect(peso).toBe(60);
    expect(repsObjetivo).toBe(9);
  });
});

describe("aprender", () => {
  it("no cambia nada si el peso usado coincide con el sugerido", () => {
    const { ajustes, incremento, aviso } = aprender(ej(), 60);
    expect(ajustes).toEqual([]);
    expect(incremento).toBe(2.5);
    expect(aviso).toBe("");
  });

  it("acumula ajustes sin disparar aviso hasta la tercera vez consecutiva en la misma dirección", () => {
    const primero = aprender(ej({ ajustes: [] }), 62.5);
    expect(primero.ajustes).toEqual([1]);
    expect(primero.aviso).toBe("");

    const segundo = aprender(ej({ ajustes: primero.ajustes }), 62.5);
    expect(segundo.ajustes).toEqual([1, 1]);
    expect(segundo.aviso).toBe("");
  });

  it("sube el incremento tras 3 ajustes manuales seguidos hacia arriba", () => {
    const { ajustes, incremento, aviso } = aprender(ej({ ajustes: [1, 1] }), 62.5);
    expect(ajustes).toEqual([]);
    expect(incremento).toBe(3.75); // 2.5 + 1.25
    expect(aviso).toMatch(/para arriba/);
  });

  it("baja el incremento tras 3 ajustes manuales seguidos hacia abajo", () => {
    const { ajustes, incremento, aviso } = aprender(ej({ ajustes: [-1, -1] }), 57.5);
    expect(ajustes).toEqual([]);
    expect(incremento).toBe(1.25); // 2.5 - 1.25
    expect(aviso).toMatch(/para abajo/);
  });

  it("no baja el incremento por debajo de 1.25", () => {
    const { incremento } = aprender(ej({ ajustes: [-1, -1], incremento: 1.25 }), 0);
    expect(incremento).toBe(1.25);
  });

  it("no dispara aviso si los últimos 3 ajustes no son todos en la misma dirección", () => {
    const { ajustes, incremento, aviso } = aprender(ej({ ajustes: [1, -1] }), 62.5);
    expect(ajustes).toEqual([1, -1, 1]);
    expect(incremento).toBe(2.5);
    expect(aviso).toBe("");
  });
});
