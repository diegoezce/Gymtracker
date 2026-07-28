// repsMin/repsMax definen el rango; repsObjetivo arranca en repsMin y sube con la carga
export const ejercicio = (nombre, peso, incremento = 2.5, series = 3, repsMin = 8, repsMax = null, descanso = 90) => ({
  id: nombre.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.random().toString(36).slice(2, 6),
  nombre,
  peso,
  incremento,
  series,
  repsMin,
  repsMax,
  repsObjetivo: repsMin,
  descanso,
  ajustes: [],
  historial: [],
});

export const RUTINA_INICIAL = [
  {
    id: "a",
    nombre: "Día A",
    ejercicios: [
      ejercicio("Prensa de piernas",              100, 5,   4, 8,  10, 120),
      ejercicio("Press banca inclinado mancuernas", 18, 2,   4, 8,  10, 120),
      ejercicio("Remo con apoyo de pecho",          50, 2.5, 4, 10, 12,  90),
      ejercicio("Curl femoral sentado",             35, 5,   3, 10, 12,  90),
      ejercicio("Elevaciones laterales",            10, 2,   3, 12, 15,  60),
      ejercicio("Extensión tríceps en polea",       18, 2.5, 3, 10, 12,  60),
    ],
  },
  {
    id: "b",
    nombre: "Día B",
    ejercicios: [
      ejercicio("Hip thrust con barra",          70, 5,   4, 8,  10, 120),
      ejercicio("Jalón al pecho agarre neutro",  55, 2.5, 4, 8,  10, 120),
      ejercicio("Press de pecho en máquina",     55, 5,   3, 10, 12,  90),
      ejercicio("Extensión de cuádriceps",       40, 5,   3, 12, 15,  90),
      ejercicio("Landmine press",                20, 2.5, 3, 8,  10,  90),
      ejercicio("Curl de bíceps con mancuernas", 12, 2,   3, 10, 12,  60),
    ],
  },
  {
    id: "c",
    // Solo si entrenás 3 veces por semana
    nombre: "Día C",
    ejercicios: [
      ejercicio("Sentadilla búlgara con mancuernas", 16, 2, 3, 8, 10, 120),
      ejercicio("Peso muerto rumano",                60, 5, 3, 8, 10, 120),
    ],
  },
];
