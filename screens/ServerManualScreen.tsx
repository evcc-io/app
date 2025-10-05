import React from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BasicAuth, RootStackParamList } from "types";

function ServerManualScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ServerManual">) {
  const { t } = useTranslation();
  const { serverUrl, updateServerUrl } = useAppContext();

  const { url: initialUrl = "", username, password } = route.params || {};

  const [url, setUrl] = React.useState(initialUrl);
  const [basicAuth, setBasicAuth] = React.useState<BasicAuth>({
    username,
    password,
    required: !!username || !!password,
  });

  React.useEffect(() => {
    setUrl(initialUrl);
    setBasicAuth({ username, password, required: basicAuth.required });
  }, [initialUrl, username, password]);

  const serverSelected = React.useCallback(
    async (nextUrl: string, nextBasicAuth: BasicAuth) => {
      console.log("serverSelected");
      setUrl(nextUrl);
      setBasicAuth(nextBasicAuth);
      await updateServerUrl(nextUrl, nextBasicAuth);

      // After setting serverUrl, navigate to Main which will be available in the new stack
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    },
    [updateServerUrl, navigation],
  );

  const memoizedHeader = React.useMemo(
    () => (
      <Header
        title={t("servers.manually.enterUrl")}
        showDone
        onDone={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate(serverUrl ? "Main" : "Server");
          }
        }}
      />
    ),
    [navigation, serverUrl, t],
  );

  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm
          url={url}
          basicAuth={basicAuth}
          serverSelected={serverSelected}
        />
      </View>
    </Layout>
  );
}

export default React.memo(ServerManualScreen);
