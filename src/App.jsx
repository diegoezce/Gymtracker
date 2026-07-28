import { useEffect, useRef, useState } from "react";
import { storage, CLAVE_RUTINA } from "./storage";
import { RUTINA_INICIAL } from "./domain/rutina";
import { progresar, aprender } from "./domain/progression";
import { hoy } from "./utils/format";
import { Marco } from "./components/Marco";
import { Inicio } from "./components/Inicio";
import { Sesion } from "./components/Sesion";
import { Ajustes } from "./components/Ajustes";
import { Historial } from "./components/Historial";
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
        if (r?.value) setDias(JSON.parse(r.value));
      } catch (e) {
        /* primera vez: arranca con la rutina por defecto */
      }
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

  const comenzar = (dia) =>
    setSesion({
      diaId: dia.id,
      idx: 0,
      pesoActual: dia.ejercicios[0].peso,
      series: [],
      hechos: {},
    });

  const dia = sesion ? dias.find((d) => d.id === sesion.diaId) : null;
  const ej = dia ? dia.ejercicios[sesion.idx] : null;

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
                : {
                    ...e,
                    peso,
                    repsObjetivo,
                    incremento,
                    ajustes,
                    historial: [...e.historial, { fecha: hoy(), series }].slice(-40),
                  }
            ),
          }
    );
    setDias(nuevos);
    setAviso(av || nota);
    const sig = sesion.idx + 1;
    if (sig >= dia.ejercicios.length) {
      setSesion(null);
      setPantalla("inicio");
    } else {
      const diaAct = nuevos.find((d) => d.id === dia.id);
      setSesion({
        ...sesion,
        idx: sig,
        series: [],
        pesoActual: diaAct.ejercicios[sig].peso,
        hechos: { ...sesion.hechos, [ej.id]: true },
      });
    }
  };

  const salirSesion = () => {
    setSesion(null);
    setPantalla("inicio");
  };

  if (sesion && ej) {
    return (
      <Sesion
        dia={dia}
        ej={ej}
        sesion={sesion}
        setSesion={setSesion}
        guardarSerie={guardarSerie}
        salir={salirSesion}
      />
    );
  }

  if (pantalla === "ajustes")
    return <Ajustes dias={dias} setDias={setDias} volver={() => setPantalla("inicio")} />;

  if (pantalla === "historial")
    return <Historial dias={dias} volver={() => setPantalla("inicio")} />;

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
