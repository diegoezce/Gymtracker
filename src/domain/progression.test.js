import { describe, expect, it } from "vitest";
import { progresar, aprender, sugerirPeso, describirBase } from "./progression";

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

describe("progresar con rango (repsMax)", () => {
  function ejRango(overrides = {}) {
    return {
      peso: 60,
      incremento: 2.5,
      repsObjetivo: 8,
      repsMin: 8,
      repsMax: 10,
      ajustes: [],
      historial: [],
      ...overrides,
    };
  }

  it("sube el peso y vuelve a repsMin cuando todas las series alcanzan repsMax", () => {
    const series = [
      { peso: 60, reps: 10, rir: 1 },
      { peso: 60, reps: 10, rir: 1 },
      { peso: 60, reps: 10, rir: 2 },
    ];
    const { peso, repsObjetivo, nota } = progresar(ejRango(), series);
    expect(peso).toBe(62.5);
    expect(repsObjetivo).toBe(8);
    expect(nota).toMatch(/Todas al tope/);
  });

  it("mantiene el peso si no se alcanza repsMax en todas las series", () => {
    const series = [
      { peso: 60, reps: 10, rir: 1 },
      { peso: 60, reps: 9, rir: 1 },
    ];
    const { peso, repsObjetivo } = progresar(ejRango(), series);
    expect(peso).toBe(60);
    expect(repsObjetivo).toBe(8);
  });

  it("baja el peso dos incrementos si la sesión previa también terminó al fallo", () => {
    const exercise = ejRango({
      historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 5, rir: 0 }] }],
    });
    const { peso, repsObjetivo } = progresar(exercise, [{ peso: 60, reps: 4, rir: 0 }]);
    expect(peso).toBe(55);
    expect(repsObjetivo).toBe(8);
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

describe("progresar con tipo tiempo", () => {
  function plancha(overrides = {}) {
    return { tipo: "tiempo", duracionObjetivo: 30, incremento: 5, historial: [], ...overrides };
  }

  it("sube el objetivo un incremento si todas las rondas llegan o superan", () => {
    const series = [{ segundos: 30 }, { segundos: 32 }, { segundos: 30 }];
    const { duracionObjetivo, nota } = progresar(plancha(), series);
    expect(duracionObjetivo).toBe(35);
    expect(nota).toMatch(/Todas al tope/);
  });

  it("repite el mismo objetivo si alguna ronda no llega", () => {
    const series = [{ segundos: 30 }, { segundos: 25 }, { segundos: 30 }];
    const { duracionObjetivo, nota } = progresar(plancha(), series);
    expect(duracionObjetivo).toBe(30);
    expect(nota).toMatch(/Repetimos 30s/);
  });
});

describe("aprender con tipo cardio/tiempo", () => {
  it("no cambia nada para cardio ni tiempo", () => {
    expect(aprender({ tipo: "cardio" }, 100)).toEqual({ ajustes: [], incremento: 0, aviso: "" });
    expect(aprender({ tipo: "tiempo", incremento: 5 }, 30)).toEqual({ ajustes: [], incremento: 5, aviso: "" });
  });
});

