import { describe, expect, it } from "vitest";
import {
  ejercicio,
  ejercicioCardio,
  ejercicioTiempo,
  actualizarCompartido,
  vincularEjercicio,
  ejerciciosVinculables,
  resincronizarCompartidos,
  diasDondeAparece,
  quitarPierdeHistorial,
  crearDia,
  diaPierdeHistorial,
  moverEjercicioOrden,
  agregarEntradaHistorial,
  editarEntradaHistorial,
  eliminarEntradaHistorial,
  ejerciciosFusionables,
  fusionarEjercicios,
} from "./rutina";

function dosDias() {
  const banca = ejercicio("Press banca", 60, 2.5, 3, 8, 10, 90);
  const diaA = { id: "a", nombre: "Día A", ejercicios: [banca] };
  const diaB = { id: "b", nombre: "Día B", ejercicios: [] };
  return { dias: [diaA, diaB], banca };
}

describe("actualizarCompartido", () => {
  it("aplica los cambios a todo ejercicio con ese id en cualquier día", () => {
    const { dias, banca } = dosDias();
    const vinculado = vincularEjercicio(dias, banca, "b", { series: 4 });
    const actualizados = actualizarCompartido(vinculado, banca.id, { peso: 62.5 });
    expect(actualizados[0].ejercicios[0].peso).toBe(62.5);
    expect(actualizados[1].ejercicios[0].peso).toBe(62.5);
  });

  it("no toca ejercicios con otro id", () => {
    const { dias, banca } = dosDias();
    const otro = ejercicio("Sentadilla", 80);
    const conOtro = [dias[0], { ...dias[1], ejercicios: [otro] }];
    const actualizados = actualizarCompartido(conOtro, banca.id, { peso: 999 });
    expect(actualizados[1].ejercicios[0].peso).toBe(80);
  });
});

describe("agregarEntradaHistorial", () => {
  it("agrega una entrada nueva", () => {
    const historial = [{ fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] }];
    const resultado = agregarEntradaHistorial(historial, { fecha: "2026-08-08", series: [{ peso: 62.5, reps: 8, rir: 1 }] });
    expect(resultado).toHaveLength(2);
    expect(resultado[1].fecha).toBe("2026-08-08");
  });

  it("reemplaza (no duplica) una entrada con la misma fecha", () => {
    const historial = [{ fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] }];
    const resultado = agregarEntradaHistorial(historial, { fecha: "2026-08-01", series: [{ peso: 65, reps: 8, rir: 0 }] });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].series[0].peso).toBe(65);
  });

  it("recorta a las últimas 40 entradas", () => {
    const historial = Array.from({ length: 40 }, (_, i) => ({ fecha: `2026-01-${String(i + 1).padStart(2, "0")}`, series: [] }));
    const resultado = agregarEntradaHistorial(historial, { fecha: "2026-03-01", series: [] });
    expect(resultado).toHaveLength(40);
    expect(resultado[0].fecha).toBe("2026-01-02");
    expect(resultado[39].fecha).toBe("2026-03-01");
  });
});

