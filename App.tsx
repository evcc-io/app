import React from "react";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as eva from "@eva-design/eva";
import { ApplicationProvider } from "@ui-kitten/components";
import { useColorScheme } from "react-native";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import mapping from "./style.json";

import OnboardingScreen from "./screens/OnboardingScreen";
import AddServerScreen from "./screens/AddServerScreen";
import MainScreen from "./screens/MainScreen";
import { AppProvider, useAppContext } from "./components/AppContext";
import custom from "./themes.json";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { decode, encode } from "base-64";
import translations from "./i18n";
import { SwitchServerStackParamList, RootStackParamList } from "types";
import { SCHEME } from "utils/constants";
import SwitchServerScreen from "screens/SwitchServerScreen";
import EditServerScreen from "screens/EditServerScreen";
import { KeyboardProvider } from "react-native-keyboard-controller";

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackParamList>();
const SwitchServerStackNav =
  createNativeStackNavigator<SwitchServerStackParamList>();

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

function SwitchServerStack() {
  return (
    <SwitchServerStackNav.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <SwitchServerStackNav.Screen
        name="SwitchServer"
        component={SwitchServerScreen}
      />
      <SwitchServerStackNav.Screen
        name="EditServer"
        component={EditServerScreen}
      />
      <SwitchServerStackNav.Screen
        name="AddServer"
        component={AddServerScreen}
      />
    </SwitchServerStackNav.Navigator>
  );
}

function AppNavigator() {
  const { activeServer, isLoading, servers } = useAppContext();

  // Show splash/loading while determining initial route
  if (isLoading) {
    return null;
  }

  const sheetOpts = {
    animation: "slide_from_bottom" as const,
    presentation: "modal" as const,
  };

  console.log("activeServer", activeServer);
  console.log("servers", servers);

  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: [SCHEME + "://"],
    config: {
      screens:
        servers.length > 0
          ? {
              SwitchServerModal: {
                initialRouteName: "SwitchServer",
                screens: { AddServer: "server" },
              },
            }
          : { AddServer: "server" },
    },
  };

  return (
    <KeyboardProvider>
      <NavigationContainer onReady={hideSplash} linking={linking}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {servers.length > 0 ? (
            <>
              <Stack.Screen name="Main" component={MainScreen} />
              <Stack.Screen
                name="SwitchServerModal"
                component={SwitchServerStack}
                options={sheetOpts}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen
                name="AddServer"
                component={AddServerScreen}
                options={sheetOpts}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </KeyboardProvider>
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
