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
  const { updateServerUrl } = useAppContext();

  const {
    url: initialUrl = "",
    username,
    password,
    required,
  } = route.params || {};

  const [url, setUrl] = React.useState(initialUrl);
  const [basicAuth, setBasicAuth] = React.useState<BasicAuth>({
    username,
    password,
    required: required ?? false,
  });

  React.useEffect(() => {
    setUrl(initialUrl);
    setBasicAuth({ username, password, required: required ?? false });
  }, [initialUrl, username, password, required]);

  const onChange = React.useCallback(
    (nextUrl: string, nextBasicAuth: BasicAuth) => {
      setUrl(nextUrl);
      setBasicAuth(nextBasicAuth);
      updateServerUrl(nextUrl, nextBasicAuth);
    },
    [updateServerUrl],
  );

  const memoizedHeader = React.useMemo(
    () => (
      <Header
        title={t("servers.manually.enterUrl")}
        showDone
        onDone={() => navigation.navigate("Server")}
      />
    ),
    [navigation, t],
  );

  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm url={url} basicAuth={basicAuth} onChange={onChange} />
      </View>
    </Layout>
  );
}

export default React.memo(ServerManualScreen);
