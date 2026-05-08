import { Button } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { useCameraPermissions } from "expo-camera";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { testingEnvironment } from "helper/launchArguments";

interface ScanQRCodeButtonProps {
  shown: "Onboarding" | "Addserverform";
}

export default function ScanQRCodeButton({ shown }: ScanQRCodeButtonProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return null;
  }

  return (
    <Button
      style={{ marginVertical: 8 }}
      appearance="outline"
      status="primary"
      testID={`scanQrcodeButton${shown}`}
      onPress={async () => {
        if (!testingEnvironment() && !permission.granted) {
          const result = await requestPermission();

          if (!result.granted) {
            if (!result.canAskAgain) {
              await Linking.openSettings();
            }
            return;
          }
        }

        navigation.navigate("QRCodeCamera");
      }}
    >
      {t("servers.manually.qrcode.scan")}
    </Button>
  );
}
