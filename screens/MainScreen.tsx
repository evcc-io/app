import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import {
  StyleSheet,
  Animated,
  View,
  Text,
  Platform,
  BackHandler,
  AppState,
} from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { addNetworkStateListener } from "expo-network";
import AppText from "components/AppText";
import TextLink from "components/TextLink";
import { ConnectionProblem, probeServer, retryDelay } from "utils/server";
import { useThemeColors } from "utils/theme";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { USER_AGENT } from "../utils/constants";
import {
  ShouldStartLoadRequest,
  WebViewNavigation,
  WebViewOpenWindowEvent,
} from "react-native-webview/lib/WebViewTypes";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "types";
import CookieManager from "@preeternal/react-native-cookie-manager";
import { encode } from "base-64";
import { shareFileFromUrl } from "utils/shareFile";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { isIosAppOnMac } from "modules/ios-app-on-mac";
import Spinner from "components/Spinner";
import { testingEnvironment } from "helper/launchArguments";

// env(safe-area-inset-*) reads as 0 inside the WebView, so insets are pushed in as CSS variables
const safeAreaJs = (i: EdgeInsets) => `
  document.documentElement.style.setProperty("--safe-area-inset-top", "${i.top}px");
  document.documentElement.style.setProperty("--safe-area-inset-bottom", "${i.bottom}px");
  document.documentElement.style.setProperty("--safe-area-inset-left", "${i.left}px");
  document.documentElement.style.setProperty("--safe-area-inset-right", "${i.right}px");
  document.documentElement.classList.toggle("safe-area-side", ${i.left > 0 || i.right > 0});
  true;`;

