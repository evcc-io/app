import React from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import WelcomeScreen from "./screens/WelcomeScreen";
import UrlInputScreen from "./screens/UrlInputScreen";
import WebViewScreen from "./screens/WebViewScreen";
import StartupCheck from "./StartupCheck";

const Stack = createStackNavigator();

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StartupCheck />
        <Stack.Navigator>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="URLInput" component={UrlInputScreen} />
          <Stack.Screen
            name="WebView"
            component={WebViewScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
