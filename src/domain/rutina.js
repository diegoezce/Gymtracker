export const ejercicio = (nombre, peso, incremento = 2.5, series = 3) => ({
  id: nombre.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).slice(2, 6),
  nombre,
  peso,
  incremento,
  series,
  repsObjetivo: 8,
  ajustes: [],
  historial: [],
});

export const RUTINA_INICIAL = [
  {
    id: "a",
    nombre: "Empuje",
    ejercicios: [
      ejercicio("Press banca", 60),
      ejercicio("Press militar", 35),
      ejercicio("Press inclinado mancuernas", 22.5, 2.5),
      ejercicio("Extensiones tríceps", 15, 1.25),
    ],
  },
  {
    id: "b",
    nombre: "Tirón",
    ejercicios: [
      ejercicio("Jalón al pecho", 55),
      ejercicio("Remo con barra", 50),
      ejercicio("Remo mancuerna", 24, 2),
      ejercicio("Curl bíceps", 15, 1.25),
    ],
  },
  {
    id: "c",
    nombre: "Pierna",
    ejercicios: [
      ejercicio("Sentadilla", 80),
      ejercicio("Peso muerto rumano", 70),
      ejercicio("Prensa", 120, 5),
      ejercicio("Gemelos", 40, 2.5),
    ],
  },
];