describe("sugerirPeso", () => {
  const rango = (o = {}) => ej({ repsMin: 8, repsMax: 12, repsObjetivo: 8, incremento: 1, peso: 15, ...o });

  it("no sugiere nada antes de la primera serie", () => {
    expect(sugerirPeso(rango(), [])).toBeNull();
    expect(sugerirPeso(rango(), undefined)).toBeNull();
  });

  it("no sugiere nada para cardio ni tiempo", () => {
    const serie = [{ peso: 15, reps: 10, rir: 2 }];
    expect(sugerirPeso(rango({ tipo: "cardio" }), serie)).toBeNull();
    expect(sugerirPeso(rango({ tipo: "tiempo" }), serie)).toBeNull();
  });

  it("sube cuando llegaste al techo del rango y sobró margen", () => {
    const s = sugerirPeso(rango(), [{ peso: 15, reps: 12, rir: 3 }]);
    expect(s).toMatchObject({ peso: 16, delta: 1 });
    expect(s.motivo).toMatch(/12 reps/);
  });

  it("mantiene si sobró margen pero no llegaste al techo", () => {
    const s = sugerirPeso(rango(), [{ peso: 15, reps: 9, rir: 3 }]);
    expect(s).toMatchObject({ peso: 15, delta: 0 });
    expect(s.motivo).toMatch(/12 reps/);
  });

  it("baja tras dos series al fallo seguidas", () => {
    const s = sugerirPeso(rango(), [
      { peso: 15, reps: 9, rir: 0 },
      { peso: 15, reps: 8, rir: 0 },
    ]);
    expect(s).toMatchObject({ peso: 14, delta: -1 });
    expect(s.motivo).toMatch(/dos series al fallo/i);
  });

  it("baja si fue al fallo sin llegar al piso del rango", () => {
    const s = sugerirPeso(rango(), [{ peso: 15, reps: 6, rir: 0 }]);
    expect(s).toMatchObject({ peso: 14, delta: -1 });
  });

  describe("pasarse del techo del rango", () => {
    // Caso real: prensa con objetivo 10-12, se hicieron 16 reps al fallo a
    // 75 kg. Antes caía en "al fallo" y devolvía "mantener · dentro del
    // rango" — además de falso (16 no está en 10-12), dejaba el peso corto.
    const prensa = (o = {}) => ej({ repsMin: 10, repsMax: 12, repsObjetivo: 10, incremento: 1, peso: 86, ...o });

    it("sube aunque la serie haya sido al fallo", () => {
      const s = sugerirPeso(prensa(), [{ peso: 75, reps: 16, rir: 0 }]);
      expect(s.delta).toBeGreaterThan(0);
      expect(s.motivo).toBe("16 reps con objetivo 10–12");
    });

    it("escala el salto con lo que te pasaste, no un solo incremento", () => {
      // 4 reps de más sobre 75 kg ≈ 12% ≈ +9 kg con incremento de 1
      const s = sugerirPeso(prensa(), [{ peso: 75, reps: 16, rir: 0 }]);
      expect(s.peso).toBe(84);
    });

    it("con un exceso chico sube poco", () => {
      // 1 rep de más sobre 75 kg ≈ 3% ≈ +2 kg
      expect(sugerirPeso(prensa(), [{ peso: 75, reps: 13, rir: 1 }]).peso).toBe(77);
    });

    it("recorta el exceso para no proponer un salto imposible", () => {
      // 20 reps de más no son 60% más de peso: se recorta a 5 (~15%)
      const s = sugerirPeso(prensa(), [{ peso: 100, reps: 32, rir: 0 }]);
      expect(s.peso).toBe(115);
    });

    it("manda sobre dos series al fallo seguidas", () => {
      // Dos al fallo con 16 reps es peso corto, no fatiga acumulada.
      const s = sugerirPeso(prensa(), [
        { peso: 75, reps: 16, rir: 0 },
        { peso: 75, reps: 16, rir: 0 },
      ]);
      expect(s.delta).toBeGreaterThan(0);
    });

    it("redondea siempre a la grilla del incremento del ejercicio", () => {
      const s = sugerirPeso(prensa({ incremento: 5 }), [{ peso: 75, reps: 16, rir: 0 }]);
      expect(s.peso % 5).toBe(0);
      expect(s.peso).toBe(85); // 9 kg estimados → 2 pasos de 5
    });
  });

  it("mantiene si fue al fallo pero con margen sobre el piso", () => {
    // rango 8-12: fallar en 10 deja 2 reps de colchón antes de caerse.
    expect(sugerirPeso(rango(), [{ peso: 15, reps: 10, rir: 0 }])).toMatchObject({
      peso: 15,
      delta: 0,
      motivo: "Al fallo, con margen sobre 8 reps",
    });
  });

  it("baja si fue al fallo justo en el piso del rango", () => {
    // Caso real: 15 kg × 10, × 10, × 8 al fallo con rango 8-11. Mantener
    // dejaría la 4a serie por debajo del piso.
    const s = sugerirPeso(rango({ repsMin: 8, repsMax: 11 }), [
      { peso: 15, reps: 10, rir: 1 },
      { peso: 15, reps: 10, rir: 1 },
      { peso: 15, reps: 8, rir: 0 },
    ]);
    expect(s).toMatchObject({ peso: 14, delta: -1 });
    expect(s.motivo).toBe("Al fallo justo en el piso de 8 reps");
  });

  it("mantiene en la zona buena (RIR 1-2 dentro del rango)", () => {
    expect(sugerirPeso(rango(), [{ peso: 15, reps: 10, rir: 1 }])).toMatchObject({ peso: 15, delta: 0 });
    expect(sugerirPeso(rango(), [{ peso: 15, reps: 10, rir: 2 }])).toMatchObject({ peso: 15, delta: 0 });
  });

  it("parte del peso de la última serie, no de ej.peso", () => {
    // el usuario ya subió a mano a 20 durante la sesión
    const s = sugerirPeso(rango({ peso: 15 }), [{ peso: 20, reps: 12, rir: 3 }]);
    expect(s.peso).toBe(21);
  });

  it("nunca sugiere menos que un incremento", () => {
    const s = sugerirPeso(rango({ incremento: 5 }), [{ peso: 5, reps: 3, rir: 0 }]);
    expect(s.peso).toBe(5);
  });

  it("usa repsObjetivo cuando no hay rango (datos legados)", () => {
    const legado = ej({ peso: 60, incremento: 2.5, repsObjetivo: 8, repsMin: undefined, repsMax: undefined });
    expect(sugerirPeso(legado, [{ peso: 60, reps: 8, rir: 3 }])).toMatchObject({ peso: 62.5, delta: 2.5 });
  });
});

describe("describirBase", () => {
  it("nombra la serie sobre la que se calculó la sugerencia", () => {
    expect(describirBase([{ peso: 74, reps: 11, rir: 1 }])).toBe("Serie 1: 74 kg × 11 reps");
  });

  it("numera según cuántas series van hechas", () => {
    const series = [
      { peso: 86, reps: 10, rir: 2 },
      { peso: 86, reps: 10, rir: 1 },
    ];
    expect(describirBase(series)).toBe("Serie 2: 86 kg × 10 reps");
  });

  it("marca el fallo, que es lo que cambia la regla", () => {
    expect(describirBase([{ peso: 88, reps: 8, rir: 0 }])).toBe("Serie 1: 88 kg × 8 reps · al fallo");
  });

  it("no inventa nada si no hay series o están incompletas", () => {
    expect(describirBase([])).toBeNull();
    expect(describirBase(undefined)).toBeNull();
    expect(describirBase([{ segundos: 40 }])).toBeNull();
  });
});
