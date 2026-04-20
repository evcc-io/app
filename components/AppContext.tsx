import AsyncStorage from "@react-native-async-storage/async-storage";
import { migrateFromLegacySingleConnectionStorage } from "helper/launchArguments";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import { BasicAuth, Connection } from "types";
import {
  addOrUpdateConnection,
  deleteConnection,
  loadConnections,
  StorageKeys,
} from "utils/storage";

// Create a context
const AppContext = createContext({
  serverUrl: "",
  basicAuth: { required: false } as BasicAuth,
  isLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateConnection: async (_connection: Connection) => {},
  removeConnection: async (_index: number) => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [serverUrl, setServerUrl] = useState("");
  const [basicAuth, setBasicAuth] = useState({ required: false });
  const [isLoading, setIsLoading] = useState(true);

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    (async () => {
      // needed for e2e migration test
      if (migrateFromLegacySingleConnectionStorage()) {
        await AsyncStorage.multiSet([
          [StorageKeys.SERVER_URL, "http://localhost:7080"],
          [
            StorageKeys.BASIC_AUTH,
            JSON.stringify({
              username: "admin",
              password: "secret",
              required: true,
            } satisfies BasicAuth),
          ],
        ]);
      }

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

  const updateConnection = async (connection: Connection) => {
    setServerUrl(connection.url);
    setBasicAuth(connection.basicAuth);
    await addOrUpdateConnection(0, connection);
  };

  const removeConnection = async (index: number) => {
    setServerUrl("");
    setBasicAuth({ required: false });
    await deleteConnection(index);
  };

  return (
    <AppContext.Provider
      value={{
        serverUrl,
        basicAuth,
        isLoading,
        updateConnection,
        removeConnection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
