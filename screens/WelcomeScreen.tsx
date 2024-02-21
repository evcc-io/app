import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
} from "react-native";

export default function WelcomeScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const style = colorScheme === "light" ? light : dark;

  return (
    <View style={style.container}>
      <Text style={style.text}>Welcome to evcc {colorScheme}</Text>
      <Pressable
        style={style.button}
        onPress={() => navigation.navigate("Server")}
      >
        <Text style={style.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const baseStyles = {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontFamily: "Montserrat-Bold",
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0ba631",
  },
  buttonText: {
    fontFamily: "Montserrat-Bold",
    color: "white",
  },
};

const dark = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: "#1c2445",
  },
  text: {
    ...baseStyles.text,
    color: "white",
  },
});

const light = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: "#F3F3F7",
  },
  text: {
    ...baseStyles.text,
    color: "#28293e",
  },
});