describe("editarEntradaHistorial", () => {
  it("actualiza los campos de la entrada indicada por fecha original", () => {
    const { dias, banca } = dosDias();
    const dias2 = actualizarCompartido(dias, banca.id, {
      historial: [{ fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
    });
    const resultado = editarEntradaHistorial(dias2, banca.id, "2026-08-01", { series: [{ peso: 65, reps: 9, rir: 0 }] });
    expect(resultado[0].ejercicios[0].historial[0].series[0]).toEqual({ peso: 65, reps: 9, rir: 0 });
  });

  it("no hace nada si la fecha original no existe", () => {
    const { dias, banca } = dosDias();
    const dias2 = actualizarCompartido(dias, banca.id, {
      historial: [{ fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
    });
    const resultado = editarEntradaHistorial(dias2, banca.id, "2026-09-01", { series: [{ peso: 99, reps: 1, rir: 0 }] });
    expect(resultado).toBe(dias2);
  });

  it("se propaga a todas las copias de un ejercicio compartido entre días", () => {
    const { dias, banca } = dosDias();
    const vinculado = vincularEjercicio(dias, banca, "b", { series: 4 });
    const conHistorial = actualizarCompartido(vinculado, banca.id, {
      historial: [{ fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
    });
    const resultado = editarEntradaHistorial(conHistorial, banca.id, "2026-08-01", { series: [{ peso: 70, reps: 8, rir: 0 }] });
    expect(resultado[0].ejercicios[0].historial[0].series[0].peso).toBe(70);
    expect(resultado[1].ejercicios[0].historial[0].series[0].peso).toBe(70);
  });

  it("si la nueva fecha choca con otra entrada existente, la editada la reemplaza sin duplicar", () => {
    const { dias, banca } = dosDias();
    const dias2 = actualizarCompartido(dias, banca.id, {
      historial: [
        { fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] },
        { fecha: "2026-08-08", series: [{ peso: 62.5, reps: 8, rir: 1 }] },
      ],
    });
    const resultado = editarEntradaHistorial(dias2, banca.id, "2026-08-01", { fecha: "2026-08-08", series: [{ peso: 99, reps: 1, rir: 0 }] });
    const historial = resultado[0].ejercicios[0].historial;
    expect(historial).toHaveLength(1);
    expect(historial[0]).toEqual({ fecha: "2026-08-08", series: [{ peso: 99, reps: 1, rir: 0 }] });
  });

  it("no toca peso/repsObjetivo/incremento/ajustes del ejercicio", () => {
    const { dias, banca } = dosDias();
    const dias2 = actualizarCompartido(dias, banca.id, {
      historial: [{ fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
    });
    const resultado = editarEntradaHistorial(dias2, banca.id, "2026-08-01", { series: [{ peso: 999, reps: 1, rir: 0 }] });
    expect(resultado[0].ejercicios[0].peso).toBe(banca.peso);
  });
});

describe("eliminarEntradaHistorial", () => {
  it("quita la entrada indicada", () => {
    const { dias, banca } = dosDias();
    const dias2 = actualizarCompartido(dias, banca.id, {
      historial: [
        { fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] },
        { fecha: "2026-08-08", series: [{ peso: 62.5, reps: 8, rir: 1 }] },
      ],
    });
    const resultado = eliminarEntradaHistorial(dias2, banca.id, "2026-08-01");
    expect(resultado[0].ejercicios[0].historial).toHaveLength(1);
    expect(resultado[0].ejercicios[0].historial[0].fecha).toBe("2026-08-08");
  });

  it("se propaga entre copias compartidas del mismo ejercicio", () => {
    const { dias, banca } = dosDias();
    const vinculado = vincularEjercicio(dias, banca, "b", { series: 4 });
    const conHistorial = actualizarCompartido(vinculado, banca.id, {
      historial: [{ fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
    });
    const resultado = eliminarEntradaHistorial(conHistorial, banca.id, "2026-08-01");
    expect(resultado[0].ejercicios[0].historial).toHaveLength(0);
    expect(resultado[1].ejercicios[0].historial).toHaveLength(0);
  });

  it("no hace nada si la fecha no existe", () => {
    const { dias, banca } = dosDias();
    const dias2 = actualizarCompartido(dias, banca.id, {
      historial: [{ fecha: "2026-08-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
    });
    const resultado = eliminarEntradaHistorial(dias2, banca.id, "2026-09-01");
    expect(resultado[0].ejercicios[0].historial).toHaveLength(1);
  });
});

describe("vincularEjercicio", () => {
  it("clona campos compartidos preservando el id, y usa config propia del día destino", () => {
    const { dias, banca } = dosDias();
    const resultado = vincularEjercicio(dias, banca, "b", { series: 5, repsMin: 4, repsMax: 6, descanso: 150 });
    const copia = resultado[1].ejercicios[0];
    expect(copia.id).toBe(banca.id);
    expect(copia.peso).toBe(banca.peso);
    expect(copia.historial).toBe(banca.historial);
    expect(copia.series).toBe(5);
    expect(copia.repsMin).toBe(4);
    expect(copia.repsMax).toBe(6);
    expect(copia.descanso).toBe(150);
    // el día origen no se modifica
    expect(resultado[0].ejercicios[0].series).toBe(3);
  });

  it("usa defaults tomados del ejercicio fuente si no se especifica configDia", () => {
    const { dias, banca } = dosDias();
    const resultado = vincularEjercicio(dias, banca, "b");
    const copia = resultado[1].ejercicios[0];
    expect(copia.series).toBe(banca.series);
    expect(copia.repsMin).toBe(banca.repsMin);
  });

  it("funciona igual con cardio", () => {
    const cardio = ejercicioCardio("Cardio", 20, 3);
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [cardio] },
      { id: "b", nombre: "Día B", ejercicios: [] },
    ];
    const resultado = vincularEjercicio(dias, cardio, "b", { duracionMin: 30 });
    const copia = resultado[1].ejercicios[0];
    expect(copia.id).toBe(cardio.id);
    expect(copia.duracionMin).toBe(30);
    expect(copia.distanciaKm).toBe(3);
  });
});

describe("ejerciciosVinculables", () => {
  it("lista ejercicios de otros días que todavía no están en diaId, deduplicados", () => {
    const { dias, banca } = dosDias();
    const vinculables = ejerciciosVinculables(dias, "b");
    expect(vinculables.map((e) => e.id)).toEqual([banca.id]);
    expect(vinculables[0].diasDonde).toEqual(["Día A"]);
  });

  it("no ofrece un ejercicio que ya está en el día destino", () => {
    const { dias, banca } = dosDias();
    const yaVinculado = vincularEjercicio(dias, banca, "b");
    expect(ejerciciosVinculables(yaVinculado, "b")).toEqual([]);
  });
});

describe("diasDondeAparece", () => {
  it("devuelve los nombres de los días que contienen ese id", () => {
    const { dias, banca } = dosDias();
    const vinculado = vincularEjercicio(dias, banca, "b");
    expect(diasDondeAparece(vinculado, banca.id)).toEqual(["Día A", "Día B"]);
  });
});

describe("quitarPierdeHistorial", () => {
  const conHistorial = (ej) => ({
    ...ej,
    historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
  });

  it("es false si el ejercicio no tiene historial", () => {
    const { dias, banca } = dosDias();
    expect(quitarPierdeHistorial(dias, banca.id)).toBe(false);
  });

  it("es false si tiene historial pero está compartido en otro día", () => {
    const { banca } = dosDias();
    const conHist = conHistorial(banca);
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [conHist] },
      { id: "b", nombre: "Día B", ejercicios: [conHist] },
    ];
    expect(quitarPierdeHistorial(dias, banca.id)).toBe(false);
  });

  it("es true si tiene historial y aparece en un solo día", () => {
    const { banca } = dosDias();
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [conHistorial(banca)] },
      { id: "b", nombre: "Día B", ejercicios: [] },
    ];
    expect(quitarPierdeHistorial(dias, banca.id)).toBe(true);
  });
});

describe("resincronizarCompartidos", () => {
  it("une el historial de copias desincronizadas y lo aplica a todas", () => {
    const { dias, banca } = dosDias();
    let compartido = vincularEjercicio(dias, banca, "b");
    // simula reconstrucción independiente desde HC: cada copia con su propia porción de historial
    compartido = compartido.map((d, i) => ({
      ...d,
      ejercicios: d.ejercicios.map((e) => ({
        ...e,
        peso: i === 0 ? 60 : 65,
        historial:
          i === 0
            ? [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }] }]
            : [{ fecha: "2026-07-10", series: [{ peso: 65, reps: 8, rir: 1 }] }],
      })),
    }));

    const resultado = resincronizarCompartidos(compartido);
    const historialA = resultado[0].ejercicios[0].historial;
    const historialB = resultado[1].ejercicios[0].historial;
    expect(historialA).toEqual(historialB);
    expect(historialA.map((h) => h.fecha)).toEqual(["2026-07-01", "2026-07-10"]);
    // el peso se toma de la entrada más reciente (2026-07-10 → 65)
    expect(resultado[0].ejercicios[0].peso).toBe(65);
    expect(resultado[1].ejercicios[0].peso).toBe(65);
  });

  it("no dedupea de más ni toca ejercicios sin compartir", () => {
    const banca = ejercicio("Press banca", 60);
    const sentadilla = ejercicio("Sentadilla", 80);
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [banca] },
      { id: "b", nombre: "Día B", ejercicios: [sentadilla] },
    ];
    const resultado = resincronizarCompartidos(dias);
    expect(resultado).toEqual(dias);
  });

  it("dedupea fechas repetidas entre copias sin duplicar entradas", () => {
    const { dias, banca } = dosDias();
    let compartido = vincularEjercicio(dias, banca, "b");
    compartido = compartido.map((d) => ({
      ...d,
      ejercicios: d.ejercicios.map((e) => ({
        ...e,
        historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
      })),
    }));
    const resultado = resincronizarCompartidos(compartido);
    expect(resultado[0].ejercicios[0].historial.length).toBe(1);
  });
});

