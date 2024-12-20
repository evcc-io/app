import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as eva from "@eva-design/eva";
import { ApplicationProvider, IconRegistry } from "@ui-kitten/components";
import { Appearance } from "react-native";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import mapping from "./style.json";

import ServerScreen from "./screens/ServerScreen";
import ServerManualScreen from "./screens/ServerManualScreen";
import MainScreen from "./screens/MainScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { AppProvider, useAppContext } from "./components/AppContext";
import { ThemeContext } from "./components/ThemeContext";
import custom from "./themes.json";
import { useFonts } from "expo-font";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import * as SplashScreen from "expo-splash-screen";
import { decode, encode } from "base-64";
import translations from './i18n';

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

i18n.use(initReactI18next).init({
  resources: translations,
  lng: getLocales()[0].languageCode,
  fallbackLng: "en",
});
console.log(getLocales());

function AppNavigator() {
  const { serverUrl } = useAppContext();

  //updateServerUrl("");

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {serverUrl ? (
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                animation: "slide_from_bottom",
                presentation: "modal",
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Server" component={ServerScreen} />
            <Stack.Screen
              name="ServerManual"
              component={ServerManualScreen}
              options={{
                animation: "slide_from_bottom",
                presentation: "modal",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const colorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = React.useState(colorScheme);
  const [fontsLoaded] = useFonts({
    "Montserrat-Bold": require("./assets/fonts/Montserrat-Bold.ttf"),
    "Montserrat-Medium": require("./assets/fonts/Montserrat-Medium.ttf"),
  });

  // hide splash screen after 750ms
  useEffect(() => {
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 750);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const mergedTheme = { ...eva[theme], ...custom[theme] };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <AppProvider>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <ApplicationProvider
            {...eva}
            theme={mergedTheme}
            customMapping={{ ...eva.mapping, ...mapping }}
          >
            <AppNavigator />
          </ApplicationProvider>
        </ThemeContext.Provider>
      </AppProvider>
      <StatusBar
        style={theme === "dark" ? "light" : "dark"}
        backgroundColor={theme === "dark" ? "#010322" : "#f3f3f7"}
        translucent={false}
      />
    </>
  );
}
