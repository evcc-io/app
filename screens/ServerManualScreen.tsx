import React from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BasicAuth, ProxyHeader, RootStackParamList } from "types";

function ServerManualScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ServerManual">) {
  const { t } = useTranslation();
  const { serverUrl, updateServerUrl } = useAppContext();

  const {
    url: initialUrl = "",
    username,
    password,
    headerName,
    headerValue,
  } = route.params || {};

  const [url, setUrl] = React.useState(initialUrl);
  const [basicAuth, setBasicAuth] = React.useState<BasicAuth>({
    username,
    password,
    required: !!username || !!password,
  });

  const [proxyHeader, setProxyHeader] = React.useState<ProxyHeader>({
    headerName,
    headerValue,
    required: !!headerName || !!headerValue,
  });

  React.useEffect(() => {
    setUrl(initialUrl);
    setBasicAuth({ username, password, required: basicAuth.required });
    setProxyHeader({ headerName, headerValue, required: proxyHeader.required });
  }, [initialUrl, username, password]);

  const serverSelected = React.useCallback(
    async (
      nextUrl: string,
      nextBasicAuth: BasicAuth,
      nextProxyHeader: ProxyHeader,
    ) => {
      console.log("serverSelected");
      setUrl(nextUrl);
      setBasicAuth(nextBasicAuth);
      setProxyHeader(nextProxyHeader);
      await updateServerUrl(nextUrl, nextBasicAuth, proxyHeader);

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
          proxyHeader={proxyHeader}
          serverSelected={serverSelected}
        />
      </View>
    </Layout>
  );
}

export default React.memo(ServerManualScreen);
