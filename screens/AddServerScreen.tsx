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
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

function AddServerScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "AddServer">) {
  const { t } = useTranslation();
  const { setActiveServer, addServer, servers } = useAppContext();

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

      if (servers.length === 0) {
        await setActiveServer(server);
      }
      await addServer(server);

      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [servers.length, setActiveServer, addServer, navigation],
  );

  const isNested = navigation
    .getState()
    .routes.some((r) => (r.name as string) === "SwitchServer");

  const memoizedHeader = useMemo(
    () => (
      <Header
        title={t("servers.manually.enterUrl")}
        showBack={isNested}
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
        showDone={!isNested}
        onDone={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
      />
    ),
    [navigation, t, isNested],
  );

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {memoizedHeader}
          <View style={{ paddingHorizontal: 16 }}>
            <ServerForm
              mode="create"
              server={internalServer}
              serverSelected={serverSelected}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Layout>
  );
}

export default memo(AddServerScreen);
