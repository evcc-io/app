import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  testLegacyServerConfig,
  testIndexedServerConfig,
} from "helper/launchArguments";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  PropsWithChildren,
} from "react";
import * as Linking from "expo-linking";
import { BasicAuth, SavedServer, Server } from "types";
import { sameServer } from "utils/server";
import { syncWidgetServers } from "utils/widgetSync";
import {
  loadServerConfig,
  storeServerConfig,
  type ServerConfig,
} from "utils/storage";

// Create a context
const AppContext = createContext({
  activeServer: undefined as SavedServer | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setActiveServer: async (_server: SavedServer) => {},
  servers: [] as SavedServer[],
  isLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addServer: async (_server: Server) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateServer: async (_server: Server, _id: string) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeServer: async (_id: string) => {},
  // webview path a deep link wants to open (e.g. "/forecast"); MainScreen consumes it
  targetPath: undefined as string | undefined,
  clearTargetPath: () => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const current = useRef<ServerConfig>({ servers: [] });
  const persisted = useRef(current.current);
  const pendingWrite = useRef(Promise.resolve());
  const [{ activeServer, servers }, setConfig] = useState(current.current);
  const [isLoading, setIsLoading] = useState(true);
  const [targetPath, setTargetPath] = useState<string>();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    (async () => {
      if (testLegacyServerConfig()) {
        // Seed the keys written by the original single-server app.
        await AsyncStorage.setMany({
          serverUrl: "http://localhost:7080",
          basicAuth: JSON.stringify({
            username: "admin",
            password: "secret",
            required: true,
          } satisfies BasicAuth),
        });
      }

      if (
        testIndexedServerConfig() &&
        (await AsyncStorage.getItem("servers")) === null
      ) {
        const servers = [7081, 7070, 7080].map((port) => ({
          url: `http://localhost:${port}/`,
          basicAuth: {},
        }));
        await AsyncStorage.setItem("servers", JSON.stringify(servers));
      }

      const config = await loadServerConfig();
      persisted.current = config;
      current.current = config;
      setConfig(config);
      setIsLoading(false);
    })();
  }, []);

  // Mirror saved servers for the native widgets after migration.
  useEffect(() => {
    if (!isLoading) syncWidgetServers(servers, activeServer);
  }, [servers, activeServer, isLoading]);

  // Capture incoming deep links (cold start + while running).
  useEffect(() => {
    Linking.getInitialURL().then((url) => url && setPendingUrl(url));
    const sub = Linking.addEventListener("url", ({ url }) =>
      setPendingUrl(url),
    );
    return () => sub.remove();
  }, []);

  // Process a widget deep link once servers are loaded: switch to the matching
  // server and ask MainScreen to open the target page.
  useEffect(() => {
    if (!pendingUrl || isLoading) return;
    const { hostname, queryParams } = Linking.parse(pendingUrl);
    if (hostname === "forecast" || hostname === "loadpoint") {
      const id = queryParams?.["serverId"];
      const index = queryParams?.["server"];
      const match =
        id !== undefined
          ? servers.find((server) => server.id === id)
          : typeof index === "string"
            ? servers[Number(index)]
            : undefined;
      if (id !== undefined && !match) {
        // A widget can outlive its pinned server.
        setPendingUrl(null);
        return;
      }
      if (match && match.id !== activeServer?.id) setActiveServer(match);
      if (hostname === "loadpoint") {
        const lp = queryParams?.["lp"];
        setTargetPath(typeof lp === "string" ? `/?lp=${lp}` : "/");
      } else {
        setTargetPath("/forecast");
      }
    }
    setPendingUrl(null);
  }, [pendingUrl, isLoading, servers, activeServer]);

  const saveConfig = (config: ServerConfig) => {
    // Update synchronously so rapid taps and incoming links see the latest list.
    if (current.current.activeServer?.id !== config.activeServer?.id) {
      setTargetPath(undefined);
    }
    current.current = config;
    setConfig(config);
    const write = pendingWrite.current.then(async () => {
      await storeServerConfig(config);
      persisted.current = config;
    });
    pendingWrite.current = write.catch(() => {
      if (current.current === config) {
        setTargetPath(undefined);
        current.current = persisted.current;
        setConfig(persisted.current);
      }
    });
    return write;
  };

  const setActiveServer = async (server: SavedServer) => {
    const { servers } = current.current;
    const activeServer = servers.find((entry) => entry.id === server.id);
    if (activeServer) await saveConfig({ servers, activeServer });
  };

  const addServer = async (server: Server) => {
    const { servers } = current.current;
    const existing = servers.find((entry) => sameServer(entry, server));
    if (existing) {
      await setActiveServer(existing);
      return;
    }
    const saved = { ...server, id: globalThis.expo.uuidv4() };
    await saveConfig({ servers: [...servers, saved], activeServer: saved });
  };

  const updateServer = async (server: Server, id: string) => {
    const { servers, activeServer } = current.current;
    if (!servers.some((entry) => entry.id === id)) return;
    const updated = { ...server, id };
    await saveConfig({
      servers: servers.map((entry) => (entry.id === id ? updated : entry)),
      activeServer: activeServer?.id === id ? updated : activeServer,
    });
  };

  const removeServer = async (id: string) => {
    const { servers, activeServer } = current.current;
    const remaining = servers.filter((entry) => entry.id !== id);
    await saveConfig({
      servers: remaining,
      activeServer: activeServer?.id === id ? remaining[0] : activeServer,
    });
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
