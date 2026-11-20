import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, SafeAreaView,
} from "react-native";
import { fmt, diasDesdeStr, hoy } from "@gymtracker/core/utils/format";
import { haceCuanto, solapamientosDelDia } from "@gymtracker/core/domain/solapamiento";
import { useApp } from "../context/AppContext";
import { Boton } from "../components/Boton";
import { C, MONO } from "../theme";

function ModalTerminar({ onConfirmar, onPausar, onCancelar }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onCancelar}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onCancelar}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitulo}>¿Terminar la sesión?</Text>
          <Text style={s.sheetDesc}>Lo que ya registraste queda guardado en cualquier caso.</Text>
          <View style={{ gap: 10 }}>
            <Boton tono="fuerte" alto={54} onPress={onConfirmar}>Sí, terminar sesión</Boton>
            <Boton tono="neutro" alto={50} onPress={onPausar}>Salir sin terminar</Boton>
            <Boton tono="fantasma" alto={48} onPress={onCancelar}>Cancelar</Boton>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function DiaMenuScreen({ navigation, route }) {
  const { diaId } = route.params;
  const ctx = useApp();
  const { dias, sesion, iniciarEjercicio, alternarSaltado, pausarSesion, salirSesion, reabrirEjercicio } = ctx;

  const dia = dias.find((d) => d.id === diaId);
  const hechos = sesion?.hechos ?? {};
  const progreso = sesion?.progreso ?? {};
  const saltados = sesion?.saltados ?? {};

  const solapamientos = solapamientosDelDia(dias, dia, hoy());
  const [confirmandoSalir, setConfirmandoSalir] = useState(false);

  const total = dia.ejercicios.filter((e) => !saltados[e.id]).length;
  const doneCount = Object.keys(hechos).length;
  const huboActividad =
    doneCount > 0 ||
    Object.entries(progreso).some(([id, p]) => p.series?.length > 0 && !saltados[id]);

  const intentarSalir = () => {
    if (huboActividad) setConfirmandoSalir(true);
    else {
      salirSesion((resumen) => {
        if (resumen) navigation.replace("Resumen");
        else navigation.navigate("Inicio");
      });
    }
  };

  const confirmarTerminar = () => {
    setConfirmandoSalir(false);
    salirSesion((resumen) => {
      if (resumen) navigation.replace("Resumen");
      else navigation.navigate("Inicio");
    });
  };

  const hacerPausa = () => {
    setConfirmandoSalir(false);
    pausarSesion();
    navigation.navigate("Inicio");
  };

  const tocarEjercicio = (e, idx) => {
    if (hechos[e.id]) {
      reabrirEjercicio(idx);
    } else if (!saltados[e.id]) {
      iniciarEjercicio(idx);
      navigation.navigate("Sesion", { diaId, ejId: e.id });
    }
  };

  const estadoDer = (e) => {
    const hecho = !!hechos[e.id];
    const saltado = !hecho && !!saltados[e.id];
    const parcial = !hecho && !saltado && progreso[e.id]?.series?.length > 0 ? progreso[e.id] : null;
    if (hecho) return { texto: "✓ hecho", color: C.verde };
    if (saltado) return { texto: "saltado", color: C.gris };
    if (parcial) return { texto: `${parcial.series.length}/${e.series}`, color: C.sodio };
    if (e.tipo === "cardio") return { texto: `${e.duracionMin} min`, color: C.gris };
    if (e.tipo === "tiempo") return { texto: `${e.duracionObjetivo}s`, color: C.gris };
    return { texto: `${fmt(e.peso)} kg`, color: C.gris };
  };

  const subtituloEj = (e) => {
    const saltado = !!saltados[e.id];
    const hecho = !!hechos[e.id];
    const parcial = !hecho && !saltado && progreso[e.id]?.series?.length > 0 ? progreso[e.id] : null;
    if (e.tipo === "cardio") return `Cardio${e.distanciaKm ? ` · ${e.distanciaKm} km` : ""}`;
    if (parcial) return `${parcial.series.length} de ${e.series} series hechas`;
    if (e.tipo === "tiempo") return `${e.series} × ${e.duracionObjetivo}s${e.descanso ? ` · ${e.descanso}s` : ""}`;
    return `${e.series} × ${e.repsMax ? `${e.repsMin}–${e.repsMax}` : e.repsObjetivo} reps${e.descanso ? ` · ${e.descanso}s` : ""}`;
  };

  return (
    <SafeAreaView style={s.root}>
      {confirmandoSalir && (
        <ModalTerminar
          onConfirmar={confirmarTerminar}
          onPausar={hacerPausa}
          onCancelar={() => setConfirmandoSalir(false)}
        />
      )}

      {/* Cabecera */}
      <View style={s.cabecera}>
        <Text style={s.cabeceraIzq}>{dia.nombre} · {doneCount}/{total}</Text>
        <TouchableOpacity onPress={intentarSalir} hitSlop={12}>
          <Text style={s.cabeceraBtn}>SALIR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={{ gap: 10 }}>
          {dia.ejercicios.map((e, idx) => {
            const hecho = !!hechos[e.id];
            const saltado = !hecho && !!saltados[e.id];
            const solapado = !hecho && !saltado ? solapamientos[e.id] : null;
            const parcial = !hecho && !saltado && progreso[e.id]?.series?.length > 0;
            const estado = estadoDer(e);
            const ultima = e.historial[e.historial.length - 1];

            const borderColor = hecho ? C.verde : parcial ? C.sodio : solapado ? C.oxido : C.linea;

            return (
              <View key={e.id} style={[s.ejRow, { borderColor, opacity: hecho ? 0.55 : saltado ? 0.4 : 1 }]}>
                <TouchableOpacity
                  style={s.ejBtn}
                  onPress={() => tocarEjercicio(e, idx)}
                  activeOpacity={saltado ? 1 : 0.75}
                >
                  <View style={s.ejEncabezado}>
                    <Text style={[s.ejNombre, saltado && { textDecorationLine: "line-through" }]}>
                      {e.nombre}
                    </Text>
                    <Text style={[s.ejEstado, { color: estado.color }]}>{estado.texto}</Text>
                  </View>
                  <Text style={[s.ejSub, parcial && { color: C.sodio }]}>{subtituloEj(e)}</Text>
                  <Text style={[s.ejUltima, hecho && { color: C.sodio }]}>
                    {hecho ? "tocá para agregar una serie" : ultima ? `última vez: ${diasDesdeStr(ultima.fecha)}` : "todavía no hecho"}
                  </Text>
                  {solapado && (
                    <Text style={s.ejSolapado}>Ya hecho en {solapado.dia} · {haceCuanto(solapado.fecha, hoy())}</Text>
                  )}
                </TouchableOpacity>
                {!hecho && (
                  <TouchableOpacity onPress={() => alternarSaltado(e.id)} style={s.saltarBtn} hitSlop={8}>
                    <Text style={s.saltarTexto}>{saltado ? "↺" : "×"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          <Boton tono="fantasma" alto={54} onPress={intentarSalir}>
            {huboActividad ? "Terminar sesión" : "Volver al inicio"}
          </Boton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.fondo },
  cabecera: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.linea,
  },
  cabeceraIzq: { fontFamily: MONO, fontSize: 13, color: C.gris },
  cabeceraBtn: { fontFamily: MONO, fontSize: 12, color: C.gris, letterSpacing: 1 },
  scroll: { padding: 20, paddingBottom: 60 },
  ejRow: {
    flexDirection: "row", alignItems: "stretch", backgroundColor: C.sup,
    borderWidth: 1, borderRadius: 4, overflow: "hidden",
  },
  ejBtn: { flex: 1, padding: 16 },
  ejEncabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  ejNombre: { fontSize: 17, fontWeight: "600", color: C.hueso, flex: 1 },
  ejEstado: { fontFamily: MONO, fontSize: 13, flexShrink: 0 },
  ejSub: { fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 4 },
  ejUltima: { fontFamily: MONO, fontSize: 11, color: C.gris, marginTop: 3, opacity: 0.75 },
  ejSolapado: { fontFamily: MONO, fontSize: 11, color: C.oxido, marginTop: 4 },
  saltarBtn: { paddingHorizontal: 14, justifyContent: "center" },
  saltarTexto: { fontFamily: MONO, fontSize: 18, color: C.gris },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.sup, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  handle: { width: 36, height: 4, backgroundColor: C.linea, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitulo: { fontSize: 18, fontWeight: "700", color: C.hueso, textAlign: "center", marginBottom: 8 },
  sheetDesc: { fontSize: 14, color: C.gris, textAlign: "center", marginBottom: 22, lineHeight: 20 },
});
