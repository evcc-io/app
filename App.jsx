import React from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import WelcomeScreen from "./screens/WelcomeScreen";
import UrlInputScreen from "./screens/UrlInputScreen";
import WebViewScreen from "./screens/WebViewScreen";
import StartupCheck from "./StartupCheck";
import { StatusBar } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MainScreen from "./screens/MainScreen";
import SessionsScreen from "./screens/SessionsScreen";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="auto" />
      <NavigationContainer>
        <StartupCheck />
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Main" component={MainScreen} />
          <Tab.Screen
            name="Sessions"
            component={SessionsScreen}
            options={{
              tabBarLabel: "Home",
              tabBarIcon: (
                <Ionicons name="stats-chart" size={24} color="black" />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
