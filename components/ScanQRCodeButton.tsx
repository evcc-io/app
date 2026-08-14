import { useTranslation } from "react-i18next";
import { useCameraPermissions } from "expo-camera";
import { Alert, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { testingEnvironment } from "helper/launchArguments";
import Button from "components/Button";
import TextLink from "components/TextLink";

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
  const testID = `scanQrcodeButton${shown}`;

  const onPress = async () => {
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
  };

  if (!isOnboarding) {
    return (
      <TextLink onPress={onPress} testID={testID}>
        {t("servers.manually.qrcode.scanPrefill")}
      </TextLink>
    );
  }

  return (
    <Button
      variant="outline"
      status="primary"
      testID={testID}
      onPress={onPress}
    >
      {t("servers.manually.qrcode.scanOnboarding")}
    </Button>
  );
}