describe("crearDia", () => {
  it("crea un día vacío con id único", () => {
    const d1 = crearDia("Nuevo día");
    const d2 = crearDia("Nuevo día");
    expect(d1.nombre).toBe("Nuevo día");
    expect(d1.ejercicios).toEqual([]);
    expect(d1.id).not.toBe(d2.id);
  });
});

describe("diaPierdeHistorial", () => {
  const conHistorial = (ej) => ({
    ...ej,
    historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }] }],
  });

  it("es false para un día vacío", () => {
    const dias = [crearDia("Día X")];
    expect(diaPierdeHistorial(dias, dias[0].id)).toBe(false);
  });

  it("es false si el único ejercicio con historial está compartido con otro día", () => {
    const { banca } = dosDias();
    const conHist = conHistorial(banca);
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [conHist] },
      { id: "b", nombre: "Día B", ejercicios: [conHist] },
    ];
    expect(diaPierdeHistorial(dias, "a")).toBe(false);
  });

  it("es true si tiene un ejercicio con historial exclusivo de ese día", () => {
    const { banca } = dosDias();
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [conHistorial(banca)] },
      { id: "b", nombre: "Día B", ejercicios: [] },
    ];
    expect(diaPierdeHistorial(dias, "a")).toBe(true);
  });
});

