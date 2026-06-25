import AsyncStorage from "@react-native-async-storage/async-storage";
import { testLegacyServerConfig } from "helper/launchArguments";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import * as Linking from "expo-linking";
import { BasicAuth, Server } from "types";
import { sameServer } from "utils/server";
import { syncWidgetServers } from "utils/widgetSync";
import {
  storeActiveServer,
  addServer as storageAddServer,
  updateServer as storageUpdateServer,
  removeServer as storageRemoveServer,
  loadServers,
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
  // webview path a deep link wants to open (e.g. "/forecast"); MainScreen consumes it
  targetPath: undefined as string | undefined,
  clearTargetPath: () => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [activeServer, setActiveServerState] = useState<Server | undefined>();
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetPath, setTargetPath] = useState<string>();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    (async () => {
      // needed for e2e migration test
      if (testLegacyServerConfig()) {
        // seed the literal keys the pre-multi-server app wrote, so the
        // migration test guards the real key names rather than the enum
        await AsyncStorage.setMany({
          serverUrl: "http://localhost:7080",
          basicAuth: JSON.stringify({
            username: "admin",
            password: "secret",
            required: true,
          } satisfies BasicAuth),
        });
      }

      const loadedServers = await loadServers();
      let active = await loadActiveServer();
      if (!active && loadedServers.length > 0) {
        active = loadedServers[0];
      }
      await setActiveServer(active);
      setServers(loadedServers);
      setIsLoading(false);
    })();
  }, []);

  // Keep the iOS widget's shared App Group in sync with the server list.
  useEffect(() => {
    if (!isLoading) syncWidgetServers(servers, activeServer);
  }, [servers, activeServer, isLoading]);

  // Capture incoming deep links (cold start + while running).
  useEffect(() => {
    Linking.getInitialURL().then((url) => url && setPendingUrl(url));
    const sub = Linking.addEventListener("url", ({ url }) => setPendingUrl(url));
    return () => sub.remove();
  }, []);

  // Process a widget deep link once servers are loaded: switch to the matching
  // server and ask MainScreen to open the target page.
  // `evcc://forecast?server=<id>` or `evcc://loadpoint?server=<id>&lp=<n>`.
  useEffect(() => {
    if (!pendingUrl || isLoading) return;
    const { hostname, queryParams } = Linking.parse(pendingUrl);
    if (hostname === "forecast" || hostname === "loadpoint") {
      const id = queryParams?.["server"];
      if (typeof id === "string") {
        const match = servers[Number(id)];
        if (match && !sameServer(match, activeServer)) setActiveServer(match);
      }
      if (hostname === "loadpoint") {
        const lp = queryParams?.["lp"];
        const lpNum = typeof lp === "string" && /^\d+$/.test(lp) ? lp : "1";
        setTargetPath(`/?lp=${lpNum}`);
      } else {
        setTargetPath("/forecast");
      }
    }
    setPendingUrl(null);
  }, [pendingUrl, isLoading, servers, activeServer]);

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
    const remaining = await loadServers();
    setServers(remaining);

    if (sameServer(activeServer, removedServer)) {
      await setActiveServer(remaining.length > 0 ? remaining[0] : undefined);
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
        targetPath,
        clearTargetPath: () => setTargetPath(undefined),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
