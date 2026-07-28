import { useEffect, useRef, useState } from "react";
import { storage, CLAVE_RUTINA } from "./storage";
import { RUTINA_INICIAL } from "./domain/rutina";
import { leerToken, fetchSesiones, aplicarSesiones, pushSesiones, construirSesiones } from "./sync/hcAdapter";
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
          const token = leerToken();
          if (token) {
            try {
              const { sesiones } = await fetchSesiones(token);
              setDias((prev) => aplicarSesiones(prev, sesiones));
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
    if (!token) return;
    pushSesiones(token, construirSesiones(diasActualizados)).catch(() => {});
  };

  // sesion = { diaId, ejIdx: null | number, pesoActual, series, hechos }
  // ejIdx null → menú del día; number → ejercicio en curso

  const comenzar = (dia) =>
    setSesion({ diaId: dia.id, ejIdx: null, pesoActual: 0, series: [], hechos: {} });

  const dia = sesion ? dias.find((d) => d.id === sesion.diaId) : null;
  const ej = dia && sesion.ejIdx !== null ? dia.ejercicios[sesion.ejIdx] : null;

  const iniciarEjercicio = (idx) =>
    setSesion({ ...sesion, ejIdx: idx, series: [], pesoActual: dia.ejercicios[idx].peso });

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

  const guardarParcialSiHay = () => {
    if (sesion?.series?.length > 0 && dia && ej) {
      const nuevos = dias.map((d) =>
        d.id !== dia.id
          ? d
          : {
              ...d,
              ejercicios: d.ejercicios.map((e) =>
                e.id !== ej.id
                  ? e
                  : { ...e, historial: [...e.historial, { fecha: hoy(), series: sesion.series }].slice(-40) }
              ),
            }
      );
      setDias(nuevos);
      syncSilencioso(nuevos);
    }
  };

  // Vuelve al menú del día guardando las series parciales del ejercicio en curso
  const volverAlMenu = () => {
    guardarParcialSiHay();
    setSesion({ ...sesion, ejIdx: null, series: [] });
  };

  // Sale de la sesión completamente
  const salirSesion = () => {
    guardarParcialSiHay();
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
        salir={volverAlMenu}
      />
    );
  }

  if (pantalla === "ajustes")
    return <Ajustes dias={dias} setDias={setDias} restaurarDesdeHC={restaurarDesdeHC} volver={() => setPantalla("inicio")} />;

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