describe("moverEjercicioOrden", () => {
  function tresEjercicios() {
    const e1 = ejercicio("Uno", 10);
    const e2 = ejercicio("Dos", 20);
    const e3 = ejercicio("Tres", 30);
    return { dias: [{ id: "a", nombre: "Día A", ejercicios: [e1, e2, e3] }], e1, e2, e3 };
  }

  it("sube: intercambia con el vecino anterior", () => {
    const { dias, e1, e2, e3 } = tresEjercicios();
    const resultado = moverEjercicioOrden(dias, "a", e2.id, -1);
    expect(resultado[0].ejercicios.map((e) => e.id)).toEqual([e2.id, e1.id, e3.id]);
  });

  it("baja: intercambia con el vecino siguiente", () => {
    const { dias, e1, e2, e3 } = tresEjercicios();
    const resultado = moverEjercicioOrden(dias, "a", e2.id, 1);
    expect(resultado[0].ejercicios.map((e) => e.id)).toEqual([e1.id, e3.id, e2.id]);
  });

  it("no-op si ya está en el extremo", () => {
    const { dias, e1, e3 } = tresEjercicios();
    expect(moverEjercicioOrden(dias, "a", e1.id, -1)[0].ejercicios.map((e) => e.id)).toEqual(
      dias[0].ejercicios.map((e) => e.id)
    );
    expect(moverEjercicioOrden(dias, "a", e3.id, 1)[0].ejercicios.map((e) => e.id)).toEqual(
      dias[0].ejercicios.map((e) => e.id)
    );
  });

  it("no afecta otros días", () => {
    const { dias, e2 } = tresEjercicios();
    const otro = ejercicio("Otro", 40);
    const conOtroDia = [...dias, { id: "b", nombre: "Día B", ejercicios: [otro] }];
    const resultado = moverEjercicioOrden(conOtroDia, "a", e2.id, -1);
    expect(resultado[1].ejercicios).toEqual(conOtroDia[1].ejercicios);
  });
});

describe("ejercicioTiempo", () => {
  it("trae los defaults del ejemplo (30s x 3 series, 60s descanso, +5s)", () => {
    const plancha = ejercicioTiempo("Plancha");
    expect(plancha.tipo).toBe("tiempo");
    expect(plancha.duracionObjetivo).toBe(30);
    expect(plancha.series).toBe(3);
    expect(plancha.descanso).toBe(60);
    expect(plancha.incremento).toBe(5);
    expect(plancha.historial).toEqual([]);
    expect(plancha.peso).toBeUndefined();
    expect(plancha.ajustes).toBeUndefined();
  });
});

