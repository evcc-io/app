import { Button } from "@ui-kitten/components";
import { CameraView } from "expo-camera";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { CloseIcon } from "../components/Header";

export interface Http {
  url: string;
  username: string;
  password: string;
}

export default function QRCodeCamera({ navigation }) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
      }}
    >
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={(r) => {
          try {
            const json: Http = JSON.parse(r.data);
            if (json.url && json.username && json.password) {
              navigation.navigate("ServerManual", {
                url: json.url,
                basicAuth: {
                  required: true,
                  username: json.username,
                  password: json.password,
                },
              });
            }
          } catch (e) {
            console.log("Error parsing qr code data: ", e);
          }
        }}
      >
        <Pressable
          onPress={() => navigation.navigate("Server")}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingVertical: 4,
          }}
        >
          <CloseIcon />
        </Pressable>
        <Button
          style={{ alignSelf: "center", top: "90%" }}
          onPress={() => navigation.navigate("Server")}
          appearance="filled"
        >
          {t("servers.manually.qrcode.back")}
        </Button>
      </CameraView>
    </View>
  );
}
