import { describe, expect, it } from "vitest";
import {
  DIAS_VENTANA,
  haceCuanto,
  hechoEnOtroDia,
  solapamientosDelDia,
} from "./solapamiento";

const HOY = "2026-11-13";
const haceDias = (n) => {
  const d = new Date(`${HOY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

// Ejercicio compartido entre A y D: mismo id, mismo historial.
const triceps = (historial) => ({
  id: "extensintrcepsenpoleau477",
  nombre: "Extensión tríceps en polea",
  historial,
});

const rutina = ({ fechaD = haceDias(2), historial = [{ fecha: haceDias(2), series: [] }] } = {}) => [
  {
    id: "a",
    nombre: "Día A",
    sesionesFechas: [haceDias(5)],
    ejercicios: [
      { id: "prensadepiernas66z1", nombre: "Prensa de piernas", historial: [{ fecha: haceDias(5), series: [] }] },
      triceps(historial),
    ],
  },
  {
    id: "d",
    nombre: "Día D",
    sesionesFechas: fechaD ? [fechaD] : [],
    ejercicios: [
      { id: "pantorrillasd001", nombre: "Pantorrillas", historial: fechaD ? [{ fecha: fechaD, series: [] }] : [] },
      triceps(historial),
    ],
  },
];

const diaA = (dias) => dias.find((d) => d.id === "a");
const diaD = (dias) => dias.find((d) => d.id === "d");

describe("hechoEnOtroDia", () => {
  it("avisa en el Día A lo que se hizo en el Día D hace 2 días", () => {
    const dias = rutina();
    expect(hechoEnOtroDia(dias, diaA(dias), triceps([{ fecha: haceDias(2), series: [] }]), HOY)).toEqual({
      dia: "Día D",
      fecha: haceDias(2),
    });
  });

  it("y a la inversa: en el Día D avisa lo que salió en A/B/C", () => {
    // El tríceps se hizo las dos veces: en la sesión del Día A (hace 5) y
    // en la del Día D (hace 2). Cada día avisa del otro.
    const dias = rutina({ historial: [{ fecha: haceDias(5), series: [] }, { fecha: haceDias(2), series: [] }] });
    expect(hechoEnOtroDia(dias, diaD(dias), diaD(dias).ejercicios[1], HOY)).toEqual({
      dia: "Día A",
      fecha: haceDias(5),
    });
    expect(hechoEnOtroDia(dias, diaA(dias), diaA(dias).ejercicios[1], HOY)).toEqual({
      dia: "Día D",
      fecha: haceDias(2),
    });
  });

  it("no avisa de un ejercicio que sólo existe en un día", () => {
    const dias = rutina();
    const pantorrillas = diaD(dias).ejercicios[0];
    expect(hechoEnOtroDia(dias, diaD(dias), pantorrillas, HOY)).toBeNull();
  });

  it("no avisa si el Día D no se entrenó, aunque el ejercicio esté en los dos", () => {
    const dias = rutina({ fechaD: null, historial: [] });
    expect(hechoEnOtroDia(dias, diaA(dias), triceps([]), HOY)).toBeNull();
  });

  it("exige que la fecha sea de una sesión de ESE día, no cualquiera", () => {
    // El ejercicio se hizo hace 2 días, pero el Día D se entrenó hace 4:
    // esa sesión de hace 2 días fue de otro día, no cuenta como D.
    const dias = rutina({ fechaD: haceDias(4), historial: [{ fecha: haceDias(2), series: [] }] });
    expect(hechoEnOtroDia(dias, diaA(dias), triceps([{ fecha: haceDias(2), series: [] }]), HOY)).toBeNull();
  });

  it("respeta la ventana: justo adentro avisa, un día más atrás no", () => {
    const dentro = rutina({ fechaD: haceDias(DIAS_VENTANA), historial: [{ fecha: haceDias(DIAS_VENTANA), series: [] }] });
    expect(hechoEnOtroDia(dentro, diaA(dentro), dentro[0].ejercicios[1], HOY)).not.toBeNull();

    const fuera = rutina({ fechaD: haceDias(DIAS_VENTANA + 1), historial: [{ fecha: haceDias(DIAS_VENTANA + 1), series: [] }] });
    expect(hechoEnOtroDia(fuera, diaA(fuera), fuera[0].ejercicios[1], HOY)).toBeNull();
  });

  it("se queda con la fecha más reciente si hay varias", () => {
    const dias = rutina({ historial: [{ fecha: haceDias(6), series: [] }, { fecha: haceDias(2), series: [] }] });
    diaD(dias).sesionesFechas = [haceDias(6), haceDias(2)];
    expect(hechoEnOtroDia(dias, diaA(dias), dias[0].ejercicios[1], HOY).fecha).toBe(haceDias(2));
  });

  it("cruza por nombre cuando los ids no coinciden", () => {
    // El mismo movimiento cargado dos veces con ids distintos: el respaldo
    // por nombre normalizado lo empareja igual.
    const dias = [
      {
        id: "a",
        nombre: "Día A",
        sesionesFechas: [],
        ejercicios: [{ id: "facepullpoleaa005", nombre: "Face pull en polea", historial: [] }],
      },
      {
        id: "d",
        nombre: "Día D",
        sesionesFechas: [haceDias(3)],
        ejercicios: [
          { id: "facepullpoleac008", nombre: "FACE PULL en polea ", historial: [{ fecha: haceDias(3), series: [] }] },
        ],
      },
    ];
    expect(hechoEnOtroDia(dias, dias[0], dias[0].ejercicios[0], HOY)).toMatchObject({ dia: "Día D" });
  });

  it("no cruza entre dos días fijos: esa repetición es planeada", () => {
    // Prensa está en A y en C a propósito. Avisar ahí sería ruido constante.
    const dias = [
      { id: "a", nombre: "Día A", sesionesFechas: [haceDias(2)], ejercicios: [{ id: "p", nombre: "Prensa", historial: [{ fecha: haceDias(2), series: [] }] }] },
      { id: "c", nombre: "Día C", sesionesFechas: [], ejercicios: [{ id: "p", nombre: "Prensa", historial: [{ fecha: haceDias(2), series: [] }] }] },
    ];
    expect(hechoEnOtroDia(dias, dias[1], dias[1].ejercicios[0], HOY)).toBeNull();
  });

  it("no rompe con datos incompletos", () => {
    expect(hechoEnOtroDia([], null, {}, HOY)).toBeNull();
    expect(hechoEnOtroDia(undefined, { id: "a", ejercicios: [] }, { id: "x" }, HOY)).toBeNull();
  });
});

describe("solapamientosDelDia", () => {
  it("devuelve un mapa por id, sólo con los que avisan", () => {
    const dias = rutina();
    const mapa = solapamientosDelDia(dias, diaA(dias), HOY);
    expect(Object.keys(mapa)).toEqual(["extensintrcepsenpoleau477"]);
    expect(mapa.extensintrcepsenpoleau477.dia).toBe("Día D");
  });
});

describe("haceCuanto", () => {
  it("lo dice en palabras", () => {
    expect(haceCuanto(HOY, HOY)).toBe("hoy");
    expect(haceCuanto(haceDias(1), HOY)).toBe("ayer");
    expect(haceCuanto(haceDias(2), HOY)).toBe("hace 2 días");
  });
});
