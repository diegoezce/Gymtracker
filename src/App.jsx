import { useEffect, useRef, useState } from "react";
import { storage, CLAVE_RUTINA, CLAVE_SESION } from "./storage";
import { RUTINA_INICIAL, actualizarCompartido, vincularEjercicio, resincronizarCompartidos, agregarEntradaHistorial, editarEntradaHistorial, eliminarEntradaHistorial, fusionarEjercicios, marcarSesionDia } from "./domain/rutina";
import { leerToken, leerAutoSync, fetchSesiones, aplicarSesiones, pushSesiones, construirSesiones, fetchRutina, aplicarRutina, SYNC_KEY, TOKEN_KEY } from "./sync/hcAdapter";
import { progresar, aprender } from "./domain/progression";
import { hoy } from "./utils/format";
import { Marco } from "./components/Marco";
import { Inicio } from "./components/Inicio";
import { DiaMenu } from "./components/DiaMenu";
import { Sesion } from "./components/Sesion";
import { Ajustes } from "./components/Ajustes";
import { Progreso } from "./components/Progreso";
import { ConfirmarSync } from "./components/ConfirmarSync";
import { C, MONO } from "./theme";

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [dias, setDias] = useState(RUTINA_INICIAL);
  const [pantalla, setPantalla] = useState("inicio");
  const [sesion, setSesion] = useState(null);
  const [sesionPausada, setSesionPausada] = useState(false);
  const [aviso, setAviso] = useState("");
  const [preguntaSync, setPreguntaSync] = useState(null);
  const primeraCarga = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(CLAVE_RUTINA);
        let diasLocales = null;
        if (r?.value) {
          // Resincroniza al abrir: si dos copias del mismo ejercicio (mismo id
          // en días distintos) quedaron con historiales distintos, se unen acá.
          diasLocales = resincronizarCompartidos(JSON.parse(r.value));
          setDias(diasLocales);
        }

        // Restaurar desde HC si: no hay datos locales, O si los hay pero todos
        // los ejercicios tienen historial vacío (datos corruptos / borrados).
        const token = leerToken();
        if (token) {
          const sinHistorial = !diasLocales ||
            diasLocales.every((d) => d.ejercicios.every((e) => !e.historial?.length));
          if (sinHistorial) {
            try {
              const [{ rutina }, { sesiones }] = await Promise.all([
                fetchRutina(token),
                fetchSesiones(token),
              ]);
              if (rutina) {
                setDias((prev) => resincronizarCompartidos(aplicarSesiones(aplicarRutina(rutina, prev), sesiones)));
              } else {
                setDias((prev) => resincronizarCompartidos(aplicarSesiones(prev, sesiones)));
              }
            } catch (_) {}
          }
        }
      } catch (e) {}
      try {
        const s = await storage.get(CLAVE_SESION);
        if (s?.value) setSesion(JSON.parse(s.value));
      } catch (e) {}
      setCargando(false);
    })();
  }, []);

  useEffect(() => {
    if (cargando) return;
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    (async () => {
      try {
        await storage.set(CLAVE_RUTINA, JSON.stringify(dias));
      } catch (e) {
        setAviso("No se pudo guardar. Anotá la última serie a mano.");
      }
    })();
  }, [dias, cargando]);

  useEffect(() => {
    if (cargando) return;
    (async () => {
      try {
        await storage.set(CLAVE_SESION, sesion === null ? "" : JSON.stringify(sesion));
      } catch (e) {}
    })();
  }, [sesion, cargando]);

  if (cargando)
    return (
      <Marco>
        <div style={{ color: C.gris, fontFamily: MONO, fontSize: 13, padding: 40 }}>
          Cargando…
        </div>
      </Marco>
    );

  const syncSilencioso = (diasActualizados) => {
    const token = leerToken();
    if (!token || !leerAutoSync()) return;
    pushSesiones(token, construirSesiones(diasActualizados)).catch(() => {});
  };

  // La rutina NO se envía sola: pushRutina reemplaza lo que haya en HC, así
  // que sólo sale desde el botón explícito de Ajustes. Auto-sync cubre las
  // sesiones, que son aditivas.

  // sesion = { diaId, ejIdx: null | number, pesoActual, series, hechos, progreso, saltados, extra }
  // ejIdx null → menú del día; number → ejercicio en curso
  // saltados vive sólo acá: saltear es "hoy no lo hago", no toca la rutina
  // extra vive sólo acá también: series de más que el usuario pide en el
  // momento, no toca ej.series (la plantilla) — ver agregarSerieExtra

  const comenzar = (dia) => {
    setAviso("");
    setSesionPausada(false);
    setSesion({ diaId: dia.id, ejIdx: null, pesoActual: 0, series: [], hechos: {}, progreso: {}, saltados: {}, extra: {} });
  };

  // Pausar: vuelve a Inicio sin tocar la sesión — queda intacta (en memoria
  // y persistida) para retomarla. No escribe nada en `dias`/historial.
  const pausarSesion = () => setSesionPausada(true);
  const reanudarSesion = () => setSesionPausada(false);

  // Empezar un día distinto al que está en pausa descarta lo no guardado de
  // ese otro (nunca llegó a `dias`, sólo vivía en `sesion.progreso`).
  const descartarYEmpezar = (diaNuevo) => comenzar(diaNuevo);

  const dia = sesion ? dias.find((d) => d.id === sesion.diaId) : null;
  const ej = dia && sesion.ejIdx !== null ? dia.ejercicios[sesion.ejIdx] : null;

  const iniciarEjercicio = (idx) => {
    const e = dia.ejercicios[idx];
    const guardado = sesion.progreso?.[e.id];
    setSesion({
      ...sesion,
      ejIdx: idx,
      series: guardado?.series ?? [],
      pesoActual: guardado?.pesoActual ?? (e.tipo === "cardio" ? 0 : e.peso),
    });
  };

  const guardarCardio = (duracion, distancia) => {
    let nuevos = actualizarCompartido(dias, ej.id, {
      historial: agregarEntradaHistorial(ej.historial, { fecha: hoy(), duracion, distancia }),
    });
    nuevos = marcarSesionDia(nuevos, dia.id, hoy());
    setDias(nuevos);
    syncSilencioso(nuevos);
    setSesion({ ...sesion, ejIdx: null, series: [], hechos: { ...sesion.hechos, [ej.id]: true } });
  };

  // Serie extra = "puedo una más, ahora". Sólo estado de sesión — ej.series
  // (la plantilla) no cambia, así que no se comparte ni persiste al día siguiente.
  const agregarSerieExtra = () => {
    const extra = { ...sesion.extra, [ej.id]: (sesion.extra?.[ej.id] ?? 0) + 1 };
    setSesion({ ...sesion, extra });
  };

  const guardarSerie = (reps, rir) => {
    const series = [...sesion.series, { peso: sesion.pesoActual, reps, rir }];
    const objetivoSeries = ej.series + (sesion.extra?.[ej.id] ?? 0);
    if (series.length < objetivoSeries) {
      setSesion({ ...sesion, series });
      return;
    }
    cerrarEjercicio(series);
  };

  const cerrarEjercicio = (series) => {
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
    setAviso(av || nota);
    syncSilencioso(nuevos);
    setSesion({ ...sesion, ejIdx: null, series: [], hechos: { ...sesion.hechos, [ej.id]: true } });
  };

  const guardarSerieTiempo = (segundos) => {
    const series = [...sesion.series, { segundos }];
    const objetivoSeries = ej.series + (sesion.extra?.[ej.id] ?? 0);
    if (series.length < objetivoSeries) {
      setSesion({ ...sesion, series });
      return;
    }
    cerrarEjercicioTiempo(series);
  };

  const cerrarEjercicioTiempo = (series) => {
    const { duracionObjetivo, nota } = progresar(ej, series);
    let nuevos = actualizarCompartido(dias, ej.id, {
      duracionObjetivo,
      historial: agregarEntradaHistorial(ej.historial, { fecha: hoy(), series }),
    });
    nuevos = marcarSesionDia(nuevos, dia.id, hoy());
    setDias(nuevos);
    setAviso(nota);
    syncSilencioso(nuevos);
    setSesion({ ...sesion, ejIdx: null, series: [], hechos: { ...sesion.hechos, [ej.id]: true } });
  };

  // Vuelve al menú: guarda series parciales + timerFin en sesion.progreso (no en historial)
  const volverAlMenu = (timerFinActual = null) => {
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

  // Sale de la sesión: vuelca todo el progreso parcial al historial. Si
  // hubo actividad y el auto-sync está apagado, primero pregunta si
  // sincronizar a mano — para no depender de acordarse del botón manual
  // en Ajustes (ver ConfirmarSync).
  const salirSesion = () => {
    const progreso = { ...sesion.progreso };
    if (ej && ej.tipo !== "cardio" && sesion.series.length > 0) {
      progreso[ej.id] = { series: sesion.series, pesoActual: sesion.pesoActual };
    }
    // los salteados no se registran, aunque tengan series parciales cargadas
    const entradas = Object.entries(progreso).filter(
      ([id, p]) => p.series?.length > 0 && !sesion.saltados?.[id]
    );
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

    // ejercicios cerrados del todo durante la sesión (no sólo el parcial de arriba)
    const huboActividad = Object.keys(sesion.hechos).length > 0 || entradas.length > 0;
    const token = leerToken();
    if (huboActividad && token && !leerAutoSync()) {
      setPreguntaSync(nuevos);
      return;
    }
    if (huboActividad) syncSilencioso(nuevos);
    setSesion(null);
    setPantalla("inicio");
  };

  const confirmarSyncYSalir = async () => {
    try {
      const token = leerToken();
      await pushSesiones(token, construirSesiones(preguntaSync));
      localStorage.setItem(SYNC_KEY, new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }));
      setPreguntaSync(null);
      setSesion(null);
      setPantalla("inicio");
    } catch (e) {
      if (e.message === "401") localStorage.removeItem(TOKEN_KEY);
      throw e; // ConfirmarSync lo muestra y deja reintentar o salir sin sincronizar
    }
  };

  const salirSinSincronizar = () => {
    setPreguntaSync(null);
    setSesion(null);
    setPantalla("inicio");
  };

  // Trae sólo el historial: lo aplica sobre la rutina local que ya tengas.
  const traerHistorialDeHC = async () => {
    const token = leerToken();
    if (!token) throw new Error("Sin token");
    const { sesiones } = await fetchSesiones(token);
    setDias((prev) => resincronizarCompartidos(aplicarSesiones(prev, sesiones)));
    return sesiones.length;
  };

  // Reemplaza la rutina local por la de HC, conservando el historial local
  // de los ejercicios que coinciden por id. El fetch lo hace el panel de
  // Ajustes, que necesita los datos para mostrar la confirmación.
  const aplicarRutinaDeHC = (rutina) => {
    setDias((prev) => resincronizarCompartidos(aplicarRutina(rutina, prev)));
  };

  // Carga manual de una sesión que nunca se registró (o que se perdió).
  // Va por agregarEntradaHistorial, así que si ya hay una entrada de esa
  // fecha las series se suman a la existente en vez de reemplazarla.
  const agregarHistorial = (ejId, entrada) => {
    const ejActual = dias.flatMap((d) => d.ejercicios).find((e) => e.id === ejId);
    if (!ejActual) return;
    const nuevos = actualizarCompartido(dias, ejId, {
      historial: agregarEntradaHistorial(ejActual.historial ?? [], entrada),
    });
    setDias(nuevos);
    syncSilencioso(nuevos);
  };

  // Corrección manual de un registro viejo (o de hoy) desde Progreso.
  const editarHistorial = (ejId, fechaOriginal, cambios) => {
    const nuevos = editarEntradaHistorial(dias, ejId, fechaOriginal, cambios);
    setDias(nuevos);
    syncSilencioso(nuevos);
  };

  const eliminarHistorial = (ejId, fecha) => {
    const nuevos = eliminarEntradaHistorial(dias, ejId, fecha);
    setDias(nuevos);
    syncSilencioso(nuevos);
  };

  const fusionarHistorial = (idSuperviviente, idPerdedor) => {
    const nuevos = fusionarEjercicios(dias, idSuperviviente, idPerdedor);
    setDias(nuevos);
    syncSilencioso(nuevos);
  };

  // Agrega ejFuente (existente en otro día, o recién creado) a diaId,
  // preservando su id si ya existía en otro lado para que compartan progreso.
  const agregarEjercicioADia = (diaId, ejFuente, configDia = {}) => {
    const nuevos = vincularEjercicio(dias, ejFuente, diaId, configDia);
    setDias(nuevos);
  };

  // Saltear = "hoy no lo hago". Sólo estado de sesión; la rutina no cambia.
  const alternarSaltado = (ejId) => {
    const saltados = { ...sesion.saltados };
    if (saltados[ejId]) delete saltados[ejId];
    else saltados[ejId] = true;
    setSesion({ ...sesion, saltados });
  };

  if (preguntaSync) {
    return <ConfirmarSync onSincronizar={confirmarSyncYSalir} onSalirSinSincronizar={salirSinSincronizar} />;
  }

  if (sesion && !sesionPausada && !ej) {
    return (
      <DiaMenu
        dia={dia}
        dias={dias}
        hechos={sesion.hechos}
        progreso={sesion.progreso ?? {}}
        saltados={sesion.saltados ?? {}}
        onEjercicio={iniciarEjercicio}
        onAlternarSaltado={alternarSaltado}
        onTerminar={salirSesion}
        onPausar={pausarSesion}
        onAgregarEjercicio={(ejFuente, configDia) => agregarEjercicioADia(dia.id, ejFuente, configDia)}
      />
    );
  }

  if (sesion && !sesionPausada && ej) {
    return (
      <Sesion
        dia={dia}
        ej={ej}
        sesion={sesion}
        setSesion={setSesion}
        guardarSerie={guardarSerie}
        guardarSerieTiempo={guardarSerieTiempo}
        guardarCardio={guardarCardio}
        agregarSerieExtra={agregarSerieExtra}
        initialTimerFin={sesion.progreso?.[ej.id]?.timerFin ?? null}
        salir={volverAlMenu}
        terminarEjercicio={() =>
          ej.tipo === "tiempo" ? cerrarEjercicioTiempo(sesion.series) : cerrarEjercicio(sesion.series)
        }
      />
    );
  }

  if (pantalla === "ajustes")
    return (
      <Ajustes
        dias={dias}
        setDias={setDias}
        agregarEjercicioADia={agregarEjercicioADia}
        traerHistorialDeHC={traerHistorialDeHC}
        aplicarRutinaDeHC={aplicarRutinaDeHC}
        onImportarRutina={(nuevos) => setDias(resincronizarCompartidos(nuevos))}
        volver={() => setPantalla("inicio")}
      />
    );

  if (pantalla === "historial")
    return (
      <Progreso
        dias={dias}
        volver={() => setPantalla("inicio")}
        onAgregarHistorial={agregarHistorial}
        onEditarHistorial={editarHistorial}
        onEliminarHistorial={eliminarHistorial}
        onFusionarHistorial={fusionarHistorial}
      />
    );

  return (
    <Inicio
      dias={dias}
      aviso={aviso}
      sesion={sesion}
      sesionPausada={sesionPausada}
      comenzar={comenzar}
      onReanudar={reanudarSesion}
      onDescartarYEmpezar={descartarYEmpezar}
      irHistorial={() => setPantalla("historial")}
      irAjustes={() => setPantalla("ajustes")}
    />
  );
}
