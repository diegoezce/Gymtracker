import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sugerirDia, ultimaVezDia, contarSesiones, descripcionDia } from "@gymtracker/core/domain/inicio";
import { diasDesdeStr } from "@gymtracker/core/utils/format";
import { useApp } from "../context/AppContext";
import { Boton } from "../components/Boton";
import { C, MONO } from "../theme";

function ModalDescartar({ nombrePausado, nombreNuevo, onConfirmar, onCancelar }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onCancelar}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onCancelar}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitulo}>¿Descartar la sesión en pausa?</Text>
          <Text style={s.sheetDesc}>
            Tenés "{nombrePausado}" en pausa. Si empezás "{nombreNuevo}" ahora, se descarta lo que quedó sin guardar ahí.
          </Text>
          <View style={{ gap: 10 }}>
            <Boton tono="fuerte" alto={54} onPress={onConfirmar}>Descartar y empezar</Boton>
            <Boton tono="fantasma" alto={48} onPress={onCancelar}>Cancelar</Boton>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function InicioScreen({ navigation }) {
  const ctx = useApp();
  const { dias, sesion, sesionPausada, aviso, comenzar, reanudarSesion, descartarYEmpezar } = ctx;
  const [descartando, setDescartando] = useState(null);

  if (ctx.cargando) {
    return (
      <SafeAreaView style={s.root}>
        <Text style={{ color: C.gris, fontFamily: MONO, fontSize: 13, padding: 40 }}>Cargando…</Text>
      </SafeAreaView>
    );
  }

  const diaPausado = sesionPausada && sesion ? dias.find((d) => d.id === sesion.diaId) : null;
  const sugerido = diaPausado ?? sugerirDia(dias);
  const otros = dias.filter((d) => d.id !== sugerido?.id);
  const { estaSemana, esteMes } = contarSesiones(dias);

  const tocarDia = (d) => {
    if (diaPausado && d.id === diaPausado.id) {
      reanudarSesion();
      navigation.navigate("DiaMenu", { diaId: d.id });
      return;
    }
    if (diaPausado) {
      setDescartando(d);
      return;
    }
    comenzar(d);
    navigation.navigate("DiaMenu", { diaId: d.id });
  };

  const subtitulo = (d) => {
    const ultima = ultimaVezDia(dias, d);
    const n = d.ejercicios.length;
    return `${n} ejercicio${n !== 1 ? "s" : ""} · ${ultima ? diasDesdeStr(ultima) : "sin registros"}`;
  };

  return (
    <SafeAreaView style={s.root}>
      {descartando && (
        <ModalDescartar
          nombrePausado={diaPausado?.nombre}
          nombreNuevo={descartando.nombre}
          onConfirmar={() => {
            descartarYEmpezar(descartando);
            setDescartando(null);
            navigation.navigate("DiaMenu", { diaId: descartando.id });
          }}
          onCancelar={() => setDescartando(null)}
        />
      )}
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.etiqueta}>REGISTRO</Text>
        <Text style={s.titulo}>¿Qué toca hoy?</Text>
        {esteMes > 0 && (
          <Text style={s.stats}>{estaSemana} esta semana · {esteMes} este mes</Text>
        )}

        {aviso ? <View style={s.aviso}><Text style={s.avisoTexto}>{aviso}</Text></View> : null}

        {sugerido && (
          <TouchableOpacity onPress={() => tocarDia(sugerido)} activeOpacity={0.8} style={s.cardPrincipal}>
            <Text style={[s.etiqueta, { color: C.sodio }]}>
              {diaPausado ? "SESIÓN EN PAUSA" : "TE TOCA"}
            </Text>
            <Text style={s.cardNombre}>{sugerido.nombre}</Text>
            {!diaPausado && descripcionDia(sugerido) ? (
              <Text style={s.cardDesc} numberOfLines={1}>{descripcionDia(sugerido)}</Text>
            ) : null}
            <Text style={s.cardSub}>
              {diaPausado ? "Tocá para seguir donde quedaste" : subtitulo(sugerido)}
            </Text>
            <View style={s.btnPrincipal}>
              <Text style={s.btnPrincipalTexto}>{diaPausado ? "Retomar" : "Empezar"}</Text>
            </View>
          </TouchableOpacity>
        )}

        {otros.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.etiqueta}>OTROS DÍAS</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {otros.map((d) => (
                <TouchableOpacity key={d.id} onPress={() => tocarDia(d)} activeOpacity={0.8} style={s.cardOtro}>
                  <View style={s.cardOtroRow}>
                    <Text style={s.cardOtroNombre}>{d.nombre}</Text>
                    <Text style={s.cardOtroSub} numberOfLines={1}>{subtitulo(d)}</Text>
                  </View>
                  {descripcionDia(d) ? (
                    <Text style={s.cardDesc} numberOfLines={1}>{descripcionDia(d)}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ marginTop: 28, gap: 10, flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <Boton tono="fantasma" alto={54} onPress={() => navigation.navigate("Progreso")}>Progreso</Boton>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.fondo },
  scroll: { padding: 20, paddingBottom: 60 },
  etiqueta: { fontFamily: MONO, fontSize: 11, color: C.gris, letterSpacing: 1, textTransform: "uppercase" },
  titulo: { fontSize: 34, fontWeight: "700", color: C.hueso, marginTop: 6, letterSpacing: -0.5 },
  stats: { fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 2 },
  aviso: {
    marginTop: 20, padding: 14, backgroundColor: C.sup,
    borderLeftWidth: 3, borderLeftColor: C.sodio, borderRadius: 2,
  },
  avisoTexto: { color: C.hueso, fontSize: 15, lineHeight: 22 },
  cardPrincipal: {
    marginTop: 22, backgroundColor: C.sup, borderWidth: 1,
    borderColor: C.sodio, borderRadius: 6, padding: 18,
  },
  cardNombre: { fontSize: 26, fontWeight: "700", color: C.hueso, marginTop: 6 },
  cardDesc: { fontSize: 13, color: C.hueso, opacity: 0.75, marginTop: 4 },
  cardSub: { fontFamily: MONO, fontSize: 12, color: C.gris, marginTop: 3 },
  btnPrincipal: {
    marginTop: 14, backgroundColor: C.sodio, borderRadius: 4,
    paddingVertical: 12, alignItems: "center",
  },
  btnPrincipalTexto: { fontSize: 15, fontWeight: "700", color: "#14120F" },
  cardOtro: {
    backgroundColor: C.sup, borderWidth: 1,
    borderColor: C.linea, borderRadius: 4, padding: 14,
  },
  cardOtroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  cardOtroNombre: { fontSize: 16, fontWeight: "600", color: C.hueso, flex: 1 },
  cardOtroSub: { fontFamily: MONO, fontSize: 11, color: C.gris, flexShrink: 0 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.sup, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  handle: { width: 36, height: 4, backgroundColor: C.linea, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitulo: { fontSize: 18, fontWeight: "700", color: C.hueso, textAlign: "center", marginBottom: 8 },
  sheetDesc: { fontSize: 14, color: C.gris, textAlign: "center", marginBottom: 22, lineHeight: 20 },
});
