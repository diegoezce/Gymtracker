import { createContext, useContext, useEffect, useRef, useState } from "react";
import { asyncStorageAdapter as storage } from "../storage/asyncStorageAdapter";
import {
  RUTINA_INICIAL,
  actualizarCompartido,
  agregarEntradaHistorial,
  marcarSesionDia,
  registrarDuracion,
  resincronizarCompartidos,
  ejercicio as crearEjercicio,
  ejercicioCardio as crearEjercicioCardio,
  ejercicioTiempo as crearEjercicioTiempo,
} from "@gymtracker/core/domain/rutina";
import { progresar, aprender } from "@gymtracker/core/domain/progression";
import {
  olvidarProgreso,
  entradasAVolcar,
  instantaneaCierre,
  reabrirEjercicio as deshacerCierre,
  iniciarReloj,
  pausarReloj,
  reanudarReloj,
  minutosDeSesion,
  editarSerie as editarSerieEnSesion,
} from "@gymtracker/core/domain/sesion";
import { resumenSesion } from "@gymtracker/core/domain/resumen";
import { hoy } from "@gymtracker/core/utils/format";

const CLAVE_RUTINA = "gym:estado:v1";
const CLAVE_SESION = "gym:sesion:v1";
const CLAVE_ONBOARDING = "gym:onboarding:v1";

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [cargando, setCargando] = useState(true);
  const [dias, setDias] = useState(RUTINA_INICIAL);
  const [sesion, setSesion] = useState(null);
  const [sesionPausada, setSesionPausada] = useState(false);
  const [aviso, setAviso] = useState("");
  const [resumen, setResumen] = useState(null);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const primeraCarga = useRef(true);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(CLAVE_RUTINA);
        if (r?.value) {
          setDias(resincronizarCompartidos(JSON.parse(r.value)));
        }
      } catch {}
      try {
        const s = await storage.get(CLAVE_SESION);
        if (s?.value) {
          const guardada = JSON.parse(s.value);
          setSesion({
            ...guardada,
            tiempo: guardada.tiempo ? reanudarReloj(guardada.tiempo) : guardada.tiempo,
          });
        }
      } catch {}
      try {
        const ob = await storage.get(CLAVE_ONBOARDING);
        if (ob?.value === "done") setOnboardingDone(true);
      } catch {}
      setCargando(false);
    })();
  }, []);

  // Persistir dias
  useEffect(() => {
    if (cargando) return;
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    storage.set(CLAVE_RUTINA, JSON.stringify(dias)).catch(() => {});
  }, [dias, cargando]);

  // Persistir sesion
  useEffect(() => {
    if (cargando) return;
    storage.set(CLAVE_SESION, sesion === null ? "" : JSON.stringify(sesion)).catch(() => {});
  }, [sesion, cargando]);

  // ── acciones ──────────────────────────────────────────────────

  const comenzar = (dia) => {
    setAviso("");
    setSesionPausada(false);
    setSesion({
      diaId: dia.id,
      ejIdx: null,
      pesoActual: 0,
      series: [],
      hechos: {},
      progreso: {},
      saltados: {},
      extra: {},
      cerrados: {},
      tiempo: iniciarReloj(),
    });
  };

  const pausarSesion = () => {
    setSesion((prev) => (prev ? { ...prev, tiempo: pausarReloj(prev.tiempo) } : prev));
    setSesionPausada(true);
  };

  const reanudarSesion = () => {
    setSesion((prev) => (prev ? { ...prev, tiempo: reanudarReloj(prev.tiempo) } : prev));
    setSesionPausada(false);
  };

  const descartarYEmpezar = (diaNuevo) => comenzar(diaNuevo);

  const getDia = (s = sesion) => s ? dias.find((d) => d.id === s.diaId) : null;
  const getEj = (s = sesion) => {
    const dia = getDia(s);
    return dia && s.ejIdx !== null ? dia.ejercicios[s.ejIdx] : null;
  };

  const iniciarEjercicio = (idx) => {
    const dia = getDia();
    const e = dia.ejercicios[idx];
    const guardado = sesion.progreso?.[e.id];
    setSesion({
      ...sesion,
      ejIdx: idx,
      series: guardado?.series ?? [],
      pesoActual: guardado?.pesoActual ?? (e.tipo === "cardio" ? 0 : e.peso),
    });
  };

  const alternarSaltado = (ejId) => {
    const saltados = { ...sesion.saltados };
    if (saltados[ejId]) delete saltados[ejId];
    else saltados[ejId] = true;
    setSesion({ ...sesion, saltados });
  };

  const agregarSerieExtra = () => {
    const ej = getEj();
    const extra = { ...sesion.extra, [ej.id]: (sesion.extra?.[ej.id] ?? 0) + 1 };
    setSesion({ ...sesion, extra });
  };

  const cerrarEjercicio = (ej, series, onDone) => {
    const dia = getDia();
    const { peso, repsObjetivo, nota } = progresar(ej, series);
    const { ajustes, incremento, aviso: av } = aprender(ej, series[0].peso);
    let nuevos = actualizarCompartido(dias, ej.id, {
      peso,
      repsObjetivo,
      incremento,
      ajustes,
      historial: agregarEntradaHistorial(ej.historial, { fecha: hoy(), series }),
    });
    nuevos = marcarSesionDia(nuevos, dia.id, hoy());
    setDias(nuevos);
    setAviso(`${ej.nombre}: ${av || nota}`);
    setSesion((prev) => ({
      ...prev,
      ejIdx: null,
      series: [],
      hechos: { ...prev.hechos, [ej.id]: true },
      cerrados: { ...prev.cerrados, [ej.id]: instantaneaCierre(ej) },
      progreso: olvidarProgreso(prev.progreso, ej.id),
    }));
    onDone?.();
  };

  const cerrarEjercicioTiempo = (ej, series, onDone) => {
    const dia = getDia();
    const { duracionObjetivo, nota } = progresar(ej, series);
    let nuevos = actualizarCompartido(dias, ej.id, {
      duracionObjetivo,
      historial: agregarEntradaHistorial(ej.historial, { fecha: hoy(), series }),
    });
    nuevos = marcarSesionDia(nuevos, dia.id, hoy());
    setDias(nuevos);
    setAviso(`${ej.nombre}: ${nota}`);
    setSesion((prev) => ({
      ...prev,
      ejIdx: null,
      series: [],
      hechos: { ...prev.hechos, [ej.id]: true },
      cerrados: { ...prev.cerrados, [ej.id]: instantaneaCierre(ej) },
      progreso: olvidarProgreso(prev.progreso, ej.id),
    }));
    onDone?.();
  };

  const guardarSerie = (reps, rir, onExercicioTerminado) => {
    const ej = getEj();
    const series = [...sesion.series, { peso: sesion.pesoActual, reps, rir }];
    const objetivoSeries = ej.series + (sesion.extra?.[ej.id] ?? 0);
    if (series.length < objetivoSeries) {
      setSesion({ ...sesion, series });
      return;
    }
    cerrarEjercicio(ej, series, onExercicioTerminado);
  };

  const guardarSerieTiempo = (segundos, onExercicioTerminado) => {
    const ej = getEj();
    const series = [...sesion.series, { segundos }];
    const objetivoSeries = ej.series + (sesion.extra?.[ej.id] ?? 0);
    if (series.length < objetivoSeries) {
      setSesion({ ...sesion, series });
      return;
    }
    cerrarEjercicioTiempo(ej, series, onExercicioTerminado);
  };

  const guardarCardio = (duracion, distancia, onDone) => {
    const ej = getEj();
    const dia = getDia();
    let nuevos = actualizarCompartido(dias, ej.id, {
      historial: agregarEntradaHistorial(ej.historial, { fecha: hoy(), duracion, distancia }),
    });
    nuevos = marcarSesionDia(nuevos, dia.id, hoy());
    setDias(nuevos);
    setSesion((prev) => ({
      ...prev,
      ejIdx: null,
      series: [],
      hechos: { ...prev.hechos, [ej.id]: true },
      cerrados: { ...prev.cerrados, [ej.id]: instantaneaCierre(ej) },
      cardio: null,
    }));
    onDone?.();
  };

  const volverAlMenu = (timerFinActual = null) => {
    const ej = getEj();
    const nuevoProg = { ...sesion.progreso };
    if (ej && ej.tipo !== "cardio") {
      nuevoProg[ej.id] = {
        series: sesion.series,
        pesoActual: sesion.pesoActual,
        timerFin: timerFinActual && timerFinActual > Date.now() ? timerFinActual : null,
      };
    }
    setSesion({ ...sesion, ejIdx: null, series: [], progreso: nuevoProg });
  };

  const terminarConResumen = (diasFinales, onNavigate) => {
    setSesion(null);
    setAviso("");
    const r = resumenSesion(diasFinales, hoy());
    setResumen(r);
    onNavigate?.(r);
  };

  const salirSesion = (onNavigate) => {
    const ej = getEj();
    const progreso = { ...sesion.progreso };
    if (ej && ej.tipo !== "cardio" && sesion.series.length > 0) {
      progreso[ej.id] = { series: sesion.series, pesoActual: sesion.pesoActual };
    }
    const entradas = entradasAVolcar(progreso, {
      hechos: sesion.hechos,
      saltados: sesion.saltados,
    });
    const dia = getDia();
    let nuevos = dias;
    if (entradas.length > 0) {
      entradas.forEach(([id, p]) => {
        const actual = dia.ejercicios.find((e) => e.id === id);
        if (!actual) return;
        nuevos = actualizarCompartido(nuevos, id, {
          historial: agregarEntradaHistorial(actual.historial, { fecha: hoy(), series: p.series }),
        });
      });
      nuevos = marcarSesionDia(nuevos, dia.id, hoy());
      setDias(nuevos);
    }

    const huboActividad = Object.keys(sesion.hechos).length > 0 || entradas.length > 0;

    if (huboActividad) {
      const minutos = minutosDeSesion(sesion.tiempo);
      if (minutos) {
        nuevos = registrarDuracion(nuevos, dia.id, hoy(), minutos);
        setDias(nuevos);
      }
    }

    if (!huboActividad) {
      setSesion(null);
      setAviso("");
      onNavigate?.(null);
      return;
    }

    // Filtrar solo los ejercicios hechos en esta sesión para el resumen
    const hechosIds = new Set([
      ...Object.keys(sesion.hechos),
      ...entradas.map(([id]) => id),
    ]);
    const diasResumen = nuevos.map((d) => ({
      ...d,
      ejercicios: d.ejercicios.filter((e) => hechosIds.has(e.id)),
    }));

    terminarConResumen(diasResumen, onNavigate);
  };

  const editarSerie = (idx, campo, valor) => {
    setSesion(editarSerieEnSesion(sesion, idx, campo, valor));
  };

  const actualizarEjercicio = (ejId, cambios) => {
    setDias((prev) => actualizarCompartido(prev, ejId, cambios));
  };

  const agregarEjercicioADia = (diaId, tipo, campos) => {
    let nuevo;
    if (tipo === "cardio") nuevo = crearEjercicioCardio(campos.nombre, campos.duracionMin);
    else if (tipo === "tiempo") nuevo = crearEjercicioTiempo(campos.nombre, campos.duracionObjetivo, campos.series, campos.descanso);
    else nuevo = crearEjercicio(campos.nombre, campos.peso, campos.incremento, campos.series, campos.repsMin, campos.repsMax || null, campos.descanso);
    setDias((prev) => prev.map((d) => d.id === diaId ? { ...d, ejercicios: [...d.ejercicios, nuevo] } : d));
  };

  const eliminarEjercicioDeApp = (diaId, ejId) => {
    setDias((prev) => prev.map((d) => d.id === diaId ? { ...d, ejercicios: d.ejercicios.filter((e) => e.id !== ejId) } : d));
  };

  const completarOnboarding = () => {
    setOnboardingDone(true);
    storage.set(CLAVE_ONBOARDING, "done").catch(() => {});
  };

  // Cierra el ejercicio actual con las series que ya se tienen (sin agregar una nueva)
  const terminarEjercicioActual = (onDone) => {
    const ej = getEj();
    if (!ej) return;
    if (ej.tipo === "tiempo") cerrarEjercicioTiempo(ej, sesion.series, onDone);
    else cerrarEjercicio(ej, sesion.series, onDone);
  };

  const reabrirEjercicio = (idx) => {
    const dia = getDia();
    const e = dia.ejercicios[idx];
    const { campos, sesion: reabierta } = deshacerCierre(sesion, e, hoy());
    setDias(actualizarCompartido(dias, e.id, campos));
    setSesion({ ...reabierta, ejIdx: idx });
  };

  return (
    <AppContext.Provider
      value={{
        cargando,
        onboardingDone,
        completarOnboarding,
        dias,
        sesion,
        sesionPausada,
        aviso,
        resumen,
        setResumen,
        getDia,
        getEj,
        comenzar,
        pausarSesion,
        reanudarSesion,
        descartarYEmpezar,
        iniciarEjercicio,
        alternarSaltado,
        agregarSerieExtra,
        guardarSerie,
        guardarSerieTiempo,
        guardarCardio,
        volverAlMenu,
        salirSesion,
        reabrirEjercicio,
        editarSerie,
        terminarEjercicioActual,
        actualizarEjercicio,
        agregarEjercicioADia,
        eliminarEjercicioDeApp,
        setSesion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
