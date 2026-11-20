import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Dimensions,
} from "react-native";
import { RUTINA_INICIAL } from "@gymtracker/core/domain/rutina";
import { fmt } from "@gymtracker/core/utils/format";
import { useApp } from "../context/AppContext";
import { Boton } from "../components/Boton";
import { C, MONO } from "../theme";

const { width: SW } = Dimensions.get("window");

const FEATURES = [
  {
    icono: "↑",
    titulo: "Progresión automática",
    desc: "El app sube el peso cuando completás todas las reps, y lo baja si fallás dos veces seguido.",
  },
  {
    icono: "○",
    titulo: "Timer de descanso",
    desc: "Al terminar cada serie arranca el timer. Te avisa con vibración cuando es hora de la siguiente.",
  },
  {
    icono: "◎",
    titulo: "Sin cuenta, sin internet",
    desc: "Todo se guarda en tu iPhone. No hace falta registrarse ni estar conectado.",
  },
];

function PasoUno({ onSiguiente }) {
  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.logoWrap}>
          <Text style={s.logoMarca}>GYM</Text>
          <Text style={s.logoTracke}>TRACKER</Text>
        </View>
        <Text style={s.tagline}>Tu rutina.{"\n"}Sin complicaciones.</Text>

        <View style={s.features}>
          {FEATURES.map((f) => (
            <View key={f.titulo} style={s.featureRow}>
              <View style={s.featureIcono}>
                <Text style={s.featureIconoTxt}>{f.icono}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitulo}>{f.titulo}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 40 }}>
          <Boton tono="fuerte" alto={60} onPress={onSiguiente}>Ver mi rutina →</Boton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PasoDos({ onEmpezar }) {
  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: 32 }]}>
        <Text style={s.rutinaTitle}>Tu rutina de arranque</Text>
        <Text style={s.rutinaDesc}>
          Esta es la rutina por defecto. Podés editar cualquier ejercicio —
          peso, reps, series — desde los ajustes.
        </Text>

        {RUTINA_INICIAL.map((dia) => (
          <View key={dia.id} style={s.diaCard}>
            <Text style={s.diaNombre}>{dia.nombre}</Text>
            <View style={{ gap: 6, marginTop: 8 }}>
              {dia.ejercicios.map((e) => (
                <View key={e.id} style={s.ejRow}>
                  <Text style={s.ejNombre} numberOfLines={1}>{e.nombre}</Text>
                  <Text style={s.ejSpec}>
                    {e.tipo === "cardio"
                      ? `${e.duracionMin} min`
                      : e.tipo === "tiempo"
                      ? `${e.series} × ${e.duracionObjetivo}s`
                      : `${e.series} × ${e.repsMin}${e.repsMax ? `–${e.repsMax}` : ""} · ${fmt(e.peso)} kg`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={{ marginTop: 32, gap: 12 }}>
          <Boton tono="fuerte" alto={60} onPress={onEmpezar}>Empezar a entrenar</Boton>
          <Text style={s.nota}>Podés personalizar la rutina en cualquier momento desde Ajustes.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function OnboardingScreen({ navigation }) {
  const [paso, setPaso] = useState(0);
  const { completarOnboarding } = useApp();

  const empezar = () => {
    completarOnboarding();
    navigation.replace("Inicio");
  };

  if (paso === 0) return <PasoUno onSiguiente={() => setPaso(1)} />;
  return (
    <View style={{ flex: 1 }}>
      <PasoDos onEmpezar={empezar} />
      <TouchableOpacity onPress={() => setPaso(0)} style={s.atras} hitSlop={12}>
        <Text style={s.atrasTxt}>← Atrás</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.fondo },
  scroll: { padding: 24, paddingBottom: 48 },

  logoWrap: { marginTop: 24, marginBottom: 4 },
  logoMarca: { fontFamily: MONO, fontSize: 44, fontWeight: "700", color: C.sodio, letterSpacing: 4, lineHeight: 50 },
  logoTracke: { fontFamily: MONO, fontSize: 44, fontWeight: "700", color: C.hueso, letterSpacing: 4, lineHeight: 50 },
  tagline: { fontSize: 32, fontWeight: "700", color: C.hueso, marginTop: 20, lineHeight: 40 },

  features: { marginTop: 40, gap: 24 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  featureIcono: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.sodio,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  featureIconoTxt: { fontFamily: MONO, fontSize: 18, color: C.sodio },
  featureTitulo: { fontSize: 16, fontWeight: "700", color: C.hueso, marginBottom: 4 },
  featureDesc: { fontSize: 14, color: C.gris, lineHeight: 20 },

  rutinaTitle: { fontSize: 26, fontWeight: "700", color: C.hueso, marginBottom: 8 },
  rutinaDesc: { fontSize: 14, color: C.gris, lineHeight: 21, marginBottom: 24 },

  diaCard: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 6, padding: 16, marginBottom: 12,
  },
  diaNombre: { fontFamily: MONO, fontSize: 11, color: C.sodio, letterSpacing: 1, textTransform: "uppercase" },
  ejRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", gap: 10,
    paddingVertical: 5, borderTopWidth: 1, borderTopColor: C.linea,
  },
  ejNombre: { fontSize: 15, color: C.hueso, flex: 1 },
  ejSpec: { fontFamily: MONO, fontSize: 12, color: C.gris, flexShrink: 0 },

  nota: { fontSize: 12, color: C.gris, textAlign: "center", lineHeight: 18 },

  atras: { position: "absolute", top: 56, left: 24 },
  atrasTxt: { fontFamily: MONO, fontSize: 13, color: C.gris },
});
