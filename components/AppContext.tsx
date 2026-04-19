import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import { BasicAuth, Connection } from "types";
import { addOrUpdateConnection, loadConnections } from "utils/storage";

// Create a context
const AppContext = createContext({
  serverUrl: "",
  basicAuth: { required: false } as BasicAuth,
  isLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateServerUrl: async (_connection: Connection) => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [serverUrl, setServerUrl] = useState("");
  const [basicAuth, setBasicAuth] = useState({ required: false });
  const [isLoading, setIsLoading] = useState(true);

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    (async () => {
      const connection = await loadConnections();
      if (connection.length == 1) {
        setServerUrl(connection[0].url);
        setBasicAuth(connection[0].basicAuth);
      } else {
        setServerUrl("");
        setBasicAuth({ required: false });
      }
      setIsLoading(false);
    })();
  }, []);

  const updateServerUrl = async (connection: Connection) => {
    setServerUrl(connection.url);
    setBasicAuth(connection.basicAuth);
    await addOrUpdateConnection(0, connection);
  };

  return (
    <AppContext.Provider
      value={{ serverUrl, basicAuth, isLoading, updateServerUrl }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
