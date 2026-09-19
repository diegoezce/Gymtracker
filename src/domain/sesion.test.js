import { describe, expect, it } from "vitest";
import { olvidarProgreso, entradasAVolcar } from "./sesion";
import { agregarEntradaHistorial } from "./rutina";

describe("olvidarProgreso", () => {
  it("quita el parcial del ejercicio que se cerró", () => {
    const progreso = { banca: { series: [{ peso: 15, reps: 8, rir: 1 }] }, remo: { series: [] } };
    expect(olvidarProgreso(progreso, "banca")).toEqual({ remo: { series: [] } });
  });

  it("no toca el resto ni rompe si el ejercicio no estaba", () => {
    const progreso = { remo: { series: [] } };
    expect(olvidarProgreso(progreso, "banca")).toEqual(progreso);
    expect(olvidarProgreso(undefined, "banca")).toEqual({});
  });
});

describe("entradasAVolcar", () => {
  const parcial = { series: [{ peso: 15, reps: 8, rir: 1 }] };

  it("vuelca los parciales con series cargadas", () => {
    const entradas = entradasAVolcar({ banca: parcial });
    expect(entradas.map(([id]) => id)).toEqual(["banca"]);
  });

  it("ignora los que no tienen series", () => {
    expect(entradasAVolcar({ banca: { series: [] } })).toEqual([]);
  });

  it("ignora los salteados", () => {
    expect(entradasAVolcar({ banca: parcial }, { saltados: { banca: true } })).toEqual([]);
  });

  it("ignora los ya cerrados durante la sesión", () => {
    // Ya escribieron su entrada al historial en cerrarEjercicio.
    expect(entradasAVolcar({ banca: parcial }, { hechos: { banca: true } })).toEqual([]);
  });
});

describe("no duplicar series al salir de la sesión", () => {
  it("un ejercicio dejado a medias y después completado queda con las series reales", () => {
    // Caso real reportado: se hicieron 2 series, se volvió al menú del día
    // (queda el parcial en sesion.progreso), se retomó el ejercicio y se
    // completó con una tercera. Al salir, el parcial viejo se volvía a
    // volcar y la fecha terminaba con 5 series en vez de 3.
    const s1 = { peso: 15, reps: 8, rir: 1 };
    const s2 = { peso: 15, reps: 8, rir: 1 };
    const s3 = { peso: 15, reps: 10, rir: 1 };

    // Al volver al menú con 2 series hechas
    let progreso = { banca: { series: [s1, s2] } };

    // Se retoma y se cierra el ejercicio: escribe las 3 al historial
    let historial = agregarEntradaHistorial([], { fecha: "2026-09-14", series: [s1, s2, s3] });
    const hechos = { banca: true };
    progreso = olvidarProgreso(progreso, "banca");

    // Al salir de la sesión no queda nada pendiente que volcar
    const entradas = entradasAVolcar(progreso, { hechos });
    expect(entradas).toEqual([]);

    entradas.forEach(([, p]) => {
      historial = agregarEntradaHistorial(historial, { fecha: "2026-09-14", series: p.series });
    });

    expect(historial).toHaveLength(1);
    expect(historial[0].series).toEqual([s1, s2, s3]);
  });
});
