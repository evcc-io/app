import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BasicAuthInformation } from "../interfaces/basic-auth-information";

// Create a context
const AppContext = createContext({
  serverUrl: "",
  basicAuthInformation: { basicAuthRequired: false } as BasicAuthInformation,
  updateServerUrl: async (
    url: string,
    basicAuthInformation: BasicAuthInformation,
  ) => {
    url;
    return;
  },
});

// Provider component
export const AppProvider = ({ children }) => {
  const [serverUrl, setServerUrl] = useState("unknown");
  const [basicAuthInformation, setBasicAuthInformation] = useState({
    basicAuthRequired: false,
  } as BasicAuthInformation);

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    const loadServerUrl = async () => {
      const url = await AsyncStorage.getItem("serverUrl");
      setServerUrl(url || "");

      const basicAuthJson = await AsyncStorage.getItem("basicAuthInformation");
      if (basicAuthJson) {
        setBasicAuthInformation(JSON.parse(basicAuthJson));
      } else {
        setBasicAuthInformation({
          basicAuthRequired: false,
        } as BasicAuthInformation);
      }
    };

    loadServerUrl();
  }, []);

  const updateServerUrl = async (
    url,
    basicAuthInformation: BasicAuthInformation,
  ) => {
    setBasicAuthInformation(basicAuthInformation);
    await AsyncStorage.setItem(
      "basicAuthInformation",
      JSON.stringify(basicAuthInformation),
    );
    setServerUrl(url);
    await AsyncStorage.setItem("serverUrl", url);
  };

  return (
    <AppContext.Provider
      value={{ serverUrl, basicAuthInformation, updateServerUrl }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
