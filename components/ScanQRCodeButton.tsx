import { Button, ButtonProps } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { useCameraPermissions } from "expo-camera";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function ScanQRCodeButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
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
          const result = await requestPermission();
          if (result.granted) {
            navigation.navigate("QRCodeCamera");
          }
        } else {
          navigation.navigate("QRCodeCamera");
        }
      },
    });
  }
}
