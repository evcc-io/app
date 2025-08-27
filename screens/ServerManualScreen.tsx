import React from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BasicAuth, RootStackParamList } from "types";
import * as Linking from "expo-linking";

function ServerManualScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ServerManual">) {
  let url = "";
  let basicAuth: BasicAuth = { required: false };

  const linkingUrl = Linking.useLinkingURL();

  if (linkingUrl) {
    const { queryParams } = Linking.parse(linkingUrl);
    console.log(queryParams);

    if (queryParams) {
      if (
        typeof queryParams["url"] === "string" &&
        typeof queryParams["username"] === "string" &&
        typeof queryParams["password"] === "string"
      ) {
        url = queryParams["url"];
        basicAuth = {
          ...basicAuth,
          username: queryParams["username"],
          password: queryParams["password"],
        };
      }

      if (typeof queryParams["required"] === "string") {
        basicAuth = {
          ...basicAuth,
          required: queryParams["required"] === "true",
        };
      }
    }
  }

  const { t } = useTranslation();
  const { updateServerUrl } = useAppContext();
  const memoizedUpdateServerUrl = React.useCallback(updateServerUrl, []);
  const memoizedHeader = React.useMemo(
    () => (
      <Header
        title={t("servers.manually.enterUrl")}
        showDone
        onDone={() => navigation.navigate("Server")}
      />
    ),
    [navigation],
  );

  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm
          url={url}
          basicAuth={basicAuth}
          onChange={memoizedUpdateServerUrl}
        />
      </View>
    </Layout>
  );
}

export default React.memo(ServerManualScreen);
