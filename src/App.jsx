import { useEffect, useRef, useState } from "react";
import { storage, CLAVE_RUTINA } from "./storage";
import { RUTINA_INICIAL } from "./domain/rutina";
import { leerToken, leerAutoSync, fetchSesiones, aplicarSesiones, pushSesiones, construirSesiones, pushRutina, fetchRutina, aplicarRutina } from "./sync/hcAdapter";
import { progresar, aprender } from "./domain/progression";
import { hoy } from "./utils/format";
import { Marco } from "./components/Marco";
import { Inicio } from "./components/Inicio";
import { DiaMenu } from "./components/DiaMenu";
import { Sesion } from "./components/Sesion";
import { Ajustes } from "./components/Ajustes";
import { Progreso } from "./components/Progreso";
import { C, MONO } from "./theme";

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [dias, setDias] = useState(RUTINA_INICIAL);
  const [pantalla, setPantalla] = useState("inicio");
  const [sesion, setSesion] = useState(null);
  const [aviso, setAviso] = useState("");
  const primeraCarga = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(CLAVE_RUTINA);
        if (r?.value) {
          setDias(JSON.parse(r.value));
        } else {
          // Sin datos locales: restaurar rutina + historial desde HC
          const token = leerToken();
          if (token) {
            try {
              const [{ rutina }, { sesiones }] = await Promise.all([
                fetchRutina(token),
                fetchSesiones(token),
              ]);
              if (rutina) {
                setDias((prev) => aplicarSesiones(aplicarRutina(rutina, prev), sesiones));
              } else {
                setDias((prev) => aplicarSesiones(prev, sesiones));
              }
            } catch (_) {}
          }
        }
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

  const syncRutinaSilenciosa = (diasActualizados) => {
    const token = leerToken();
    if (!token || !leerAutoSync()) return;
    pushRutina(token, diasActualizados).catch(() => {});
  };

  // sesion = { diaId, ejIdx: null | number, pesoActual, series, hechos }
  // ejIdx null → menú del día; number → ejercicio en curso

  const comenzar = (dia) =>
    setSesion({ diaId: dia.id, ejIdx: null, pesoActual: 0, series: [], hechos: {}, progreso: {} });

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
    const nuevos = dias.map((d) =>
      d.id !== dia.id ? d : {
        ...d,
        ejercicios: d.ejercicios.map((e) =>
          e.id !== ej.id ? e : {
            ...e,
            historial: [...e.historial, { fecha: hoy(), duracion, distancia }].slice(-40),
          }
        ),
      }
    );
    setDias(nuevos);
    syncSilencioso(nuevos);
    setSesion({ ...sesion, ejIdx: null, series: [], hechos: { ...sesion.hechos, [ej.id]: true } });
  };

  const guardarSerie = (reps, rir) => {
    const series = [...sesion.series, { peso: sesion.pesoActual, reps, rir }];
    if (series.length < ej.series) {
      setSesion({ ...sesion, series });
      return;
    }
    cerrarEjercicio(series);
  };

  const cerrarEjercicio = (series) => {
    const { peso, repsObjetivo, nota } = progresar(ej, series);
    const { ajustes, incremento, aviso: av } = aprender(ej, series[0].peso);
    const nuevos = dias.map((d) =>
      d.id !== dia.id
        ? d
        : {
            ...d,
            ejercicios: d.ejercicios.map((e) =>
              e.id !== ej.id
                ? e
                : { ...e, peso, repsObjetivo, incremento, ajustes,
                    historial: [...e.historial, { fecha: hoy(), series }].slice(-40) }
            ),
          }
    );
    setDias(nuevos);
    setAviso(av || nota);
    syncSilencioso(nuevos);
    setSesion({ ...sesion, ejIdx: null, series: [], hechos: { ...sesion.hechos, [ej.id]: true } });
  };

  // Construye el progreso actualizado con las series del ejercicio en curso (si las hay)
  const progresoActual = () => {
    if (sesion.series.length > 0 && ej && ej.tipo !== "cardio") {
      return { ...sesion.progreso, [ej.id]: { series: sesion.series, pesoActual: sesion.pesoActual } };
    }
    return sesion.progreso ?? {};
  };

  // Vuelve al menú: guarda las series parciales en sesion.progreso (en memoria, no en historial)
  const volverAlMenu = () => {
    setSesion({ ...sesion, ejIdx: null, series: [], progreso: progresoActual() });
  };

  // Sale de la sesión: vuelca todo el progreso parcial al historial
  const salirSesion = () => {
    const progreso = progresoActual();
    const hayParciales = Object.values(progreso).some((p) => p.series.length > 0);
    if (hayParciales) {
      const nuevos = dias.map((d) => {
        if (d.id !== sesion.diaId) return d;
        return {
          ...d,
          ejercicios: d.ejercicios.map((e) => {
            const p = progreso[e.id];
            if (!p || p.series.length === 0) return e;
            return { ...e, historial: [...e.historial, { fecha: hoy(), series: p.series }].slice(-40) };
          }),
        };
      });
      setDias(nuevos);
      syncSilencioso(nuevos);
    }
    setSesion(null);
    setPantalla("inicio");
  };

  const restaurarDesdeHC = async () => {
    const token = leerToken();
    if (!token) throw new Error("Sin token");
    const { sesiones } = await fetchSesiones(token);
    setDias((prev) => aplicarSesiones(prev, sesiones));
    return sesiones.length;
  };

  if (sesion && !ej) {
    return (
      <DiaMenu
        dia={dia}
        hechos={sesion.hechos}
        progreso={sesion.progreso ?? {}}
        onEjercicio={iniciarEjercicio}
        onTerminar={salirSesion}
      />
    );
  }

  if (sesion && ej) {
    return (
      <Sesion
        dia={dia}
        ej={ej}
        sesion={sesion}
        setSesion={setSesion}
        guardarSerie={guardarSerie}
        guardarCardio={guardarCardio}
        salir={volverAlMenu}
        terminar={salirSesion}
      />
    );
  }

  if (pantalla === "ajustes")
    return <Ajustes dias={dias} setDias={setDias} restaurarDesdeHC={restaurarDesdeHC} volver={() => { syncRutinaSilenciosa(dias); setPantalla("inicio"); }} />;

  if (pantalla === "historial")
    return <Progreso dias={dias} volver={() => setPantalla("inicio")} />;

  return (
    <Inicio
      dias={dias}
      aviso={aviso}
      comenzar={comenzar}
      irHistorial={() => setPantalla("historial")}
      irAjustes={() => setPantalla("ajustes")}
    />
  );
}
