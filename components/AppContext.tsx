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
  storedConnections: [] as Connection[],
  activeConnection: undefined as Connection | undefined,
  isLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateConnection: async (_connection: Connection) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeConnection: async (_index: number) => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [storedConnections, setStoredConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<
    Connection | undefined
  >();
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
    setStoredConnections(await loadConnections());
  };

  const removeConnection = async (index: number) => {
    setServerUrl("");
    setBasicAuth({ required: false });
    await deleteConnection(index);
    setStoredConnections(await loadConnections());
  };

  return (
    <AppContext.Provider
      value={{
        storedConnections,
        activeConnection,
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
