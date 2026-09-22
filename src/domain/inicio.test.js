import { describe, expect, it } from "vitest";
import { sugerirDia, ultimaVezDia, contarSesiones } from "./inicio";

const dia = (id, nombre, ultimaSesion, ejercicios = []) => ({ id, nombre, ultimaSesion, ejercicios });

describe("sugerirDia", () => {
  it("sugiere el día que hace más que no se entrena", () => {
    const dias = [
      dia("a", "Día A", "2026-09-19"),
      dia("b", "Día B", "2026-09-10"),
      dia("c", "Día C", "2026-09-16"),
    ];
    expect(sugerirDia(dias).id).toBe("b");
  });

  it("prioriza un día que nunca se entrenó", () => {
    const dias = [
      dia("a", "Día A", "2026-09-19"),
      dia("b", "Día B", undefined, []),
      dia("c", "Día C", "2026-09-10"),
    ];
    expect(sugerirDia(dias).id).toBe("b");
  });

  it("ante empate respeta el orden de la rutina", () => {
    const dias = [dia("a", "Día A", "2026-09-10"), dia("b", "Día B", "2026-09-10")];
    expect(sugerirDia(dias).id).toBe("a");
  });

  it("no rompe con una rutina vacía", () => {
    expect(sugerirDia([])).toBeNull();
    expect(sugerirDia(undefined)).toBeNull();
  });

  it("cae al historial de los ejercicios si el día no tiene ultimaSesion", () => {
    // Días anteriores a que existiera el campo ultimaSesion.
    const dias = [
      dia("a", "Día A", undefined, [
        { id: "x", nombre: "X", historial: [{ fecha: "2026-09-19", series: [] }] },
      ]),
      dia("b", "Día B", undefined, [
        { id: "y", nombre: "Y", historial: [{ fecha: "2026-09-01", series: [] }] },
      ]),
    ];
    expect(sugerirDia(dias).id).toBe("b");
  });
});

describe("ultimaVezDia", () => {
  it("prefiere ultimaSesion sobre el heurístico del historial", () => {
    const dias = [
      dia("a", "Día A", "2026-09-19", [
        { id: "x", nombre: "X", historial: [{ fecha: "2026-01-01", series: [] }] },
      ]),
    ];
    expect(ultimaVezDia(dias, dias[0])).toBe("2026-09-19");
  });

  it("devuelve null si nunca se entrenó", () => {
    const dias = [dia("a", "Día A", undefined, [{ id: "x", nombre: "X", historial: [] }])];
    expect(ultimaVezDia(dias, dias[0])).toBeNull();
  });
});

describe("contarSesiones", () => {
  const conFechas = (...fechas) => [
    { id: "a", nombre: "Día A", ejercicios: [{ id: "x", nombre: "X", historial: fechas.map((f) => ({ fecha: f, series: [] })) }] },
  ];

  it("cuenta una sesión por fecha, no por ejercicio", () => {
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        ejercicios: [
          { id: "x", nombre: "X", historial: [{ fecha: "2026-09-21", series: [] }] },
          { id: "y", nombre: "Y", historial: [{ fecha: "2026-09-21", series: [] }] },
        ],
      },
    ];
    expect(contarSesiones(dias).total).toBe(1);
  });

  it("no cuenta dos veces un ejercicio compartido entre días", () => {
    const historial = [{ fecha: "2026-09-21", series: [] }];
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [{ id: "x", nombre: "X", historial }] },
      { id: "c", nombre: "Día C", ejercicios: [{ id: "x", nombre: "X", historial }] },
    ];
    expect(contarSesiones(dias).total).toBe(1);
  });

  it("cuenta las de los últimos 7 días", () => {
    const ahora = new Date("2026-09-21T12:00:00Z");
    const { estaSemana } = contarSesiones(conFechas("2026-09-20", "2026-09-17", "2026-09-01"), ahora);
    expect(estaSemana).toBe(2);
  });

  it("cuenta las del mes en curso sin correrse por zona horaria", () => {
    // new Date("2026-10-01") es medianoche UTC: con getMonth() local, en
    // UTC-3 caería en septiembre y quedaría fuera del mes.
    const ahora = new Date("2026-10-05T12:00:00Z");
    const { esteMes } = contarSesiones(conFechas("2026-10-01", "2026-10-03", "2026-09-28"), ahora);
    expect(esteMes).toBe(2);
  });

  it("devuelve la última fecha registrada", () => {
    const { ultima } = contarSesiones(conFechas("2026-09-10", "2026-09-21", "2026-09-16"));
    expect(ultima).toBe("2026-09-21");
  });

  it("no rompe sin datos", () => {
    expect(contarSesiones([])).toMatchObject({ total: 0, estaSemana: 0, esteMes: 0, ultima: null });
  });
});
