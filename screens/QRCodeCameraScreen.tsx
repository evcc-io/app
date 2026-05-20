import React, { useState, useEffect, useRef } from "react";
import { Button, Layout, Text, useTheme } from "@ui-kitten/components";
import { CameraView } from "expo-camera";
import { useTranslation } from "react-i18next";
import { View, Animated } from "react-native";
import Header from "../components/Header";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AddServerParams, RootStackParamList } from "types";
import { SafeAreaView } from "react-native-safe-area-context";
import { testingEnvironment } from "helper/launchArguments";

export interface QrCodeData {
  title: string;
  url: string;
  username: string;
  password: string;
}

export default function QRCodeCameraScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "QRCodeCamera">) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [isScanning, setIsScanning] = useState(true);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!isScanning) return;

    if (testingEnvironment()) {
      pulseAnim.setValue(1);
      return;
    }

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

  const serverDetected = (server: AddServerParams) => {
    setTimeout(() => {
      navigation.popTo("AddServer", { ...server });
    }, 1000);
  };

  const memoizedHeader = React.useMemo(
    () => (
      <Header
        title={t("servers.manually.qrcode.scan")}
        showDone
        onDone={() => navigation.goBack()}
        doneTestID="headerCloseIconCamera"
      />
    ),
    [navigation, t],
  );

  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <SafeAreaView
        style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {testingEnvironment() ? (
          <Button
            testID="testQrCodeDetected"
            onPress={() =>
              serverDetected({
                url: "http://localhost:7080",
                title: "Local Auth",
                username: "admin",
                password: "secret",
              })
            }
          >
            TestQrCodeDetected
          </Button>
        ) : (
          <CameraView
            style={{ flex: 1, borderRadius: 16 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              isScanning
                ? (r) => {
                    try {
                      const qrcodeUrl = new URL(r.data);

                      const title = qrcodeUrl.searchParams.get("title") ?? "";
                      const url = qrcodeUrl.searchParams.get("url") ?? "";
                      const username =
                        qrcodeUrl.searchParams.get("username") ?? "";
                      const password =
                        qrcodeUrl.searchParams.get("password") ?? "";

                      if (
                        qrcodeUrl.protocol === "evcc:" &&
                        qrcodeUrl.hostname === "server" &&
                        url
                      ) {
                        showStatus(
                          t("servers.manually.qrcode.recognized"),
                          "success",
                        );

                        serverDetected({
                          title,
                          url,
                          username,
                          password,
                          required: !!username || !!password,
                        });
                      } else {
                        showStatus(
                          t("servers.manually.qrcode.invalid"),
                          "error",
                        );
                      }
                    } catch (e) {
                      console.log("Error parsing qr code data: ", e);
                      showStatus(t("servers.manually.qrcode.invalid"), "error");
                    }
                  }
                : undefined
            }
          />
        )}

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
      </SafeAreaView>
    </Layout>
  );
}
