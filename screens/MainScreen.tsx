import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { StyleSheet, Animated } from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { Text, Layout, Button } from "@ui-kitten/components";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { USER_AGENT } from "../utils/constants";
import {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewTerminatedEvent,
} from "react-native-webview/lib/WebViewTypes";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "types";
import { shareBase64File } from "utils/shareFile";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Spinner from "components/animations/Spinner";
import { testingEnvironment } from "helper/launchArguments";

export default function MainScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Main">) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { activeServer } = useAppContext();
  const webViewRef = useRef<WebView>(null);
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
    const smallDelay = 500;
    const largeDelay = smallDelay + duration * 0.3;
    Animated.timing(contFade, {
      toValue: isConnected ? 1 : 0,
      delay: isConnected ? largeDelay : smallDelay,
      duration,
      useNativeDriver: true,
    }).start();

    Animated.timing(loadFade, {
      toValue: isConnected ? 0 : 1,
      delay: isConnected ? smallDelay : largeDelay,
      duration,
      useNativeDriver: true,
    }).start();

    Animated.timing(loadScale, {
      toValue: isConnected ? 1.2 : 1,
      delay: isConnected ? smallDelay : largeDelay,
      duration,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("message", data);
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
          // do the fetch inside the webview so HttpOnly auth cookies and any
          // basic-auth tied to the webview ride along automatically; post the
          // bytes back as a data URL for us to persist + share. method/body
          // are forwarded so POST-with-body downloads (backup) work the same.
          webViewRef.current?.injectJavaScript(
            downloadScript(data.url, {
              method: data.method,
              body: data.body,
              headers: data.headers,
            }),
          );
          break;
        case "downloadData": {
          const dataUrl = String(data.dataUrl || "");
          const base64 = dataUrl.split(",", 2)[1] || "";
          const filename = String(data.filename || "download");
          shareBase64File(filename, base64).then((name) => {
            if (name) setDownloadedFile(name);
          });
          break;
        }
        case "downloadError":
          console.log(`download failed for ${data.url}: ${data.error}`);
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
    [openSettings],
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

  const onLoad = useCallback(() => {
    console.log("onLoad");
  }, []);

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

  const LayoutMemoized = useMemo(
    () => (
      <Layout style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: contFade }}>
          <WebView
            testID="mainWebView"
            basicAuthCredential={basicAuthCredential}
            source={{ uri: activeServer?.url || "" }}
            injectedJavaScript={`
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
            key={webViewKey}
            bounces={false}
            ref={webViewRef}
            overScrollMode="never"
            setBuiltInZoomControls={false}
            applicationNameForUserAgent={USER_AGENT}
            onError={onError}
            onHttpError={onHttpError}
            onLoad={onLoad}
            onContentProcessDidTerminate={onTerminate}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
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
          <Layout
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ marginVertical: 32 }} category="p1">
              {t("servers.search.searching")}
            </Text>
            <Spinner size="large" />
          </Layout>
          <Layout style={{ paddingVertical: 32 }}>
            <Button appearance="ghost" status="basic" onPress={openSettings}>
              {t("servers.changeServer")}
            </Button>
          </Layout>
        </Animated.View>
      </Layout>
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
      onLoad,
      onShouldStartLoadWithRequest,
      onTerminate,
      handleMessage,
      openSettings,
    ],
  );

  if (!activeServer?.url) {
    return <Layout style={{ flex: 1 }} />;
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

// fetches `url` from inside the webview (so the page's auth cookies and any
// basic-auth carry along) and posts the bytes back as a data URL plus the
// server-suggested filename. method/body/headers default to a plain GET; a
// non-string body is JSON-encoded with Content-Type: application/json so the
// caller can pass a plain object (used by the backup POST). trailing `true;`
// keeps injectJavaScript happy.
type DownloadInit = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

function downloadScript(url: string, init?: DownloadInit) {
  const u = JSON.stringify(url);
  const i = JSON.stringify(init || {});
  return `(async () => {
    const init = ${i};
    try {
      const reqInit = { credentials: "include" };
      if (init.method) reqInit.method = init.method;
      const headers = Object.assign({}, init.headers || {});
      if (init.body !== undefined && init.body !== null) {
        if (typeof init.body === "string") {
          reqInit.body = init.body;
        } else {
          reqInit.body = JSON.stringify(init.body);
          if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
        }
      }
      if (Object.keys(headers).length) reqInit.headers = headers;
      const res = await fetch(${u}, reqInit);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const cd = res.headers.get("Content-Disposition") || "";
      const m = cd.match(/filename\\*?=(?:UTF-8''([^;]+)|"([^";]+)"|([^;]+))/i);
      let filename = m ? decodeURIComponent(m[1] || m[2] || m[3]) : "";
      if (!filename) {
        try {
          const tail = new URL(${u}, location.href).pathname.split("/").pop();
          filename = tail ? decodeURIComponent(tail) : "download";
        } catch (_) { filename = "download"; }
      }
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "downloadData",
          url: ${u},
          filename: filename,
          dataUrl: reader.result,
        }));
      };
      reader.onerror = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "downloadError", url: ${u}, error: "FileReader failed",
        }));
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "downloadError", url: ${u}, error: String(e && e.message || e),
      }));
    }
  })();
  true;`;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  // invisible marker that lets e2e tests assert a download finished
  downloadMarker: {
    position: "absolute",
    opacity: 0,
  },
});
