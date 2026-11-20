import { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { fmt, hoy } from "@gymtracker/core/utils/format";
import { sugerirPeso, describirBase } from "@gymtracker/core/domain/progression";
import { useApp } from "../context/AppContext";
import { Boton } from "../components/Boton";
import { C, MONO } from "../theme";

/* ── Timer de descanso ──────────────────────────────── */
function TimerDescanso({ segundos, total, onSaltar }) {
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  const urgente = segundos <= 5;
  return (
    <View style={t.wrap}>
      <Text style={t.etiqueta}>DESCANSÁ</Text>
      <View style={[t.circulo, urgente && { borderColor: C.oxido }]}>
        <Text style={[t.tiempo, { color: urgente ? C.oxido : C.sodio }]}>{mm}:{ss}</Text>
        <Text style={t.total}>/{total}s</Text>
      </View>
      <Boton tono="fantasma" alto={48} onPress={onSaltar}>Saltar descanso</Boton>
    </View>
  );
}
const t = StyleSheet.create({
  wrap: { marginTop: 28, alignItems: "center", gap: 20 },
  etiqueta: { fontFamily: MONO, fontSize: 11, color: C.gris, letterSpacing: 1 },
  circulo: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 6, borderColor: C.sodio,
    alignItems: "center", justifyContent: "center",
  },
  tiempo: { fontFamily: MONO, fontSize: 32, fontWeight: "700" },
  total: { fontFamily: MONO, fontSize: 12, color: C.gris },
});

