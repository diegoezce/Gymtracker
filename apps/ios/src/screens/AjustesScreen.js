import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Keyboard,
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

function ModalEditarEjercicio({ ej, onGuardar, onEliminar, onCerrar }) {
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

  const confirmarEliminar = () => {
    Alert.alert("Eliminar ejercicio", `¿Eliminar "${ej.nombre}"? Se perderá el historial.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => onEliminar(ej.id) },
    ]);
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
              <Boton tono="fantasma" alto={44} onPress={confirmarEliminar}>Eliminar ejercicio</Boton>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ModalAgregarEjercicio({ diaId, onGuardar, onCerrar }) {
  const [tipo, setTipo] = useState("fuerza");
  const [nombre, setNombre] = useState("");
  const [peso, setPeso] = useState("20");
  const [series, setSeries] = useState("3");
  const [repsMin, setRepsMin] = useState("8");
  const [repsMax, setRepsMax] = useState("10");
  const [descanso, setDescanso] = useState("90");
  const [incremento, setIncremento] = useState("2.5");
  const [duracion, setDuracion] = useState("30");

  const guardar = () => {
    if (!nombre.trim()) return;
    onGuardar(diaId, tipo, {
      nombre: nombre.trim(),
      peso: parseFloat(peso) || 20,
      series: parseInt(series) || 3,
      repsMin: parseInt(repsMin) || 8,
      repsMax: parseInt(repsMax) || 10,
      descanso: parseInt(descanso) || 90,
      incremento: parseFloat(incremento) || 2.5,
      duracionObjetivo: parseInt(duracion) || 30,
      duracionMin: parseInt(duracion) || 30,
    });
  };

  const TIPOS = [
    { v: "fuerza", l: "Fuerza" },
    { v: "tiempo", l: "Tiempo" },
    { v: "cardio", l: "Cardio" },
  ];

  return (
    <Modal transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onCerrar(); }}>
          <TouchableOpacity activeOpacity={1} style={[m.sheet, { maxHeight: "90%" }]}>
            <View style={m.handle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={m.nombre}>Nuevo ejercicio</Text>

              <Text style={f.label}>NOMBRE</Text>
              <TextInput
                style={[f.input, { textAlign: "left", marginBottom: 16 }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Press banca"
                placeholderTextColor={C.gris}
                autoFocus
              />

              <Text style={[f.label, { marginBottom: 8 }]}>TIPO</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {TIPOS.map((t) => (
                  <TouchableOpacity
                    key={t.v}
                    onPress={() => setTipo(t.v)}
                    style={[m.tipoBtn, tipo === t.v && m.tipoBtnActivo]}
                  >
                    <Text style={[m.tipoBtnTxt, tipo === t.v && { color: "#14120F" }]}>{t.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {tipo === "fuerza" && (
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

              {tipo === "tiempo" && (
                <View style={m.fila}>
                  <Campo label="DURACIÓN (S)" value={duracion} onChange={setDuracion} />
                  <Campo label="SERIES" value={series} onChange={setSeries} />
                </View>
              )}

              {tipo === "cardio" && (
                <Campo label="DURACIÓN MÍN" value={duracion} onChange={setDuracion} />
              )}

              <View style={{ marginTop: 20, gap: 10, paddingBottom: 20 }}>
                <Boton tono="fuerte" alto={52} onPress={guardar}>Agregar</Boton>
                <Boton tono="fantasma" alto={44} onPress={onCerrar}>Cancelar</Boton>
              </View>
            </ScrollView>
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
  tipoBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 4,
    borderWidth: 1, borderColor: C.linea, alignItems: "center",
  },
  tipoBtnActivo: { backgroundColor: C.sodio, borderColor: C.sodio },
  tipoBtnTxt: { fontFamily: MONO, fontSize: 13, color: C.hueso },
});

export function AjustesScreen({ navigation }) {
  const { dias, actualizarEjercicio, agregarEjercicioADia, eliminarEjercicioDeApp } = useApp();
  const [ejEditando, setEjEditando] = useState(null);
  const [diaAgregando, setDiaAgregando] = useState(null);

  const guardarEjercicio = (ejId, cambios) => {
    actualizarEjercicio(ejId, cambios);
    setEjEditando(null);
  };

  const eliminarEjercicio = (ejId) => {
    const dia = dias.find((d) => d.ejercicios.some((e) => e.id === ejId));
    if (dia) eliminarEjercicioDeApp(dia.id, ejId);
    setEjEditando(null);
  };

  return (
    <SafeAreaView style={s.root}>
      {ejEditando && (
        <ModalEditarEjercicio
          ej={ejEditando}
          onGuardar={guardarEjercicio}
          onEliminar={eliminarEjercicio}
          onCerrar={() => setEjEditando(null)}
        />
      )}
      {diaAgregando && (
        <ModalAgregarEjercicio
          diaId={diaAgregando}
          onGuardar={(diaId, tipo, campos) => {
            agregarEjercicioADia(diaId, tipo, campos);
            setDiaAgregando(null);
          }}
          onCerrar={() => setDiaAgregando(null)}
        />
      )}
      <View style={s.cabecera}>
        <Text style={s.cabeceraIzq}>Ajustes</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={s.cabeceraBtn}>VOLVER</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {dias.map((dia) => (
          <View key={dia.id} style={{ marginTop: 20 }}>
            <View style={s.diaHead}>
              <Text style={s.diaNombre}>{dia.nombre}</Text>
              <TouchableOpacity onPress={() => setDiaAgregando(dia.id)} hitSlop={12}>
                <Text style={s.agregarBtn}>+ Agregar</Text>
              </TouchableOpacity>
            </View>
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
  diaHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  diaNombre: { fontFamily: MONO, fontSize: 11, color: C.gris, letterSpacing: 1, textTransform: "uppercase" },
  agregarBtn: { fontFamily: MONO, fontSize: 12, color: C.sodio },
  ejCard: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 4, padding: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  ejNombre: { fontSize: 15, fontWeight: "600", color: C.hueso, flex: 1 },
  ejSpec: { fontFamily: MONO, fontSize: 13, color: C.sodio, flexShrink: 0 },
});
