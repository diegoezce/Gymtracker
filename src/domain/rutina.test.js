import { describe, expect, it } from "vitest";
import {
  ejercicio,
  ejercicioCardio,
  actualizarCompartido,
  vincularEjercicio,
  ejerciciosVinculables,
  resincronizarCompartidos,
  diasDondeAparece,
  quitarPierdeHistorial,
  crearDia,
  diaPierdeHistorial,
  moverEjercicioOrden,
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
