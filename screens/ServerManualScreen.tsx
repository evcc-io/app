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
  const [internalServer, setInternalServer] = useState<Server>({
    title,
    url: initialUrl,
    basicAuth: {
      username,
      password,
      required: !!username || !!password || required,
    },
  });

  useEffect(() => {
    setInternalServer({
      title,
      url: initialUrl,
      basicAuth: {
        username,
        password,
        required: internalServer.basicAuth.required,
      },
    });
  }, [title, initialUrl, username, password]);

  const serverSelected = useCallback(
    async (server: Server) => {
      console.log("serverSelected");
      setInternalServer(server);
      await addServer(server);

      if (servers.length === 1) {
        await setActiveServer(server);
      }

      if (servers.length > 1) {
        navigation.navigate("ChangeServer");
      } else if (servers.length !== 1 && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Main");
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
            server={internalServer}
            serverSelected={serverSelected}
          />
        </View>
      </SafeAreaView>
    </Layout>
  );
}

export default memo(ServerManualScreen);
