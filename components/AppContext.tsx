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
  activeConnection: undefined as Connection | undefined,
  isLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateConnection: async (_connection: Connection) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeConnection: async (_index: number) => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
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

      const connections = await loadConnections();
      if (connections.length == 1) {
        setActiveConnection(connections[0]);
      }
      setIsLoading(false);
    })();
  }, []);

  const updateConnection = async (connection: Connection) => {
    setActiveConnection(connection);
    await addOrUpdateConnection(0, connection);
  };

  const removeConnection = async (index: number) => {
    setActiveConnection(undefined);
    await deleteConnection(index);
  };

  return (
    <AppContext.Provider
      value={{
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
