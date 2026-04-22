import AsyncStorage from "@react-native-async-storage/async-storage";
import { testLegacyServerConfig } from "helper/launchArguments";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import { BasicAuth, Server } from "types";
import {
  addOrUpdateServer,
  deleteServers,
  loadServers,
  StorageKeys,
} from "utils/storage";

// Create a context
const AppContext = createContext({
  activeServer: undefined as Server | undefined,
  isLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateServer: async (_server: Server) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeServer: async (_index: number) => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [activeServer, setActiveServer] = useState<Server | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    (async () => {
      // needed for e2e migration test
      if (testLegacyServerConfig()) {
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

      const servers = await loadServers();
      if (servers.length == 1) {
        setActiveServer(servers[0]);
      }
      setIsLoading(false);
    })();
  }, []);

  const updateServer = async (server: Server) => {
    setActiveServer(server);
    await addOrUpdateServer(0, server);
  };

  const removeServer = async (index: number) => {
    setActiveServer(undefined);
    await deleteServers(index);
  };

  return (
    <AppContext.Provider
      value={{
        activeServer,
        isLoading,
        updateServer,
        removeServer: removeServer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