describe("vincularEjercicio con tipo tiempo", () => {
  it("usa series/descanso propios del día destino, sin repsMin/repsMax", () => {
    const plancha = ejercicioTiempo("Plancha", 30, 3, 60, 5);
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [plancha] },
      { id: "b", nombre: "Día B", ejercicios: [] },
    ];
    const resultado = vincularEjercicio(dias, plancha, "b", { series: 4, descanso: 45 });
    const copia = resultado[1].ejercicios[0];
    expect(copia.id).toBe(plancha.id);
    expect(copia.duracionObjetivo).toBe(30);
    expect(copia.series).toBe(4);
    expect(copia.descanso).toBe(45);
    expect(copia.repsMin).toBeUndefined();
  });

  it("usa defaults propios (series 3, descanso 60) si no se especifica configDia", () => {
    const plancha = ejercicioTiempo("Plancha", 30, 3, 60, 5);
    const dias = [
      { id: "a", nombre: "Día A", ejercicios: [plancha] },
      { id: "b", nombre: "Día B", ejercicios: [] },
    ];
    const resultado = vincularEjercicio(dias, plancha, "b");
    expect(resultado[1].ejercicios[0].series).toBe(3);
    expect(resultado[1].ejercicios[0].descanso).toBe(60);
  });
});

describe("resincronizarCompartidos con tipo tiempo", () => {
  it("mergea duracionObjetivo e incremento entre copias compartidas", () => {
    const plancha = ejercicioTiempo("Plancha", 30, 3, 60, 5);
    let dias = [
      { id: "a", nombre: "Día A", ejercicios: [plancha] },
      { id: "b", nombre: "Día B", ejercicios: [] },
    ];
    dias = vincularEjercicio(dias, plancha, "b");
    dias = dias.map((d, i) => ({
      ...d,
      ejercicios: d.ejercicios.map((e) => ({
        ...e,
        duracionObjetivo: i === 0 ? 30 : 35,
        historial:
          i === 0
            ? [{ fecha: "2026-07-01", series: [{ segundos: 30 }] }]
            : [{ fecha: "2026-07-10", series: [{ segundos: 35 }] }],
      })),
    }));

    const resultado = resincronizarCompartidos(dias);
    expect(resultado[0].ejercicios[0].duracionObjetivo).toBe(35);
    expect(resultado[1].ejercicios[0].duracionObjetivo).toBe(35);
    expect(resultado[0].ejercicios[0].historial).toEqual(resultado[1].ejercicios[0].historial);
    expect(resultado[0].ejercicios[0].historial.map((h) => h.fecha)).toEqual(["2026-07-01", "2026-07-10"]);
  });
});

describe("ejerciciosFusionables", () => {
  it("lista otros ejercicios del mismo tipo, excluyendo el propio", () => {
    const { dias, banca } = dosDias();
    const sentadilla = ejercicio("Sentadilla", 80);
    const cardio = ejercicioCardio("Cardio");
    const conMas = [
      dias[0],
      { ...dias[1], ejercicios: [sentadilla, cardio] },
    ];
    const candidatos = ejerciciosFusionables(conMas, banca.id);
    expect(candidatos.map((c) => c.id)).toEqual([sentadilla.id]);
  });

  it("dedupea por id entre días y anota diasDonde", () => {
    const { dias, banca } = dosDias();
    const otro = ejercicio("Press militar", 40);
    const vinculado = vincularEjercicio([dias[0], { ...dias[1], ejercicios: [otro] }], otro, "a");
    const candidatos = ejerciciosFusionables(vinculado, banca.id);
    expect(candidatos).toHaveLength(1);
    expect(candidatos[0].diasDonde).toEqual(["Día A", "Día B"]);
  });

  it("devuelve [] si el id no existe", () => {
    const { dias } = dosDias();
    expect(ejerciciosFusionables(dias, "no-existe")).toEqual([]);
  });
});

