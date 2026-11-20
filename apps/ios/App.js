import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "./src/context/AppContext";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { InicioScreen } from "./src/screens/InicioScreen";
import { DiaMenuScreen } from "./src/screens/DiaMenuScreen";
import { SesionScreen } from "./src/screens/SesionScreen";
import { ProgresoScreen } from "./src/screens/ProgresoScreen";
import { ResumenScreen } from "./src/screens/ResumenScreen";
import { View, ActivityIndicator } from "react-native";
import { C } from "./src/theme";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { cargando, onboardingDone } = useApp();

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: C.fondo, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.sodio} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={onboardingDone ? "Inicio" : "Onboarding"}
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Inicio" component={InicioScreen} />
      <Stack.Screen name="DiaMenu" component={DiaMenuScreen} />
      <Stack.Screen name="Sesion" component={SesionScreen} />
      <Stack.Screen name="Progreso" component={ProgresoScreen} />
      <Stack.Screen name="Resumen" component={ResumenScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
