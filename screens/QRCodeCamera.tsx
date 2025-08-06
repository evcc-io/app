import { CameraView } from "expo-camera";
import {  Text, TouchableOpacity, View } from "react-native";

export interface Http {
  url: string;
  username: string;
  password: string;
}

export default function QRCodeCamera({ navigation }) {
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
        <View style={{}}>
          <TouchableOpacity style={{}}>
            <Text>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
