import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { Boton } from "../components/Boton";
import { C, MONO } from "../theme";

function Campo({ label, value, onChange, decimal }) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={f.input}
        value={String(value ?? "")}
        onChangeText={onChange}
        keyboardType={decimal ? "decimal-pad" : "number-pad"}
        selectTextOnFocus
      />
    </View>
  );
}
const f = StyleSheet.create({
  wrap: { flex: 1 },
  label: { fontFamily: MONO, fontSize: 10, color: C.gris, letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 4, padding: 12, fontFamily: MONO, fontSize: 18,
    color: C.hueso, textAlign: "center",
  },
});

function ModalEjercicio({ ej, onGuardar, onCerrar }) {
  const esFuerza = ej.tipo !== "cardio" && ej.tipo !== "tiempo";
  const esTiempo = ej.tipo === "tiempo";

  const [peso, setPeso] = useState(String(ej.peso ?? ""));
  const [series, setSeries] = useState(String(ej.series ?? ""));
  const [repsMin, setRepsMin] = useState(String(ej.repsMin ?? ""));
  const [repsMax, setRepsMax] = useState(String(ej.repsMax ?? ""));
  const [descanso, setDescanso] = useState(String(ej.descanso ?? ""));
  const [incremento, setIncremento] = useState(String(ej.incremento ?? ""));
  const [duracion, setDuracion] = useState(String(ej.duracionObjetivo ?? ej.duracionMin ?? ""));

  const guardar = () => {
    const cambios = { series: parseInt(series) || ej.series };
    if (esFuerza) {
      cambios.peso = parseFloat(peso) || ej.peso;
      cambios.repsMin = parseInt(repsMin) || ej.repsMin;
      cambios.repsMax = parseInt(repsMax) || ej.repsMax;
      cambios.repsObjetivo = parseInt(repsMin) || ej.repsMin;
      cambios.incremento = parseFloat(incremento) || ej.incremento;
      cambios.descanso = parseInt(descanso) || ej.descanso;
    }
    if (esTiempo) {
      cambios.duracionObjetivo = parseInt(duracion) || ej.duracionObjetivo;
      cambios.descanso = parseInt(descanso) || ej.descanso;
    }
    onGuardar(ej.id, cambios);
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={onCerrar}>
          <TouchableOpacity activeOpacity={1} style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.nombre}>{ej.nombre}</Text>

            {esFuerza && (
              <>
                <View style={m.fila}>
                  <Campo label="PESO (KG)" value={peso} onChange={setPeso} decimal />
                  <Campo label="SERIES" value={series} onChange={setSeries} />
                </View>
                <View style={[m.fila, { marginTop: 12 }]}>
                  <Campo label="REPS MÍN" value={repsMin} onChange={setRepsMin} />
                  <Campo label="REPS MÁX" value={repsMax} onChange={setRepsMax} />
                </View>
                <View style={[m.fila, { marginTop: 12 }]}>
                  <Campo label="DESCANSO (S)" value={descanso} onChange={setDescanso} />
                  <Campo label="INCREMENTO" value={incremento} onChange={setIncremento} decimal />
                </View>
              </>
            )}

            {esTiempo && (
              <View style={m.fila}>
                <Campo label="DURACIÓN (S)" value={duracion} onChange={setDuracion} />
                <Campo label="SERIES" value={series} onChange={setSeries} />
              </View>
            )}

            {ej.tipo === "cardio" && (
              <Text style={m.cardioNote}>El cardio se registra con duración y distancia en cada sesión.</Text>
            )}

            <View style={{ marginTop: 20, gap: 10 }}>
              <Boton tono="fuerte" alto={52} onPress={guardar}>Guardar</Boton>
              <Boton tono="fantasma" alto={44} onPress={onCerrar}>Cancelar</Boton>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#1a1710", borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, paddingBottom: 40,
  },
  handle: { width: 36, height: 4, backgroundColor: C.linea, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  nombre: { fontSize: 18, fontWeight: "700", color: C.hueso, marginBottom: 20 },
  fila: { flexDirection: "row", gap: 12 },
  cardioNote: { fontSize: 13, color: C.gris, lineHeight: 20 },
});

export function AjustesScreen({ navigation }) {
  const { dias, actualizarEjercicio } = useApp();
  const [ejEditando, setEjEditando] = useState(null);

  const guardarEjercicio = (ejId, cambios) => {
    actualizarEjercicio(ejId, cambios);
    setEjEditando(null);
  };

  return (
    <SafeAreaView style={s.root}>
      {ejEditando && (
        <ModalEjercicio
          ej={ejEditando}
          onGuardar={guardarEjercicio}
          onCerrar={() => setEjEditando(null)}
        />
      )}
      <View style={s.cabecera}>
        <Text style={s.cabeceraIzq}>Ajustes</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={s.cabeceraBtn}>VOLVER</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.hint}>Tocá un ejercicio para editar peso, series o reps.</Text>
        {dias.map((dia) => (
          <View key={dia.id} style={{ marginTop: 20 }}>
            <Text style={s.diaNombre}>{dia.nombre}</Text>
            <View style={{ gap: 6, marginTop: 8 }}>
              {dia.ejercicios.map((ej) => (
                <TouchableOpacity
                  key={ej.id}
                  onPress={() => setEjEditando(ej)}
                  style={s.ejCard}
                  activeOpacity={0.8}
                >
                  <Text style={s.ejNombre} numberOfLines={1}>{ej.nombre}</Text>
                  <Text style={s.ejSpec}>
                    {ej.tipo === "cardio"
                      ? `${ej.duracionMin} min`
                      : ej.tipo === "tiempo"
                      ? `${ej.series} × ${ej.duracionObjetivo}s`
                      : `${ej.series} × ${ej.peso} kg`}
                  </Text>
                </TouchableOpacity>
              ))}
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
  hint: { fontSize: 13, color: C.gris, lineHeight: 20, marginBottom: 4 },
  diaNombre: { fontFamily: MONO, fontSize: 11, color: C.gris, letterSpacing: 1, textTransform: "uppercase" },
  ejCard: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 4, padding: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  ejNombre: { fontSize: 15, fontWeight: "600", color: C.hueso, flex: 1 },
  ejSpec: { fontFamily: MONO, fontSize: 13, color: C.sodio, flexShrink: 0 },
});
