import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import {
  StyleSheet,
  Animated,
  View,
  Text,
  Platform,
  BackHandler,
} from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import AppText from "components/AppText";
import TextLink from "components/TextLink";
import { useThemeColors } from "utils/theme";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { USER_AGENT } from "../utils/constants";
import {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewTerminatedEvent,
  WebViewNavigation,
} from "react-native-webview/lib/WebViewTypes";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "types";
import CookieManager from "@preeternal/react-native-cookie-manager";
import { encode } from "base-64";
import { shareFileFromUrl } from "utils/shareFile";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Spinner from "components/Spinner";
import { testingEnvironment } from "helper/launchArguments";

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
  const [webViewKey, setWebViewKey] = useState(0);
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

  // Reconnect if connection is lost
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (!isConnected) {
      intervalId = setInterval(() => {
        console.log("Attempting to reconnect...");
        setWebViewKey((prevKey) => prevKey + 1);
      }, 5000);
    }

    return () => clearInterval(intervalId);
  }, [isConnected]);

  useEffect(() => {
    const duration = 400;
    // hiding is quick; showing waits out brief outages — starting the hide
    // animation cancels a still-delayed show, so short blips never surface
    const hideDelay = 500;
    const showDelay = 2000;
    const stagger = duration * 0.3;

    // snap straight to final state when running tests
    if (testingEnvironment()) {
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
    }).start();

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
          setIsConnected(false);
          break;
        case "online":
          setIsConnected(true);
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
    [openSettings, handleDownload],
  );

  const onShouldStartLoadWithRequest = useCallback(
    (event: ShouldStartLoadRequest) => {
      const cleanActiveServerHost = new URL(activeServer?.url || "").host;
      const cleanEventHost = new URL(event.url).host;

      if (!cleanEventHost.startsWith(cleanActiveServerHost)) {
        Linking.openURL(event.url);
        return false;
      }
      return true;
    },
    [activeServer?.url],
  );

  const onError = useCallback((event: WebViewErrorEvent) => {
    console.log("onError", event);
    setIsConnected(false);
  }, []);

  const onHttpError = useCallback((event: WebViewHttpErrorEvent) => {
    console.log("onHttpError", event);
    setIsConnected(false);
  }, []);

  const onTerminate = useCallback((event: WebViewTerminatedEvent) => {
    console.log("onTerminate", event);
    setIsConnected(false);
  }, []);

  const onNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      canGoBackRef.current = navState.canGoBack;
    },
    [],
  );

  const LayoutMemoized = useMemo(
    () => (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View style={{ flex: 1, opacity: contFade }}>
          <WebView
            testID="mainWebView"
            basicAuthCredential={basicAuthCredential}
            source={{ uri: activeServer?.url || "" }}
            injectedJavaScript={`
              window.evccAppCapabilities = ["download"];
              document.documentElement.style.setProperty("--safe-area-inset-top", "${insets.top}px");
              document.documentElement.style.setProperty("--safe-area-inset-bottom", "${insets.bottom}px");
              document.documentElement.style.setProperty("--safe-area-inset-left", "${insets.left}px");
              document.documentElement.style.setProperty("--safe-area-inset-right", "${insets.right}px");
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
            ref={webViewRef}
            overScrollMode="never"
            setBuiltInZoomControls={false}
            applicationNameForUserAgent={USER_AGENT}
            onError={onError}
            onHttpError={onHttpError}
            onContentProcessDidTerminate={onTerminate}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onNavigationStateChange={onNavigationStateChange}
          />
        </Animated.View>
        <Animated.View
          style={{
            ...styles.overlay,
            opacity: loadFade,
            transform: [{ scale: loadScale }],
            pointerEvents: isConnected ? "none" : "auto",
          }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.background,
            }}
          >
            <Spinner />
            <AppText color="hint" style={{ marginTop: 24 }}>
              {t("servers.search.searching")}
            </AppText>
          </View>
          <View
            style={{
              paddingVertical: 32,
              backgroundColor: colors.background,
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
      onError,
      onShouldStartLoadWithRequest,
      onNavigationStateChange,
      onTerminate,
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

  console.log("serverUrl", activeServer.url, isConnected);

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
