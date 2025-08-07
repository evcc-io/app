import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BasicAuth } from "../interfaces/basicAuth";

// Create a context
const AppContext = createContext({
  serverUrl: "",
  basicAuth: { required: false } as BasicAuth,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateServerUrl: async (_url: string, _basicAuth: BasicAuth) => {},
});

// Provider component
export const AppProvider = ({ children }) => {
  const [serverUrl, setServerUrl] = useState("unknown");
  const [basicAuth, setBasicAuth] = useState({ required: false });

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    const loadServerUrl = async () => {
      const url = await AsyncStorage.getItem("serverUrl");
      setServerUrl(url || "");

      const basicAuthJson = await AsyncStorage.getItem("basicAuth");
      if (basicAuthJson) {
        setBasicAuth(JSON.parse(basicAuthJson));
      } else {
        setBasicAuth({ required: false });
      }
    };

    loadServerUrl();
  }, []);

  const updateServerUrl = async (url, basicAuth: BasicAuth) => {
    setBasicAuth(basicAuth);
    await AsyncStorage.setItem("basicAuth", JSON.stringify(basicAuth));
    setServerUrl(url);
    await AsyncStorage.setItem("serverUrl", url);
  };

  return (
    <AppContext.Provider value={{ serverUrl, basicAuth, updateServerUrl }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
