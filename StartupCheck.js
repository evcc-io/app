import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function CheckForSavedURL() {
  const navigation = useNavigation();

  const checkForSavedURL = async () => {
    const url = await AsyncStorage.getItem("serverURL");
    if (url) {
      //navigation.navigate("WebView", { url });
    }
  };

  useEffect(() => {
    checkForSavedURL();
  }, []);

  return null;
}

export default CheckForSavedURL;
