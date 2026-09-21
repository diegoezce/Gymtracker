import { describe, expect, it } from "vitest";
import { resumenSesion } from "./resumen";

const HOY = "2026-09-21";

function dias(ejercicios) {
  return [{ id: "a", nombre: "Día A", ejercicios }];
}

function fuerza(historial, extra = {}) {
  return { id: "banca", tipo: "fuerza", nombre: "Press banca", historial, ...extra };
}

const serie = (peso, reps, rir = 1) => ({ peso, reps, rir });

describe("resumenSesion", () => {
  it("devuelve null si la fecha no tiene nada registrado", () => {
    expect(resumenSesion(dias([fuerza([{ fecha: "2026-09-14", series: [serie(15, 8)] }])]), HOY)).toBeNull();
    expect(resumenSesion(dias([]), HOY)).toBeNull();
  });

  it("calcula totales de la sesión", () => {
    const d = dias([
      fuerza([{ fecha: HOY, series: [serie(15, 10), serie(15, 8)] }]),
      { id: "remo", tipo: "fuerza", nombre: "Remo", historial: [{ fecha: HOY, series: [serie(30, 10)] }] },
    ]);
    const { totales } = resumenSesion(d, HOY);
    expect(totales.ejercicios).toBe(2);
    expect(totales.series).toBe(3);
    expect(totales.volumen).toBe(15 * 10 + 15 * 8 + 30 * 10); // 570
  });

  it("no cuenta dos veces un ejercicio compartido entre días", () => {
    const historial = [{ fecha: HOY, series: [serie(15, 10)] }];
    const d = [
      { id: "a", nombre: "Día A", ejercicios: [fuerza(historial)] },
      { id: "c", nombre: "Día C", ejercicios: [fuerza(historial)] },
    ];
    const r = resumenSesion(d, HOY);
    expect(r.ejercicios).toHaveLength(1);
    expect(r.totales.series).toBe(1);
  });

  describe("logros de fuerza", () => {
    const conPrevias = (hoySeries, previas) =>
      resumenSesion(dias([fuerza([...previas, { fecha: HOY, series: hoySeries }])]), HOY).ejercicios[0].logros;

    it("marca primera vez cuando no hay historial previo", () => {
      expect(conPrevias([serie(15, 10)], [])).toEqual([{ tipo: "primera", texto: "Primera vez registrado" }]);
    });

    it("detecta PR de peso contra todo el historial", () => {
      const logros = conPrevias(
        [serie(20, 8)],
        [
          { fecha: "2026-09-07", series: [serie(18, 8)] },
          { fecha: "2026-09-14", series: [serie(16, 8)] },
        ]
      );
      expect(logros).toContainEqual({ tipo: "pr-peso", texto: "PR de peso: 20 kg", detalle: "antes 18 kg" });
    });

    it("no lo llama PR si subió respecto de la anterior pero no del récord", () => {
      const logros = conPrevias(
        [serie(17, 8)],
        [
          { fecha: "2026-09-07", series: [serie(20, 8)] },
          { fecha: "2026-09-14", series: [serie(16, 8)] },
        ]
      );
      expect(logros.map((l) => l.tipo)).toContain("mas-peso");
      expect(logros.map((l) => l.tipo)).not.toContain("pr-peso");
      expect(logros.find((l) => l.tipo === "mas-peso").texto).toBe("+1 kg vs la vez pasada");
    });

    it("detecta más reps sólo si el peso se mantuvo", () => {
      const mismoPeso = conPrevias([serie(15, 10), serie(15, 10)], [{ fecha: "2026-09-14", series: [serie(15, 8), serie(15, 8)] }]);
      expect(mismoPeso).toContainEqual({ tipo: "mas-reps", texto: "+4 reps al mismo peso" });

      // con más peso y menos reps no aparece "mas-reps"
      const masPeso = conPrevias([serie(20, 6)], [{ fecha: "2026-09-14", series: [serie(15, 10)] }]);
      expect(masPeso.map((l) => l.tipo)).not.toContain("mas-reps");
    });

    it("detecta récord de volumen", () => {
      const logros = conPrevias(
        [serie(15, 10), serie(15, 10), serie(15, 10)], // 450
        [{ fecha: "2026-09-14", series: [serie(15, 10)] }] // 150
      );
      expect(logros).toContainEqual({ tipo: "pr-volumen", texto: "Récord de volumen", detalle: "450 kg" });
    });

    it("no inventa logros en una sesión igual a la anterior", () => {
      const logros = conPrevias([serie(15, 10)], [{ fecha: "2026-09-14", series: [serie(15, 10)] }]);
      expect(logros).toEqual([]);
    });

    it("ignora entradas previas sin series al comparar", () => {
      const logros = conPrevias([serie(15, 10)], [{ fecha: "2026-09-14", series: [] }]);
      expect(logros).toEqual([{ tipo: "primera", texto: "Primera vez registrado" }]);
    });
  });

  it("resume cardio con su propia forma", () => {
    const d = dias([
      {
        id: "cardio",
        tipo: "cardio",
        nombre: "Cardio",
        historial: [
          { fecha: "2026-09-14", duracion: 20, distancia: 3 },
          { fecha: HOY, duracion: 30, distancia: 5 },
        ],
      },
    ]);
    const e = resumenSesion(d, HOY).ejercicios[0];
    expect(e.duracion).toBe(30);
    expect(e.volumen).toBe(0);
    expect(e.logros.map((l) => l.tipo)).toEqual(["pr-duracion", "pr-distancia"]);
  });

  it("resume tiempo por segundos máximos", () => {
    const d = dias([
      {
        id: "plancha",
        tipo: "tiempo",
        nombre: "Plancha",
        historial: [
          { fecha: "2026-09-14", series: [{ segundos: 30 }] },
          { fecha: HOY, series: [{ segundos: 45 }] },
        ],
      },
    ]);
    const e = resumenSesion(d, HOY).ejercicios[0];
    expect(e.segundosMax).toBe(45);
    expect(e.logros).toContainEqual({ tipo: "pr-tiempo", texto: "Récord: 45s", detalle: "antes 30s" });
  });

  it("junta los logros de todos los ejercicios con su nombre", () => {
    const d = dias([
      fuerza([{ fecha: HOY, series: [serie(15, 10)] }]),
      { id: "remo", tipo: "fuerza", nombre: "Remo", historial: [{ fecha: HOY, series: [serie(30, 10)] }] },
    ]);
    const { logros } = resumenSesion(d, HOY);
    expect(logros).toHaveLength(2);
    expect(logros.map((l) => l.ejercicio)).toEqual(["Press banca", "Remo"]);
  });

  it("trata como fuerza los datos legados con tipo undefined", () => {
    const d = dias([{ id: "x", nombre: "Viejo", historial: [{ fecha: HOY, series: [serie(15, 10)] }] }]);
    const e = resumenSesion(d, HOY).ejercicios[0];
    expect(e.volumen).toBe(150);
    expect(e.pesoMax).toBe(15);
  });
});
