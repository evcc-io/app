import React, { useState, useEffect, useRef } from "react";
import { Layout, Text, useTheme } from "@ui-kitten/components";
import { CameraView } from "expo-camera";
import { useTranslation } from "react-i18next";
import { View, Animated } from "react-native";
import Header from "../components/Header";

export interface Http {
  url: string;
  username: string;
  password: string;
}

export default function QRCodeCamera({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [isScanning, setIsScanning] = useState(true);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isScanning) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isScanning, pulseAnim]);

  const showStatus = (message: string, type: "success" | "error") => {
    setStatusMessage(message);
    setStatusType(type);
    setIsScanning(false);

    // Auto-hide error messages and resume scanning
    if (type === "error") {
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
        setIsScanning(true);
      }, 3000);
    }
  };

  const memoizedHeader = React.useMemo(
    () => (
      <Header
        title={t("servers.manually.qrcode.scan")}
        showDone
        onDone={() => navigation.navigate("Server")}
      />
    ),
    [navigation, t],
  );

  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 32 }}>
        <CameraView
          style={{ flex: 1, borderRadius: 16 }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={
            isScanning
              ? (r) => {
                  try {
                    const json: Http = JSON.parse(r.data);
                    if (json.url && json.username && json.password) {
                      showStatus(
                        t("servers.manually.qrcode.recognized"),
                        "success",
                      );
                      setTimeout(() => {
                        navigation.navigate("ServerManual", {
                          url: json.url,
                          basicAuth: {
                            required: true,
                            username: json.username,
                            password: json.password,
                          },
                        });
                      }, 1000);
                    } else {
                      showStatus(t("servers.manually.qrcode.invalid"), "error");
                    }
                  } catch (e) {
                    console.log("Error parsing qr code data: ", e);
                    showStatus(t("servers.manually.qrcode.invalid"), "error");
                  }
                }
              : undefined
          }
        />

        <View
          style={{ height: 60, justifyContent: "center", alignItems: "center" }}
        >
          {statusMessage ? (
            <Text
              status={statusType === "success" ? "success" : "danger"}
              category="s1"
              style={{ textAlign: "center" }}
            >
              {statusMessage}
            </Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Animated.View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme["color-success-500"],
                  opacity: pulseAnim,
                  marginRight: 8,
                }}
              />
              <Text
                appearance="hint"
                category="s1"
                style={{ textAlign: "center" }}
              >
                {t("servers.manually.qrcode.scanning")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Layout>
  );
}
