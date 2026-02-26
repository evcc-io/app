import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as eva from "@eva-design/eva";
import { ApplicationProvider, IconRegistry } from "@ui-kitten/components";
import { useColorScheme } from "react-native";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import mapping from "./style.json";

import ServerScreen from "./screens/ServerScreen";
import ServerManualScreen from "./screens/ServerManualScreen";
import MainScreen from "./screens/MainScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { AppProvider, useAppContext } from "./components/AppContext";
import custom from "./themes.json";
import { useFonts } from "expo-font";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import * as SplashScreen from "expo-splash-screen";
import { decode, encode } from "base-64";
import translations from "./i18n";
import { RootStackParamList } from "types";
import { SCHEME } from "utils/constants";

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackParamList>();

i18n.use(initReactI18next).init({
  resources: translations,
  lng: getLocales()[0].languageCode ?? undefined,
  fallbackLng: "en",
});

const hideSplash = () => {
  setTimeout(async () => {
    await SplashScreen.hideAsync();
  }, 500);
};

function AppNavigator() {
  const { serverUrl, isLoading } = useAppContext();

  // Show splash/loading while determining initial route
  if (isLoading) {
    return null;
  }

  const sheetOpts = {
    animation: "slide_from_bottom" as const,
    presentation: "modal" as const,
  };

  return (
    <NavigationContainer
      onReady={hideSplash}
      linking={{
        prefixes: [SCHEME + "://"],
        config: {
          screens: {
            ServerManual: {
              path: "server",
              parse: {
                url: String,
                username: String,
                password: String,
              },
            },
          },
        },
      }}
    >
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
              options={sheetOpts}
            />
            <Stack.Screen
              name="ServerManual"
              component={ServerManualScreen}
              options={sheetOpts}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Server" component={ServerScreen} />
            <Stack.Screen
              name="ServerManual"
              component={ServerManualScreen}
              options={sheetOpts}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const theme: "light" | "dark" = colorScheme === "dark" ? "dark" : "light";
  const [fontsLoaded] = useFonts({
    "Montserrat-Bold": require("./assets/fonts/Montserrat-Bold.ttf"),
    "Montserrat-Medium": require("./assets/fonts/Montserrat-Medium.ttf"),
  });

  const mergedTheme = { ...eva[theme], ...custom[theme] };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <AppProvider>
        <ApplicationProvider
            {...eva}
            theme={mergedTheme}
            customMapping={{ ...eva.mapping, ...mapping }}
          >
            <AppNavigator />
          </ApplicationProvider>
      </AppProvider>
      <StatusBar style="auto" />
    </>
  );
}