/* ── Selector de reps/RIR ───────────────────────────── */
function Repeticiones({ objetivo, onGuardar, series }) {
  const [reps, setReps] = useState(objetivo);
  const [rir, setRir] = useState(null);
  useEffect(() => { setReps(objetivo); setRir(null); }, [objetivo, series.length]);

  const opciones = [
    { v: 3, t: "3+", d: "sobró" },
    { v: 2, t: "2", d: "cómodo" },
    { v: 1, t: "1", d: "justo" },
    { v: 0, t: "0", d: "al fallo" },
  ];

  return (
    <View style={{ marginTop: 26 }}>
      <Text style={r.etiqueta}>REPETICIONES</Text>
      <View style={r.repsRow}>
        <TouchableOpacity onPress={() => setReps(Math.max(1, reps - 1))} style={r.cuadro}>
          <Text style={r.cuadroTexto}>−</Text>
        </TouchableOpacity>
        <View style={r.repsBox}>
          <Text style={r.repsNum}>{reps}</Text>
        </View>
        <TouchableOpacity onPress={() => setReps(reps + 1)} style={r.cuadro}>
          <Text style={r.cuadroTexto}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={[r.etiqueta, { marginTop: 22 }]}>¿CUÁNTO TE SOBRÓ?</Text>
      <View style={r.opciones}>
        {opciones.map((o) => {
          const activo = rir === o.v;
          return (
            <TouchableOpacity
              key={o.v}
              onPress={() => setRir(o.v)}
              activeOpacity={0.8}
              style={[r.opcion, activo && r.opcionActiva]}
            >
              <Text style={[r.opcionNum, activo && { color: "#14120F" }]}>{o.t}</Text>
              <Text style={[r.opcionDesc, activo && { color: "#14120F", opacity: 0.8 }]}>{o.d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ marginTop: 18 }}>
        <Boton
          tono={rir === null ? "neutro" : "fuerte"}
          alto={68}
          onPress={() => rir !== null && onGuardar(reps, rir)}
          disabled={rir === null}
        >
          Guardar serie
        </Boton>
      </View>
    </View>
  );
}
const r = StyleSheet.create({
  etiqueta: { fontFamily: MONO, fontSize: 11, color: C.gris, letterSpacing: 1 },
  repsRow: { flexDirection: "row", alignItems: "stretch", gap: 10, marginTop: 10 },
  cuadro: {
    width: 56, backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 4, alignItems: "center", justifyContent: "center",
  },
  cuadroTexto: { fontSize: 24, color: C.gris },
  repsBox: {
    flex: 1, backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 4, alignItems: "center", justifyContent: "center", paddingVertical: 10,
  },
  repsNum: { fontFamily: MONO, fontSize: 40, fontWeight: "700", color: C.hueso },
  opciones: { flexDirection: "row", gap: 8, marginTop: 10 },
  opcion: {
    flex: 1, minHeight: 88, backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 4, alignItems: "center", justifyContent: "center", gap: 4,
  },
  opcionActiva: { backgroundColor: C.sodio, borderColor: C.sodio },
  opcionNum: { fontFamily: MONO, fontSize: 26, fontWeight: "700", color: C.hueso },
  opcionDesc: { fontSize: 11, color: C.hueso, opacity: 0.55 },
});

/* ── Input de tiempo ────────────────────────────────── */
function TiempoInput({ objetivo, onGuardar, series }) {
  const [seg, setSeg] = useState(objetivo);
  useEffect(() => { setSeg(objetivo); }, [objetivo, series.length]);
  return (
    <View style={{ marginTop: 26 }}>
      <Text style={[r.etiqueta]}>SEGUNDOS</Text>
      <View style={[r.repsRow, { marginTop: 10 }]}>
        <TouchableOpacity onPress={() => setSeg(Math.max(5, seg - 5))} style={r.cuadro}>
          <Text style={r.cuadroTexto}>−5</Text>
        </TouchableOpacity>
        <View style={r.repsBox}>
          <Text style={r.repsNum}>{seg}s</Text>
        </View>
        <TouchableOpacity onPress={() => setSeg(seg + 5)} style={r.cuadro}>
          <Text style={r.cuadroTexto}>+5</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 18 }}>
        <Boton tono="fuerte" alto={68} onPress={() => onGuardar(seg)}>Guardar serie</Boton>
      </View>
    </View>
  );
}

/* ── Cardio ─────────────────────────────────────────── */
function SesionCardio({ ej, guardarCardio, salir }) {
  const ultima = [...ej.historial].reverse().find((h) => h.fecha !== hoy());
  const [duracion, setDuracion] = useState(ultima?.duracion ?? ej.duracionMin);
  const [distancia, setDistancia] = useState(ultima?.distancia ?? ej.distanciaKm ?? 0);
  const trackDist = ej.distanciaKm !== null;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={ss.ejNombre}>{ej.nombre}</Text>
      <Text style={ss.ejEtiqueta}>Cardio · objetivo {ej.duracionMin} min{trackDist ? ` · ${ej.distanciaKm} km` : ""}</Text>

      <Text style={[ss.ejEtiqueta, { marginTop: 24 }]}>DURACIÓN (MIN)</Text>
      <View style={ss.numRow}>
        <TouchableOpacity onPress={() => setDuracion(Math.max(1, duracion - 5))} style={ss.numBtn}>
          <Text style={ss.numBtnTxt}>−5</Text>
        </TouchableOpacity>
        <View style={ss.numBox}>
          <Text style={ss.numVal}>{duracion}</Text>
        </View>
        <TouchableOpacity onPress={() => setDuracion(duracion + 5)} style={ss.numBtn}>
          <Text style={ss.numBtnTxt}>+5</Text>
        </TouchableOpacity>
      </View>

      {trackDist && (
        <>
          <Text style={[ss.ejEtiqueta, { marginTop: 20 }]}>DISTANCIA (KM)</Text>
          <View style={ss.numRow}>
            <TouchableOpacity onPress={() => setDistancia((d) => Math.max(0, Math.round((d - 0.5) * 10) / 10))} style={ss.numBtn}>
              <Text style={ss.numBtnTxt}>−0.5</Text>
            </TouchableOpacity>
            <View style={ss.numBox}>
              <Text style={ss.numVal}>{(distancia ?? 0).toFixed(1)}</Text>
            </View>
            <TouchableOpacity onPress={() => setDistancia((d) => Math.round(((d ?? 0) + 0.5) * 10) / 10)} style={ss.numBtn}>
              <Text style={ss.numBtnTxt}>+0.5</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {ultima && (
        <View style={ss.historico}>
          <Text style={ss.historicoLabel}>Última sesión ({ultima.fecha})</Text>
          <Text style={ss.historicoVal}>
            {ultima.duracion} min{ultima.distancia != null ? ` · ${Number(ultima.distancia).toFixed(1)} km` : ""}
          </Text>
        </View>
      )}

      <View style={{ marginTop: 28, gap: 10 }}>
        <Boton tono="fuerte" alto={54} onPress={() => guardarCardio(duracion, trackDist ? distancia : null)}>Registrar</Boton>
        <Boton tono="fantasma" alto={48} onPress={salir}>Volver al menú del día</Boton>
      </View>
    </ScrollView>
  );
}

/* ── Pantalla principal de Sesión ───────────────────── */
export function SesionScreen({ navigation, route }) {
  const { diaId, ejId } = route.params;
  const ctx = useApp();
  const { dias, sesion, guardarSerie, guardarSerieTiempo, guardarCardio, agregarSerieExtra, volverAlMenu, editarSerie } = ctx;

  const dia = dias.find((d) => d.id === diaId);
  const ej = dia?.ejercicios[sesion?.ejIdx];

  const initialTimerFin = sesion?.progreso?.[ej?.id]?.timerFin ?? null;
  const validoInicial = initialTimerFin && initialTimerFin > Date.now() ? initialTimerFin : null;
  const [timerFin, setTimerFin] = useState(validoInicial);
  const [timerSeg, setTimerSeg] = useState(
    validoInicial ? Math.max(0, Math.ceil((validoInicial - Date.now()) / 1000)) : null
  );
  const prevSeg = useRef(timerSeg);
  const mountHandled = useRef(false);

  if (!ej) return null;

  const esTiempo = ej.tipo === "tiempo";
  const objetivoSeries = ej.tipo !== "cardio" ? ej.series + (sesion?.extra?.[ej.id] ?? 0) : 0;
  const hayMasSeries = sesion.series.length > 0 && sesion.series.length < objetivoSeries;
  const historialPrevio = ej.historial.filter((h) => h.fecha !== hoy());
  const ultimaSesion =
    !esTiempo && ej.tipo !== "cardio"
      ? [...historialPrevio].reverse().find((h) => h.series?.length > 0)
      : null;

  const sugerencia = hayMasSeries ? sugerirPeso(ej, sesion.series) : null;
  const baseSugerencia = sugerencia ? describirBase(sesion.series) : null;

  // Timer: arrancar/parar al cambiar cantidad de series
  useEffect(() => {
    if (!mountHandled.current) { mountHandled.current = true; return; }
    if (hayMasSeries && ej.descanso) {
      const fin = Date.now() + ej.descanso * 1000;
      setTimerFin(fin);
      setTimerSeg(ej.descanso);
      prevSeg.current = ej.descanso;
    } else {
      setTimerFin(null); setTimerSeg(null); prevSeg.current = null;
    }
  }, [sesion.series.length]);

  // Timer: tick
  useEffect(() => {
    if (!timerFin) return;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((timerFin - Date.now()) / 1000));
      if (rem !== prevSeg.current) {
        prevSeg.current = rem;
        if (rem === 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimerSeg(null); setTimerFin(null);
        } else {
          setTimerSeg(rem);
          if (rem === 10 || rem === 5) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerFin]);

  const saltarTimer = () => { setTimerFin(null); setTimerSeg(null); prevSeg.current = null; };
  const iniciarDescanso = () => {
    const fin = Date.now() + ej.descanso * 1000;
    setTimerFin(fin); setTimerSeg(ej.descanso); prevSeg.current = ej.descanso;
  };

  const [editandoIdx, setEditandoIdx] = useState(null);

  const goBack = () => {
    volverAlMenu(timerFin);
    navigation.goBack();
  };

  const terminarEjercicio = () => ctx.terminarEjercicioActual?.(() => navigation.goBack());

  if (ej.tipo === "cardio") {
    return (
      <SafeAreaView style={ss.root}>
        <View style={ss.cabecera}>
          <Text style={ss.cabeceraIzq}>{dia.nombre} · {sesion.ejIdx + 1}/{dia.ejercicios.length}</Text>
          <TouchableOpacity onPress={goBack} hitSlop={12}>
            <Text style={ss.cabeceraBtn}>VOLVER</Text>
          </TouchableOpacity>
        </View>
        <SesionCardio
          ej={ej}
          guardarCardio={(dur, dist) => guardarCardio(dur, dist, () => navigation.goBack())}
          salir={goBack}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ss.root}>
      <View style={ss.cabecera}>
        <Text style={ss.cabeceraIzq}>{dia.nombre} · {sesion.ejIdx + 1}/{dia.ejercicios.length}</Text>
        <TouchableOpacity onPress={goBack} hitSlop={12}>
          <Text style={ss.cabeceraBtn}>VOLVER</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={ss.ejNombre}>{ej.nombre}</Text>
        <Text style={ss.ejEtiqueta}>
          {sesion.series.length >= objetivoSeries
            ? `Serie ${sesion.series.length + 1} · extra`
            : `Serie ${sesion.series.length + 1} de ${objetivoSeries}`}
          {" · objetivo "}
          {esTiempo
            ? `${ej.duracionObjetivo}s`
            : `${ej.repsMax ? `${ej.repsObjetivo}–${ej.repsMax}` : ej.repsObjetivo} reps`}
          {ej.descanso ? ` · ${ej.descanso}s` : ""}
        </Text>
        <TouchableOpacity onPress={agregarSerieExtra}>
          <Text style={ss.serieExtra}>+ agregar una serie más</Text>
        </TouchableOpacity>

        {!esTiempo && (
          <View style={ss.historico}>
            {ultimaSesion ? (
              <>
                <Text style={ss.historicoLabel}>Última sesión · {ultimaSesion.fecha}</Text>
                {ultimaSesion.series.map((s, i) => (
                  <Text key={i} style={ss.historicoSerie}>
                    <Text style={{ color: C.gris }}>{i + 1}  </Text>
                    {fmt(s.peso)} kg × {s.reps} reps{s.rir === 0 ? " · fallo" : ""}
                  </Text>
                ))}
              </>
            ) : (
              <Text style={ss.historicoLabel}>Sin registro previo</Text>
            )}
          </View>
        )}

        {!esTiempo && (
          <View style={ss.pesoCard}>
            <View style={ss.pesoCentro}>
              <Text style={ss.pesoNum}>{fmt(sesion.pesoActual)}</Text>
              <Text style={ss.ejEtiqueta}>KILOS</Text>
            </View>
            <View style={ss.pesoRow}>
              <TouchableOpacity
                style={ss.pesoBtn}
                onPress={() => ctx.setSesion({ ...sesion, pesoActual: Math.max(0, sesion.pesoActual - ej.incremento) })}
              >
                <Text style={ss.pesoBtnTxt}>−{fmt(ej.incremento)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.pesoBtn, { borderLeftWidth: 1, borderLeftColor: C.linea }]}
                onPress={() => ctx.setSesion({ ...sesion, pesoActual: sesion.pesoActual + ej.incremento })}
              >
                <Text style={ss.pesoBtnTxt}>+{fmt(ej.incremento)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {sugerencia && sugerencia.peso !== sesion.pesoActual && (
          <TouchableOpacity
            onPress={() => ctx.setSesion({ ...sesion, pesoActual: sugerencia.peso })}
            style={ss.sugerencia}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
              <Text style={ss.sugerenciaPeso}>
                {sugerencia.delta > 0 ? "↑" : sugerencia.delta < 0 ? "↓" : "→"} Sugerido: {fmt(sugerencia.peso)} kg
              </Text>
              <Text style={ss.sugerenciaToca}>tocá para usar</Text>
            </View>
            <Text style={ss.sugerenciaMotivo}>{sugerencia.motivo}</Text>
            {baseSugerencia && <Text style={ss.sugerenciaBase}>{baseSugerencia}</Text>}
          </TouchableOpacity>
        )}
        {sugerencia && sugerencia.peso === sesion.pesoActual && (
          <Text style={ss.sugerenciaOk}>
            {sugerencia.delta === 0 ? "Mantené este peso" : "Peso sugerido"} · {sugerencia.motivo}
          </Text>
        )}

        {timerSeg !== null ? (
          <TimerDescanso segundos={timerSeg} total={ej.descanso} onSaltar={saltarTimer} />
        ) : esTiempo ? (
          <TiempoInput
            objetivo={ej.duracionObjetivo}
            onGuardar={(seg) => guardarSerieTiempo(seg, () => navigation.goBack())}
            series={sesion.series}
          />
        ) : (
          <Repeticiones
            objetivo={ej.repsObjetivo}
            onGuardar={(reps, rir) => guardarSerie(reps, rir, () => navigation.goBack())}
            series={sesion.series}
          />
        )}

        <View style={{ marginTop: 28, gap: 8 }}>
          {timerSeg === null && ej.descanso > 0 && (
            <Boton tono="fantasma" alto={46} onPress={iniciarDescanso}>Descansar {ej.descanso}s</Boton>
          )}
          {sesion.series.length > 0 && (
            <Boton tono="fuerte" alto={50} onPress={terminarEjercicio}>
              Terminar ejercicio
            </Boton>
          )}
          <Boton tono="fantasma" alto={46} onPress={goBack}>Volver al menú del día</Boton>
        </View>

        {sesion.series.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[r.etiqueta, { marginBottom: 10 }]}>SERIES DE HOY</Text>
            <View style={{ gap: 6 }}>
              {sesion.series.map((s, i) => {
                const editando = editandoIdx === i;
                return (
                  <View key={i} style={[ss.serieItem, editando && { borderColor: C.sodio }]}>
                    <TouchableOpacity
                      onPress={() => setEditandoIdx(editando ? null : i)}
                      style={ss.serieRow}
                    >
                      <Text style={ss.serieIdx}>{i + 1}</Text>
                      <Text style={ss.serieVal}>
                        {esTiempo ? `${s.segundos}s` : `${fmt(s.peso)} kg × ${s.reps} reps`}
                      </Text>
                      <Text style={[ss.serieEdit, editando && { color: C.sodio }]}>
                        {editando ? "cerrar" : "editar"}
                      </Text>
                    </TouchableOpacity>
                    {editando && !esTiempo && (
                      <View style={ss.editPanel}>
                        <Text style={ss.editLabel}>PESO (KG)</Text>
                        <View style={ss.editRow}>
                          <TouchableOpacity onPress={() => editarSerie(i, "peso", Math.max(0, Math.round((s.peso - ej.incremento) * 100) / 100))} style={ss.editBtn}>
                            <Text style={ss.editBtnTxt}>−{fmt(ej.incremento)}</Text>
                          </TouchableOpacity>
                          <View style={ss.editVal}><Text style={ss.editValTxt}>{fmt(s.peso)}</Text></View>
                          <TouchableOpacity onPress={() => editarSerie(i, "peso", Math.round((s.peso + ej.incremento) * 100) / 100)} style={ss.editBtn}>
                            <Text style={ss.editBtnTxt}>+{fmt(ej.incremento)}</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={[ss.editLabel, { marginTop: 12 }]}>REPS</Text>
                        <View style={ss.editRow}>
                          <TouchableOpacity onPress={() => editarSerie(i, "reps", Math.max(1, s.reps - 1))} style={ss.editBtn}>
                            <Text style={ss.editBtnTxt}>−1</Text>
                          </TouchableOpacity>
                          <View style={ss.editVal}><Text style={ss.editValTxt}>{s.reps}</Text></View>
                          <TouchableOpacity onPress={() => editarSerie(i, "reps", s.reps + 1)} style={ss.editBtn}>
                            <Text style={ss.editBtnTxt}>+1</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    {editando && esTiempo && (
                      <View style={ss.editPanel}>
                        <Text style={ss.editLabel}>SEGUNDOS</Text>
                        <View style={ss.editRow}>
                          <TouchableOpacity onPress={() => editarSerie(i, "segundos", Math.max(5, s.segundos - 5))} style={ss.editBtn}>
                            <Text style={ss.editBtnTxt}>−5</Text>
                          </TouchableOpacity>
                          <View style={ss.editVal}><Text style={ss.editValTxt}>{s.segundos}</Text></View>
                          <TouchableOpacity onPress={() => editarSerie(i, "segundos", s.segundos + 5)} style={ss.editBtn}>
                            <Text style={ss.editBtnTxt}>+5</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.fondo },
  cabecera: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.linea,
  },
  cabeceraIzq: { fontFamily: MONO, fontSize: 13, color: C.gris },
  cabeceraBtn: { fontFamily: MONO, fontSize: 12, color: C.gris, letterSpacing: 1 },
  ejNombre: { fontSize: 30, fontWeight: "700", color: C.hueso, marginTop: 16, lineHeight: 36 },
  ejEtiqueta: { fontFamily: MONO, fontSize: 11, color: C.gris, letterSpacing: 1, marginTop: 4 },
  serieExtra: { color: C.sodio, fontSize: 12, marginTop: 6 },
  historico: {
    marginTop: 8, padding: 12, backgroundColor: C.sup,
    borderWidth: 1, borderColor: C.linea, borderRadius: 4,
  },
  historicoLabel: { fontFamily: MONO, fontSize: 11, color: C.gris, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  historicoSerie: { fontFamily: MONO, fontSize: 14, color: C.hueso, marginBottom: 2 },
  historicoVal: { fontFamily: MONO, fontSize: 15, color: C.hueso, marginTop: 6 },
  pesoCard: {
    marginTop: 28, backgroundColor: C.sup, borderWidth: 1,
    borderColor: C.linea, borderRadius: 4, overflow: "hidden",
  },
  pesoCentro: { paddingVertical: 22, alignItems: "center" },
  pesoNum: { fontFamily: MONO, fontSize: 76, fontWeight: "700", color: C.sodio, lineHeight: 80 },
  pesoRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.linea },
  pesoBtn: { flex: 1, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  pesoBtnTxt: { fontFamily: MONO, fontSize: 18, color: C.gris },
  sugerencia: {
    marginTop: 8, backgroundColor: C.sup, borderWidth: 1,
    borderColor: C.sodio, borderRadius: 4, padding: 10,
  },
  sugerenciaPeso: { fontFamily: MONO, fontSize: 14, color: C.sodio, fontWeight: "700", flex: 1 },
  sugerenciaToca: { fontSize: 11, color: C.gris, flexShrink: 0 },
  sugerenciaMotivo: { fontSize: 12, color: C.gris, marginTop: 3 },
  sugerenciaBase: { fontFamily: MONO, fontSize: 11, color: C.gris, marginTop: 4, opacity: 0.8 },
  sugerenciaOk: { fontSize: 12, color: C.gris, padding: 2, marginTop: 2 },
  numRow: { flexDirection: "row", borderWidth: 1, borderColor: C.linea, borderRadius: 4, overflow: "hidden", marginTop: 8 },
  numBtn: { paddingHorizontal: 20, paddingVertical: 14, justifyContent: "center", alignItems: "center", backgroundColor: C.sup },
  numBtnTxt: { fontFamily: MONO, fontSize: 18, fontWeight: "700", color: C.gris },
  numBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  numVal: { fontFamily: MONO, fontSize: 48, fontWeight: "700", color: C.sodio },
  serieItem: { backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea, borderRadius: 4, overflow: "hidden" },
  serieRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 12, paddingHorizontal: 14,
  },
  serieIdx: { fontFamily: MONO, fontSize: 14, color: C.gris },
  serieVal: { fontFamily: MONO, fontSize: 15, color: C.hueso, flex: 1, textAlign: "center" },
  serieEdit: { fontFamily: MONO, fontSize: 12, color: C.gris },
  editPanel: { borderTopWidth: 1, borderTopColor: C.linea, padding: 14 },
  editLabel: { fontFamily: MONO, fontSize: 11, color: C.gris, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  editRow: { flexDirection: "row", borderWidth: 1, borderColor: C.linea, borderRadius: 4, overflow: "hidden" },
  editBtn: { paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", justifyContent: "center", backgroundColor: C.sup },
  editBtnTxt: { fontFamily: MONO, fontSize: 16, color: C.gris },
  editVal: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  editValTxt: { fontFamily: MONO, fontSize: 26, fontWeight: "700", color: C.sodio },
});
