import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { C } from "../theme";

const tonos = {
  neutro: { bg: C.sup2, fg: C.hueso, bd: C.linea },
  fuerte: { bg: C.sodio, fg: "#14120F", bd: C.sodio },
  fantasma: { bg: "transparent", fg: C.gris, bd: C.linea },
};

export function Boton({ children, onPress, tono = "neutro", alto = 54, disabled = false }) {
  const t = tonos[tono] ?? tonos.neutro;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        { backgroundColor: t.bg, borderColor: t.bd, minHeight: alto },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={[styles.texto, { color: t.fg }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  texto: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
