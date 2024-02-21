import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as eva from "@eva-design/eva";
import { ApplicationProvider } from "@ui-kitten/components";
import { Appearance } from "react-native";

import WelcomeScreen from "./screens/WelcomeScreen";
import ServerScreen from "./screens/ServerScreen";
import ServerManualScreen from "./screens/ServerManualScreen";
import MainScreen from "./screens/MainScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { AppProvider, useAppContext } from "./components/AppContext";
import { ThemeContext } from "./components/ThemeContext";
import custom from "./themes.json";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { serverUrl, updateServerUrl } = useAppContext();

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
                //headerTitle: "Settings",
                animation: "slide_from_bottom",
                presentation: "modal",
                //headerShown: true,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
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
  const mapping = {
    strict: {
      "text-font-family": "Montserrat-Bold",
      "border-radius": 8,
    },
    components: {
      Button: {
        appearances: {
          outline: {
            variantGroups: {
              status: {
                primary: {
                  backgroundColor: "none",
                  state: {
                    hover: { backgroundColor: "none" },
                    active: { backgroundColor: "none" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return (
    <AppProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <ApplicationProvider
          {...eva}
          theme={mergedTheme}
          customMapping={mapping}
        >
          <AppNavigator />
        </ApplicationProvider>
      </ThemeContext.Provider>
    </AppProvider>
  );
}