describe("fusionarEjercicios", () => {
  function dosEjerciciosConHistorial() {
    const a = { ...ejercicio("Press banca", 60, 2.5, 3, 8, 10, 90), historial: [{ fecha: "2026-07-01", series: [{ peso: 60, reps: 8, rir: 1 }] }] };
    const b = { ...ejercicio("Press de banca plano", 65, 2.5, 4, 6, 8, 120), historial: [{ fecha: "2026-07-10", series: [{ peso: 65, reps: 6, rir: 0 }] }] };
    const dias = [
      { id: "x", nombre: "Día X", ejercicios: [a] },
      { id: "y", nombre: "Día Y", ejercicios: [b] },
    ];
    return { dias, a, b };
  }

  it("une el historial de ambos, ordenado y sin duplicar fechas", () => {
    const { dias, a, b } = dosEjerciciosConHistorial();
    const resultado = fusionarEjercicios(dias, a.id, b.id);
    const fusionado = resultado[0].ejercicios[0];
    expect(fusionado.historial.map((h) => h.fecha)).toEqual(["2026-07-01", "2026-07-10"]);
  });

  it("el sobreviviente conserva su nombre y su id; el perdedor pasa a tener ambos", () => {
    const { dias, a, b } = dosEjerciciosConHistorial();
    const resultado = fusionarEjercicios(dias, a.id, b.id);
    expect(resultado[0].ejercicios[0].id).toBe(a.id);
    expect(resultado[0].ejercicios[0].nombre).toBe("Press banca");
    expect(resultado[1].ejercicios[0].id).toBe(a.id);
    expect(resultado[1].ejercicios[0].nombre).toBe("Press banca");
  });

  it("toma peso/repsObjetivo/incremento/ajustes de la copia con historial más reciente", () => {
    const { dias, a, b } = dosEjerciciosConHistorial();
    const resultado = fusionarEjercicios(dias, a.id, b.id);
    // b tiene la fecha más reciente (2026-07-10) → sus campos de progresión ganan
    expect(resultado[0].ejercicios[0].peso).toBe(65);
    expect(resultado[1].ejercicios[0].peso).toBe(65);
  });

  it("en empate de fecha, gana el sobreviviente", () => {
    const { dias, a, b } = dosEjerciciosConHistorial();
    const mismaFecha = dias.map((d) => ({
      ...d,
      ejercicios: d.ejercicios.map((e) => ({ ...e, historial: [{ ...e.historial[0], fecha: "2026-07-01" }] })),
    }));
    const resultado = fusionarEjercicios(mismaFecha, a.id, b.id);
    expect(resultado[0].ejercicios[0].peso).toBe(60); // el de `a`, el sobreviviente
  });

  it("no toca series/repsMin/repsMax/descanso propios de cada día", () => {
    const { dias, a, b } = dosEjerciciosConHistorial();
    const resultado = fusionarEjercicios(dias, a.id, b.id);
    expect(resultado[0].ejercicios[0].series).toBe(3);
    expect(resultado[0].ejercicios[0].repsMin).toBe(8);
    expect(resultado[1].ejercicios[0].series).toBe(4);
    expect(resultado[1].ejercicios[0].repsMin).toBe(6);
  });

  it("no-op si los tipos no coinciden", () => {
    const { dias, a } = dosEjerciciosConHistorial();
    const cardio = ejercicioCardio("Cardio");
    const conCardio = [dias[0], { ...dias[1], ejercicios: [cardio] }];
    const resultado = fusionarEjercicios(conCardio, a.id, cardio.id);
    expect(resultado).toEqual(conCardio);
  });

  it("no-op si algún id no existe", () => {
    const { dias, a } = dosEjerciciosConHistorial();
    const resultado = fusionarEjercicios(dias, a.id, "no-existe");
    expect(resultado).toEqual(dias);
  });

  it("propaga el resultado a todas las copias existentes de ambos ids", () => {
    const { dias, a, b } = dosEjerciciosConHistorial();
    const conCopiaDeA = vincularEjercicio(dias, a, "y");
    const resultado = fusionarEjercicios(conCopiaDeA, a.id, b.id);
    const copiasDeA = resultado.flatMap((d) => d.ejercicios).filter((e) => e.id === a.id);
    expect(copiasDeA.length).toBeGreaterThanOrEqual(2);
    copiasDeA.forEach((e) => expect(e.historial).toEqual(copiasDeA[0].historial));
  });
});
