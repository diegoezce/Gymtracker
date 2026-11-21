import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Share, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fmt, fechaCorta, diasDesdeStr } from "@gymtracker/core/utils/format";
import { contarSesiones } from "@gymtracker/core/domain/inicio";
import { useApp } from "../context/AppContext";
import { C, MONO } from "../theme";

function HistorialEjercicio({ ej, onCerrar }) {
  const entradas = [...(ej.historial ?? [])].reverse().slice(0, 10);
  return (
    <View style={d.wrap}>
      <TouchableOpacity onPress={onCerrar} style={d.cerrar}>
        <Text style={d.cerrarTxt}>← Volver</Text>
      </TouchableOpacity>
      <Text style={d.ejNombre}>{ej.nombre}</Text>

      {entradas.length === 0 ? (
        <Text style={d.sinDatos}>Sin registros todavía.</Text>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {entradas.map((e, i) => (
            <View key={i} style={d.entrada}>
              <View style={d.entradaHead}>
                <Text style={d.entradaFecha}>{e.fecha}</Text>
                <Text style={d.entradaDias}>{diasDesdeStr(e.fecha)}</Text>
              </View>
              {e.duracion != null ? (
                <Text style={d.entradaSerie}>
                  {e.duracion} min{e.distancia != null ? ` · ${Number(e.distancia).toFixed(1)} km` : ""}
                </Text>
              ) : (
                (e.series ?? []).map((s, j) => (
                  <Text key={j} style={d.entradaSerie}>
                    <Text style={{ color: C.gris }}>{j + 1}  </Text>
                    {s.segundos != null
                      ? `${s.segundos}s`
                      : `${fmt(s.peso)} kg × ${s.reps} reps${s.rir === 0 ? " · fallo" : ""}`}
                  </Text>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function ProgresoScreen({ navigation }) {
  const { dias } = useApp();
  const [ejSeleccionado, setEjSeleccionado] = useState(null);
  const { estaSemana, esteMes } = contarSesiones(dias);

  const exportarDatos = async () => {
    try {
      const json = JSON.stringify({ version: 1, exportado: new Date().toISOString(), dias }, null, 2);
      await Share.share({ message: json, title: "IronWorks - mis datos" });
    } catch {
      Alert.alert("Error", "No se pudo exportar los datos.");
    }
  };

  if (ejSeleccionado) {
    return (
      <SafeAreaView style={s.root}>
        <HistorialEjercicio ej={ejSeleccionado} onCerrar={() => setEjSeleccionado(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.cabecera}>
        <Text style={s.cabeceraIzq}>Progreso</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={s.cabeceraBtn}>VOLVER</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {esteMes > 0 && (
          <Text style={s.stats}>{estaSemana} sesiones esta semana · {esteMes} este mes</Text>
        )}

        <TouchableOpacity onPress={exportarDatos} style={s.exportBtn} activeOpacity={0.8}>
          <Text style={s.exportTxt}>Exportar mis datos</Text>
        </TouchableOpacity>

        {dias.map((dia) => (
          <View key={dia.id} style={{ marginTop: 20 }}>
            <Text style={s.diaNombre}>{dia.nombre}</Text>
            <View style={{ gap: 6, marginTop: 8 }}>
              {dia.ejercicios.map((ej) => {
                const ultima = ej.historial?.length
                  ? ej.historial[ej.historial.length - 1]
                  : null;
                return (
                  <TouchableOpacity
                    key={ej.id}
                    onPress={() => setEjSeleccionado(ej)}
                    style={s.ejCard}
                    activeOpacity={0.8}
                  >
                    <View style={s.ejRow}>
                      <Text style={s.ejNombre} numberOfLines={1}>{ej.nombre}</Text>
                      <Text style={s.ejPeso}>
                        {ej.tipo === "cardio"
                          ? `${ej.duracionMin}min`
                          : ej.tipo === "tiempo"
                          ? `${ej.duracionObjetivo}s`
                          : `${fmt(ej.peso)} kg`}
                      </Text>
                    </View>
                    <Text style={s.ejUltima}>
                      {ultima ? `Última: ${fechaCorta(ultima.fecha)} · ${diasDesdeStr(ultima.fecha)}` : "Sin registros"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
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
  cabeceraIzq: { fontSize: 18, fontWeight: "700", color: C.hueso },
  cabeceraBtn: { fontFamily: MONO, fontSize: 12, color: C.gris, letterSpacing: 1 },
  scroll: { padding: 20, paddingBottom: 60 },
  stats: { fontFamily: MONO, fontSize: 12, color: C.gris, marginBottom: 4 },
  diaNombre: { fontFamily: MONO, fontSize: 11, color: C.gris, letterSpacing: 1, textTransform: "uppercase" },
  ejCard: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 4, padding: 14,
  },
  ejRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  ejNombre: { fontSize: 16, fontWeight: "600", color: C.hueso, flex: 1 },
  ejPeso: { fontFamily: MONO, fontSize: 14, color: C.sodio, flexShrink: 0 },
  ejUltima: { fontFamily: MONO, fontSize: 11, color: C.gris, marginTop: 4 },
  exportBtn: {
    borderWidth: 1, borderColor: C.linea, borderRadius: 4,
    paddingVertical: 14, alignItems: "center", marginBottom: 24,
  },
  exportTxt: { fontFamily: MONO, fontSize: 13, color: C.gris, letterSpacing: 0.5 },
});

const d = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  cerrar: { paddingBottom: 16 },
  cerrarTxt: { color: C.sodio, fontSize: 15 },
  ejNombre: { fontSize: 24, fontWeight: "700", color: C.hueso, marginBottom: 20 },
  sinDatos: { color: C.gris, fontSize: 14 },
  entrada: {
    borderTopWidth: 1, borderTopColor: C.linea,
    paddingTop: 12, paddingBottom: 12,
  },
  entradaHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  entradaFecha: { fontFamily: MONO, fontSize: 12, color: C.gris, textTransform: "uppercase", letterSpacing: 0.8 },
  entradaDias: { fontFamily: MONO, fontSize: 11, color: C.gris },
  entradaSerie: { fontFamily: MONO, fontSize: 14, color: C.hueso, marginBottom: 2 },
});