export default function MainScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Main">) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { activeServer, targetPath, clearTargetPath } = useAppContext();
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  // the spinner would otherwise animate behind the web UI all session
  const [overlayHidden, setOverlayHidden] = useState(false);
  // 0 = not mounted; the WebView only loads once the server answered a probe
  const [webViewKey, setWebViewKey] = useState(0);
  const [problem, setProblem] = useState<ConnectionProblem>();
  const [probing, setProbing] = useState(false);
  const checkingRef = useRef(false);
  const connectedRef = useRef(false);
  const attemptRef = useRef(0);
  const generationRef = useRef(0);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loadRef = useRef({
    mounted: false,
    loading: false,
    endedAt: 0,
  });
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);

  const contFade = useRef(new Animated.Value(isConnected ? 1 : 0)).current;
  const loadFade = useRef(new Animated.Value(isConnected ? 0 : 1)).current;
  const loadScale = useRef(new Animated.Value(isConnected ? 1.2 : 1)).current;

  const openSettings = useCallback(() => {
    navigation.navigate("SwitchServerModal");
  }, [navigation]);

  const { required, username, password } = activeServer?.basicAuth || {};
  const basicAuthCredential = useMemo(
    () =>
      required && username && password ? { username, password } : undefined,
    [required, username, password],
  );

  // injectedJavaScript only runs on load; re-push insets on rotation
  useEffect(() => {
    webViewRef.current?.injectJavaScript(safeAreaJs(insets));
  }, [insets]);

  // Tell the web UI to navigate to a deep-linked path (e.g. "/forecast") once
  // it's connected. The web UI handles the actual routing (added separately).
  useEffect(() => {
    if (targetPath && isConnected && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: "navigate", path: targetPath }),
      );
      clearTargetPath();
    }
  }, [targetPath, isConnected, clearTargetPath]);

  // Android back button navigates the web UI's history instead of leaving the app
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (navigation.isFocused() && canGoBackRef.current) {
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [navigation]);

  // Probes the server while disconnected and (re)loads the web UI once it
  // answers. Reschedules itself with backoff until the web UI reports online.
  const check = useCallback(async () => {
    if (!activeServer?.url || checkingRef.current) return;
    clearTimeout(checkTimerRef.current);
    const generation = generationRef.current;
    checkingRef.current = true;
    setProbing(true);
    let result = await probeServer(activeServer);
    if (generation !== generationRef.current) return; // server switched meanwhile
    checkingRef.current = false;
    setProbing(false);
    if (connectedRef.current) return;

    const attempt = attemptRef.current++;
    const load = loadRef.current;
    if (result) {
      // unmounting also stops the web UI's own reconnect attempts
      load.mounted = false;
      setWebViewKey(0);
    } else if (!load.mounted) {
      load.mounted = true;
      load.loading = true;
      setWebViewKey((k) => k + 1);
    } else if (!load.loading && Date.now() - load.endedAt > 5000) {
      // page loaded, but its websocket didn't connect
      result = { type: "websocket" };
      load.loading = true;
      setWebViewKey((k) => k + 1);
    }
    setProblem(result);

    clearTimeout(checkTimerRef.current);
    const delay = retryDelay(result, attempt);
    if (delay !== undefined) checkTimerRef.current = setTimeout(check, delay);
  }, [activeServer]);

  const retry = useCallback(() => {
    attemptRef.current = 0;
    check();
  }, [check]);

  // Switching servers starts disconnected; the WebView mounts once the server answers
  useEffect(() => {
    generationRef.current++;
    checkingRef.current = false;
    connectedRef.current = false;
    attemptRef.current = 0;
    loadRef.current.mounted = false;
    setIsConnected(false);
    setProblem(undefined);
    setWebViewKey(0);
    check();
    return () => clearTimeout(checkTimerRef.current);
  }, [check]);

  const setOnline = useCallback(() => {
    clearTimeout(checkTimerRef.current);
    connectedRef.current = true;
    attemptRef.current = 0;
    setIsConnected(true);
    setProblem(undefined);
  }, []);

  const setOffline = useCallback(() => {
    setIsConnected(false);
    if (!connectedRef.current) return; // check loop already running
    connectedRef.current = false;
    // the web UI retries brief drops itself, give it a moment
    checkTimerRef.current = setTimeout(check, 5000);
  }, [check]);

  // A new network (back online, WiFi <-> mobile) may reach the server, try
  // right away. Only on actual changes, so a chatty listener can't hammer.
  useEffect(() => {
    let last = "";
    const sub = addNetworkStateListener(({ type, isConnected }) => {
      const state = `${type}|${isConnected}`;
      if (state !== last && !connectedRef.current) retry();
      last = state;
    });
    return () => sub.remove();
  }, [retry]);

  // Timers don't run in background, check right away when coming back
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && !connectedRef.current) check();
    });
    return () => sub.remove();
  }, [check]);

  useEffect(() => {
    const duration = 400;
    // hiding is quick; showing waits out brief outages — starting the hide
    // animation cancels a still-delayed show, so short blips never surface
    const hideDelay = 500;
    const showDelay = 2000;
    const stagger = duration * 0.3;

    if (!isConnected) setOverlayHidden(false);

    // snap straight to final state when running tests
    if (testingEnvironment()) {
      setOverlayHidden(isConnected);
      contFade.setValue(isConnected ? 1 : 0);
      loadFade.setValue(isConnected ? 0 : 1);
      loadScale.setValue(isConnected ? 1.2 : 1);
      return;
    }

    Animated.timing(contFade, {
      toValue: isConnected ? 1 : 0,
      delay: isConnected ? hideDelay + stagger : showDelay,
      duration,
      useNativeDriver: true,
    }).start();

    Animated.timing(loadFade, {
      toValue: isConnected ? 0 : 1,
      delay: isConnected ? hideDelay : showDelay + stagger,
      duration,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && isConnected) setOverlayHidden(true);
    });

    Animated.timing(loadScale, {
      toValue: isConnected ? 1.2 : 1,
      delay: isConnected ? hideDelay : showDelay + stagger,
      duration,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);

  const handleDownload = useCallback(
    async ({
      url,
      headers,
    }: {
      url: string;
      headers?: Record<string, string>;
    }) => {
      // attach the webview's auth cookie, basic auth and event headers
      try {
        const requestHeaders = { ...headers };
        const cookies = await CookieManager.get(url, true);
        const cookieHeader = Object.values(cookies)
          .map((c) => `${c.name}=${c.value}`)
          .join("; ");
        if (cookieHeader) requestHeaders["Cookie"] = cookieHeader;
        if (basicAuthCredential) {
          const { username, password } = basicAuthCredential;
          requestHeaders["Authorization"] =
            `Basic ${encode(`${username}:${password}`)}`;
        }
        const name = await shareFileFromUrl(url, requestHeaders);
        if (name) setDownloadedFile(name);
      } catch (e) {
        console.log(`download failed for ${url}: ${e}`);
      }
    },
    [basicAuthCredential],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case "offline":
          setOffline();
          break;
        case "online":
          setOnline();
          break;
        case "settings":
          openSettings();
          break;
        case "download":
          handleDownload(data);
          break;
        case "vibrate": {
          const { Light, Medium, Heavy } = Haptics.ImpactFeedbackStyle;
          const d = Array.isArray(data.pattern)
            ? data.pattern[0]
            : data.pattern;
          Haptics.impactAsync(d <= 50 ? Light : d <= 100 ? Medium : Heavy);
          break;
        }
      }
    },
    [openSettings, handleDownload, setOnline, setOffline],
  );

  const isServerUrl = useCallback(
    (url: string) =>
      new URL(url).host === new URL(activeServer?.url || "").host,
    [activeServer?.url],
  );

  // web pages open in an in-app browser sheet, everything else (mailto:, tel:,
  // evcc://) is handed to the OS
  const openExternal = useCallback(
    (url: string) => {
      const { protocol } = new URL(url);
      const inAppBrowser =
        (protocol === "http:" || protocol === "https:") && !isIosAppOnMac;

      if (!inAppBrowser) {
        Linking.openURL(url);
        return;
      }
      WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: colors.primary,
        toolbarColor: colors.background,
        dismissButtonStyle: "done",
        enableBarCollapsing: true,
        showTitle: true,
      }).catch(() => Linking.openURL(url)); // Android without Custom Tabs support
    },
    [colors],
  );

  const onShouldStartLoadWithRequest = useCallback(
    (event: ShouldStartLoadRequest) => {
      if (event.isTopFrame === false || isServerUrl(event.url)) return true;
      openExternal(event.url);
      return false;
    },
    [isServerUrl, openExternal],
  );

  // target="_blank" links; same-origin ones stay in the WebView to keep its
  // session cookie (e.g. /providerauth/login redirecting to a vendor login)
  const onOpenWindow = useCallback(
    ({ nativeEvent: { targetUrl } }: WebViewOpenWindowEvent) => {
      if (isServerUrl(targetUrl)) {
        webViewRef.current?.injectJavaScript(
          `window.location.href = ${JSON.stringify(targetUrl)}; true;`,
        );
      } else {
        openExternal(targetUrl);
      }
    },
    [isServerUrl, openExternal],
  );

  const onLoadStart = useCallback(() => {
    loadRef.current.loading = true;
  }, []);

  const onLoadEnd = useCallback(() => {
    Object.assign(loadRef.current, { loading: false, endedAt: Date.now() });
  }, []);

  const onNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    canGoBackRef.current = navState.canGoBack;
  }, []);

  const LayoutMemoized = useMemo(
    () => (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View style={{ flex: 1, opacity: contFade }}>
          {webViewKey > 0 && (
            <WebView
              testID="mainWebView"
              basicAuthCredential={basicAuthCredential}
              source={{ uri: activeServer?.url || "" }}
              injectedJavaScript={`
              window.evccAppCapabilities = ["download"];
              ${safeAreaJs(insets)}
              if (!navigator.vibrate) {
                navigator.vibrate = function(pattern) {
                  if (pattern === 0 || (Array.isArray(pattern) && pattern.length === 0)) {
                    return true;
                  }
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: "vibrate", pattern: pattern }));
                  return true;
                };
              }
            `}
              style={{ flex: 1 }}
              // Fresh WebView per server avoids leaking cookies/auth across servers.
              key={`${activeServer?.url}#${webViewKey}`}
              bounces={false}
              // macOS has no software keyboard, so the form accessory bar only covers the nav
              hideKeyboardAccessoryView={isIosAppOnMac}
              // Android passes the string to native unconverted and crashes
              decelerationRate={Platform.OS === "ios" ? "normal" : undefined}
              ref={webViewRef}
              overScrollMode="never"
              setBuiltInZoomControls={false}
              applicationNameForUserAgent={USER_AGENT}
              onLoadStart={onLoadStart}
              onLoadEnd={onLoadEnd}
              onError={setOffline}
              onHttpError={setOffline}
              onContentProcessDidTerminate={setOffline}
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
              onOpenWindow={onOpenWindow}
              // web UI opens windows after async work too, all routed through onOpenWindow
              javaScriptCanOpenWindowsAutomatically
              onNavigationStateChange={onNavigationStateChange}
            />
          )}
        </Animated.View>
        <Animated.View
          style={{
            ...styles.overlay,
            opacity: loadFade,
            transform: [{ scale: loadScale }],
            pointerEvents: isConnected ? "none" : "auto",
            paddingLeft: insets.left,
            paddingRight: insets.right,
            backgroundColor: colors.background,
          }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              paddingHorizontal: 32,
            }}
          >
            {problem ? (
              <View style={{ gap: 8 }}>
                <AppText
                  testID={`connectionProblem-${problem.type}`}
                  variant="s1"
                  style={{ textAlign: "center" }}
                >
                  {t(`connection.${problem.type}.title`, problem)}
                </AppText>
                <AppText color="hint" style={{ textAlign: "center" }}>
                  {t(`connection.${problem.type}.hint`)}
                </AppText>
              </View>
            ) : (
              <AppText color="hint">{t("servers.search.searching")}</AppText>
            )}
            {/* failed logins aren't retried automatically */}
            <View
              style={{ opacity: problem?.type === "auth" && !probing ? 0 : 1 }}
            >
              {!overlayHidden && <Spinner />}
            </View>
            {/* retrying early doesn't lift a rate limit */}
            {problem && problem.type !== "rateLimited" && (
              <RetryLink visible={!probing} onPress={retry} />
            )}
          </View>
          <View
            style={{
              paddingTop: 32,
              paddingBottom: Math.max(insets.bottom, 32),
            }}
          >
            <TextLink onPress={openSettings}>
              {t("servers.changeServer")}
            </TextLink>
          </View>
        </Animated.View>
      </View>
    ),
    [
      activeServer?.url,
      basicAuthCredential,
      webViewKey,
      contFade,
      loadFade,
      loadScale,
      isConnected,
      overlayHidden,
      problem,
      probing,
      retry,
      onLoadStart,
      onLoadEnd,
      setOffline,
      onShouldStartLoadWithRequest,
      onOpenWindow,
      onNavigationStateChange,
      handleMessage,
      openSettings,
      colors,
      t,
      insets,
    ],
  );

  if (!activeServer?.url) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      {LayoutMemoized}
      {testingEnvironment() && downloadedFile ? (
        <Text testID="downloadCompleted" style={styles.downloadMarker}>
          {downloadedFile}
        </Text>
      ) : null}
    </>
  );
}

// Fades in a while after each attempt, so the user sees retries happen and
// isn't invited to hammer the server. Keeps its space to avoid layout jumps.
function RetryLink({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setShown(false);
    opacity.setValue(0);
    if (!visible) return;
    const id = setTimeout(() => {
      setShown(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 5000);
    return () => clearTimeout(id);
  }, [visible, opacity]);
  return (
    <Animated.View
      style={{ alignSelf: "stretch", opacity }}
      pointerEvents={shown ? "auto" : "none"}
    >
      <TextLink
        testID={shown ? "connectionRetry" : undefined}
        onPress={onPress}
      >
        {t("connection.retry")}
      </TextLink>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  // invisible marker that lets e2e tests assert a download finished
  downloadMarker: {
    position: "absolute",
    opacity: 0,
  },
});
