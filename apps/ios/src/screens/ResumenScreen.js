import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { fmt, fechaCorta } from "@gymtracker/core/utils/format";
import { useApp } from "../context/AppContext";
import { Boton } from "../components/Boton";
import { C, MONO } from "../theme";

function Tarjeta({ valor, label }) {
  return (
    <View style={s.tarjeta}>
      <Text style={s.tarjetaVal}>{valor}</Text>
      <Text style={s.tarjetaLabel}>{label}</Text>
    </View>
  );
}

function detalleEjercicio(e) {
  if (e.tipo === "cardio") return `${e.duracion} min${e.distancia != null ? ` · ${Number(e.distancia).toFixed(1)} km` : ""}`;
  if (e.tipo === "tiempo") return e.series.map((s) => `${s.segundos}s`).join("  ");
  return e.series.map((s) => `${fmt(s.peso)}×${s.reps}`).join("  ");
}

export function ResumenScreen({ navigation }) {
  const { resumen, setResumen } = useApp();

  const volver = () => {
    setResumen(null);
    navigation.navigate("Inicio");
  };

  if (!resumen) { volver(); return null; }

  const { totales, ejercicios, logros, fecha } = resumen;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.titulo}>Sesión terminada</Text>
        <Text style={s.fecha}>{fechaCorta(fecha)}</Text>

        <View style={s.grilla}>
          <Tarjeta valor={totales.ejercicios} label="Ejercicios" />
          <Tarjeta valor={totales.series} label="Series" />
          <Tarjeta valor={Math.round(totales.volumen).toLocaleString("es-AR")} label="Kg totales" />
        </View>

        {totales.minutosCardio > 0 && (
          <Text style={s.cardioText}>Cardio: {totales.minutosCardio} min</Text>
        )}

        <Text style={s.seccion}>AVANCES DE HOY</Text>
        {logros.length > 0 ? (
          <View style={{ gap: 8, marginTop: 10 }}>
            {logros.map((l, i) => (
              <View key={i} style={s.logro}>
                <Text style={s.logroTexto}>
                  {l.texto}
                  {l.detalle ? <Text style={{ color: C.gris, fontWeight: "400" }}> · {l.detalle}</Text> : null}
                </Text>
                <Text style={s.logroEjercicio}>{l.ejercicio}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.sinLogros}>Sin récords hoy — sostener la carga también es progreso.</Text>
        )}

        <Text style={s.seccion}>LO QUE HICISTE</Text>
        <View style={{ gap: 0, marginTop: 10 }}>
          {ejercicios.map((e) => (
            <View key={e.id} style={s.ejItem}>
              <View style={s.ejRow}>
                <Text style={s.ejNombre}>{e.nombre}</Text>
                {e.volumen > 0 && (
                  <Text style={s.ejVolumen}>{Math.round(e.volumen).toLocaleString("es-AR")} kg</Text>
                )}
              </View>
              <Text style={s.ejDetalle}>{detalleEjercicio(e)}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 32 }}>
          <Boton tono="fuerte" alto={54} onPress={volver}>Listo</Boton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.fondo },
  scroll: { padding: 20, paddingBottom: 60 },
  titulo: { fontSize: 26, fontWeight: "700", color: C.hueso, marginTop: 16 },
  fecha: { fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 2 },
  grilla: { flexDirection: "row", gap: 8, marginTop: 20 },
  tarjeta: {
    flex: 1, backgroundColor: C.sup, borderWidth: 1, borderColor: C.linea,
    borderRadius: 4, padding: 14, alignItems: "center",
  },
  tarjetaVal: { fontFamily: MONO, fontSize: 26, fontWeight: "700", color: C.sodio, lineHeight: 30 },
  tarjetaLabel: { fontSize: 11, color: C.gris, marginTop: 5 },
  cardioText: { fontSize: 13, color: C.gris, marginTop: 10, textAlign: "center" },
  seccion: { fontFamily: MONO, fontSize: 11, color: C.gris, letterSpacing: 1, marginTop: 28, marginBottom: 0 },
  logro: {
    backgroundColor: C.sup, borderWidth: 1, borderColor: C.sodio,
    borderRadius: 4, padding: 10,
  },
  logroTexto: { fontFamily: MONO, fontSize: 14, fontWeight: "700", color: C.sodio },
  logroEjercicio: { fontSize: 12, color: C.gris, marginTop: 3 },
  sinLogros: { fontSize: 14, color: C.gris, marginTop: 8, lineHeight: 22 },
  ejItem: { borderTopWidth: 1, borderTopColor: C.linea, paddingTop: 10, paddingBottom: 10 },
  ejRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  ejNombre: { fontSize: 15, fontWeight: "600", color: C.hueso, flex: 1 },
  ejVolumen: { fontFamily: MONO, fontSize: 11, color: C.gris, flexShrink: 0 },
  ejDetalle: { fontFamily: MONO, fontSize: 13, color: C.gris, marginTop: 3 },
});
