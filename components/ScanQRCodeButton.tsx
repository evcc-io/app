import { Button, ButtonProps } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { useCameraPermissions } from "expo-camera";
import { Linking, AppState } from "react-native";
import { useEffect } from "react";

export default function ScanQRCodeButton({ navigation }) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  function qrCodeButton(s: string, props: ButtonProps = {}) {
    return (
      <Button
        style={{ marginVertical: 8 }}
        appearance="outline"
        status="primary"
        {...props}
      >
        {t(`servers.manually.qrcode.${s}`)}
      </Button>
    );
  }

  if (!permission) {
    return;
  } else if (!permission.canAskAgain) {
    return qrCodeButton("permissionDenied", {
      onPress: async () => {
        await Linking.openSettings();
      },
    });
  } else {
    return qrCodeButton("scan", {
      onPress: async () => {
        if (!permission.granted) {
          await requestPermission();
        }
        if (permission.granted) {
          navigation.navigate("QRCodeCamera");
        }
      },
    });
  }
}
