import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create a context
const AppContext = createContext({
  serverUrl: "",
  updateServerUrl: async (url: string) => {
    url;
    return;
  },
});

// Provider component
export const AppProvider = ({ children }) => {
  const [serverUrl, setServerUrl] = useState("unknown");

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    const loadServerUrl = async () => {
      const url = await AsyncStorage.getItem("serverUrl");
      setServerUrl(url || "");
    };

    loadServerUrl();
  }, []);

  const updateServerUrl = async (url) => {
    setServerUrl(url);
    await AsyncStorage.setItem("serverUrl", url);
  };

  return (
    <AppContext.Provider value={{ serverUrl, updateServerUrl }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
