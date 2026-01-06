import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BasicAuth, ProxyHeader } from "types";

// Create a context
const AppContext = createContext({
  serverUrl: "",
  basicAuth: { required: false } as BasicAuth,
  proxyHeader: { required: false } as ProxyHeader,
  isLoading: true,
  updateServerUrl: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _url: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _basicAuth: BasicAuth,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _proxyHeader: ProxyHeader,
  ) => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [serverUrl, setServerUrl] = useState("");
  const [basicAuth, setBasicAuth] = useState({ required: false });
  const [proxyHeader, setProxyHeader] = useState({ required: false });
  const [isLoading, setIsLoading] = useState(true);

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

      const proxyHeaderJson = await AsyncStorage.getItem("proxyHeader");
      if (proxyHeaderJson) {
        setProxyHeader(JSON.parse(proxyHeaderJson));
      } else {
        setProxyHeader({ required: false });
      }

      setIsLoading(false);
    };

    loadServerUrl();
  }, []);

  const updateServerUrl = async (
    url: string,
    basicAuth: BasicAuth,
    proxyHeader: ProxyHeader,
  ) => {
    setProxyHeader(proxyHeader);
    await AsyncStorage.setItem("proxyHeader", JSON.stringify(proxyHeader));
    setBasicAuth(basicAuth);
    await AsyncStorage.setItem("basicAuth", JSON.stringify(basicAuth));
    setServerUrl(url);
    await AsyncStorage.setItem("serverUrl", url);
  };

  return (
    <AppContext.Provider
      value={{ serverUrl, basicAuth, proxyHeader, isLoading, updateServerUrl }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
