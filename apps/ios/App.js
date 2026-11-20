import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "./src/context/AppContext";
import { InicioScreen } from "./src/screens/InicioScreen";
import { DiaMenuScreen } from "./src/screens/DiaMenuScreen";
import { SesionScreen } from "./src/screens/SesionScreen";
import { ProgresoScreen } from "./src/screens/ProgresoScreen";
import { ResumenScreen } from "./src/screens/ResumenScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
          <Stack.Screen name="Inicio" component={InicioScreen} />
          <Stack.Screen name="DiaMenu" component={DiaMenuScreen} />
          <Stack.Screen name="Sesion" component={SesionScreen} />
          <Stack.Screen name="Progreso" component={ProgresoScreen} />
          <Stack.Screen name="Resumen" component={ResumenScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
