import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Server, RootStackParamList } from "types";
import { SafeAreaView } from "react-native-safe-area-context";

function ServerManualScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ServerManual">) {
  const { t } = useTranslation();
  const { activeServer, setActiveServer, updateServer, addServer, servers } =
    useAppContext();

  const {
    title,
    url: initialUrl = "",
    username,
    password,
    required,
  } = route.params || {};
  const [server, setServer] = useState<Server>({
    title,
    url: initialUrl,
    basicAuth: {
      username,
      password,
      required: !!username || !!password || required,
    },
  });

  useEffect(() => {
    setServer({
      title,
      url: initialUrl,
      basicAuth: {
        username,
        password,
        required: server.basicAuth.required,
      },
    });
  }, [title, initialUrl, username, password]);

  const serverSelected = useCallback(
    async (server: Server) => {
      console.log("serverSelected");
      setServer(server);

      await setActiveServer(server);
      await addServer(server);

      if (servers.length === 1) {
        navigation.navigate("Main");
      } else {
        navigation.goBack();
      }
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
      <SafeAreaView style={{ flex: 1 }}>
        {memoizedHeader}
        <View style={{ paddingHorizontal: 16 }}>
          <ServerForm
            mode="create"
            server={server}
            serverSelected={serverSelected}
          />
        </View>
      </SafeAreaView>
    </Layout>
  );
}

export default memo(ServerManualScreen);
