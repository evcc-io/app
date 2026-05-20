import { Button } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { useCameraPermissions } from "expo-camera";
import { Alert, Linking } from "react-native";
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

  const isOnboarding = shown === "Onboarding";

  return (
    <Button
      style={{ marginVertical: 8 }}
      appearance={isOnboarding ? "outline" : "ghost"}
      status={isOnboarding ? "primary" : "basic"}
      size={isOnboarding ? "medium" : "small"}
      testID={`scanQrcodeButton${shown}`}
      onPress={async () => {
        if (!testingEnvironment() && !permission.granted) {
          const result = await requestPermission();

          if (!result.granted) {
            if (!result.canAskAgain) {
              await Linking.openSettings();
            } else {
              Alert.alert(t("servers.manually.qrcode.permissionDenied"));
            }
            return;
          }
        }

        navigation.navigate("QRCodeCamera");
      }}
    >
      {t(
        isOnboarding
          ? "servers.manually.qrcode.scanOnboarding"
          : "servers.manually.qrcode.scanPrefill",
      )}
    </Button>
  );
}
