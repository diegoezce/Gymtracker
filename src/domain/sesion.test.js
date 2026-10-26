import { describe, expect, it } from "vitest";
import { olvidarProgreso, entradasAVolcar, editarSerie, instantaneaCierre, reabrirEjercicio } from "./sesion";
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

describe("editarSerie", () => {
  const sesion = (series, pesoActual) => ({ diaId: "a", ejIdx: 0, series, pesoActual });

  it("corrige el peso de la última serie y la tarjeta con la que se grabará la próxima", () => {
    const r = editarSerie(sesion([{ peso: 76.5, reps: 13, rir: 1 }], 76.5), 0, "peso", 65.25);
    expect(r.series[0].peso).toBe(65.25);
    expect(r.pesoActual).toBe(65.25);
  });

  it("no mueve la tarjeta al editar una serie anterior", () => {
    const series = [
      { peso: 60, reps: 10, rir: 2 },
      { peso: 65, reps: 9, rir: 1 },
    ];
    const r = editarSerie(sesion(series, 65), 0, "peso", 62.5);
    expect(r.series[0].peso).toBe(62.5);
    expect(r.pesoActual).toBe(65);
  });

  it("editar reps no toca el peso de la tarjeta", () => {
    const r = editarSerie(sesion([{ peso: 80, reps: 8, rir: 1 }], 80), 0, "reps", 10);
    expect(r.series[0].reps).toBe(10);
    expect(r.pesoActual).toBe(80);
  });

  it("editar segundos de un ejercicio de tiempo tampoco", () => {
    const r = editarSerie(sesion([{ segundos: 40 }], 0), 0, "segundos", 45);
    expect(r.series[0].segundos).toBe(45);
    expect(r.pesoActual).toBe(0);
  });

  it("no toca las otras series", () => {
    const series = [{ peso: 60, reps: 10, rir: 2 }, { peso: 60, reps: 9, rir: 1 }];
    const r = editarSerie(sesion(series, 60), 1, "peso", 57.5);
    expect(r.series[0]).toEqual(series[0]);
  });
});

describe("reabrirEjercicio", () => {
  const HOY = "2026-10-26";
  const ejercicio = (extra = {}) => ({
    id: "prensa",
    nombre: "Prensa",
    peso: 86,
    repsObjetivo: 10,
    incremento: 0.5,
    ajustes: [1],
    historial: [
      { fecha: "2026-10-21", series: [{ peso: 80, reps: 10, rir: 1 }] },
      { fecha: HOY, series: [{ peso: 86, reps: 10, rir: 1 }, { peso: 86, reps: 10, rir: 1 }] },
    ],
    ...extra,
  });
  const sesionCerrada = (foto) => ({
    diaId: "a",
    ejIdx: null,
    series: [],
    pesoActual: 0,
    hechos: { prensa: true, otro: true },
    cerrados: { prensa: foto },
  });

  it("devuelve las series de hoy a la sesión", () => {
    const { sesion } = reabrirEjercicio(sesionCerrada({}), ejercicio(), HOY);
    expect(sesion.series).toHaveLength(2);
  });

  it("saca la entrada de hoy del historial, para que cerrar de nuevo no duplique", () => {
    // agregarEntradaHistorial CONCATENA series si ya hay entrada de esa
    // fecha: si la dejáramos, al cerrar quedarían las dos viejas repetidas.
    const { campos } = reabrirEjercicio(sesionCerrada({}), ejercicio(), HOY);
    expect(campos.historial.map((h) => h.fecha)).toEqual(["2026-10-21"]);
  });

  it("restaura la progresión que el cierre había aplicado", () => {
    // Cerró con "todas al tope" y subió de 84 a 86. Reabrir vuelve a 84,
    // así el segundo cierre no suma otro incremento por la misma sesión.
    const foto = { peso: 84, repsObjetivo: 12, incremento: 0.5, ajustes: [] };
    const { campos } = reabrirEjercicio(sesionCerrada(foto), ejercicio(), HOY);
    expect(campos).toMatchObject(foto);
  });

  it("deja de marcarlo como hecho, sin tocar a los demás", () => {
    const { sesion } = reabrirEjercicio(sesionCerrada({}), ejercicio(), HOY);
    expect(sesion.hechos).toEqual({ otro: true });
  });

  it("olvida la foto una vez usada", () => {
    const { sesion } = reabrirEjercicio(sesionCerrada({}), ejercicio(), HOY);
    expect(sesion.cerrados).toEqual({});
  });

  it("la tarjeta arranca en el peso de la última serie, no en el de la plantilla", () => {
    const ej = ejercicio();
    ej.historial[1].series.push({ peso: 74, reps: 8, rir: 0 });
    const { sesion } = reabrirEjercicio(sesionCerrada({ peso: 84 }), ej, HOY);
    expect(sesion.pesoActual).toBe(74);
  });

  it("no rompe si el ejercicio no tiene entrada de hoy", () => {
    const ej = ejercicio();
    ej.historial = ej.historial.filter((h) => h.fecha !== HOY);
    const { campos, sesion } = reabrirEjercicio(sesionCerrada({ peso: 84 }), ej, HOY);
    expect(sesion.series).toEqual([]);
    expect(campos.historial).toHaveLength(1);
    expect(sesion.pesoActual).toBe(84);
  });

  it("no toca las entradas de otras fechas", () => {
    const { campos } = reabrirEjercicio(sesionCerrada({}), ejercicio(), HOY);
    expect(campos.historial[0].series).toEqual([{ peso: 80, reps: 10, rir: 1 }]);
  });
});

describe("instantaneaCierre", () => {
  it("copia los campos que el cierre va a pisar", () => {
    const ej = { peso: 84, repsObjetivo: 12, incremento: 0.5, ajustes: [1], nombre: "Prensa" };
    expect(instantaneaCierre(ej)).toEqual({ peso: 84, repsObjetivo: 12, incremento: 0.5, ajustes: [1] });
  });

  it("no inventa campos que el ejercicio no tiene", () => {
    // Restaurar duracionObjetivo: undefined sobre un ejercicio de fuerza
    // le agregaría la clave vacía.
    expect(instantaneaCierre({ peso: 10 })).toEqual({ peso: 10 });
  });

  it("guarda la duración en los ejercicios de tiempo", () => {
    expect(instantaneaCierre({ duracionObjetivo: 40, incremento: 5 })).toEqual({
      duracionObjetivo: 40,
      incremento: 5,
    });
  });
});
