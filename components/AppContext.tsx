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
import { sameServer } from "utils/server";
import {
  storeActiveServer,
  addServer as storageAddServer,
  updateServer as storageUpdateServer,
  removeServer as storageRemoveServer,
  loadServers,
  StorageKeys,
  loadActiveServer,
} from "utils/storage";

// Create a context
const AppContext = createContext({
  activeServer: undefined as Server | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setActiveServer: async (_server?: Server) => {},
  servers: [] as Server[],
  isLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addServer: async (_server: Server) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateServer: async (_server: Server, _index: number) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeServer: async (_index: number) => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [activeServer, setActiveServerState] = useState<Server | undefined>();
  const [servers, setServers] = useState<Server[]>([]);
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

      await setActiveServer(await loadActiveServer());
      setServers(await loadServers());
      setIsLoading(false);
    })();
  }, []);

  const setActiveServer = async (server?: Server) => {
    setActiveServerState(server);
    await storeActiveServer(server);
  };

  const addServer = async (server: Server) => {
    await storageAddServer(server);
    setServers(await loadServers());
  };

  const updateServer = async (server: Server, index: number) => {
    await storageUpdateServer(server, index);
    setServers(await loadServers());
  };

  const removeServer = async (index: number) => {
    const removedServer = await storageRemoveServer(index);
    const servers = await loadServers();
    setServers(servers);

    if (sameServer(activeServer, removedServer)) {
      await setActiveServer(undefined);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeServer,
        setActiveServer,
        servers,
        isLoading,
        addServer,
        updateServer,
        removeServer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
