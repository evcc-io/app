import WebViewScreen from "./WebViewScreen";

export default function SessionsScreen({ navigation, route }) {
  return (
    <WebViewScreen route={route} navigation={navigation} page="sessions" />
  );
}
