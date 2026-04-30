import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Server, RootStackParamList } from "types";

function ServerManualScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ServerManual">) {
  const { t } = useTranslation();
  const { activeServer, updateServer } = useAppContext();

  const { url: initialUrl = "", username, password } = route.params || {};
  const [server, setServer] = useState<Server>({
    url: initialUrl,
    basicAuth: {
      username,
      password,
      required: !!username || !!password,
    },
  });

  useEffect(() => {
    setServer({
      url: initialUrl,
      basicAuth: {
        username,
        password,
        required: server.basicAuth.required,
      },
    });
  }, [initialUrl, username, password]);

  const serverSelected = useCallback(
    async (server: Server) => {
      console.log("serverSelected");
      setServer(server);
      await updateServer(server);

      // After setting serverUrl, navigate to Main which will be available in the new stack
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    },
    [updateServer, navigation],
  );

  const memoizedHeader = useMemo(
    () => (
      <Header
        title={t("servers.manually.enterUrl")}
        showDone
        onDone={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate(activeServer?.url ? "Main" : "Server");
          }
        }}
      />
    ),
    [navigation, activeServer?.url, t],
  );

  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm server={server} serverSelected={serverSelected} />
      </View>
    </Layout>
  );
}

export default memo(ServerManualScreen);
