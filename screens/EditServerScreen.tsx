import React from "react";
import { Layout, Button } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import { useAppContext } from "../components/AppContext";
import Header from "../components/Header";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SwitchServerStackParamList, Server } from "types";
import { SafeAreaView } from "react-native-safe-area-context";
import { sameServer } from "utils/server";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

function EditServerScreen({
  route,
  navigation,
}: NativeStackScreenProps<SwitchServerStackParamList, "EditServer">) {
  const { t } = useTranslation();
  const { activeServer, updateServer, removeServer, servers, setActiveServer } =
    useAppContext();
  const { server: internalServer, serverIndex } = route.params || {};

  const saveServer = React.useCallback(
    async (server: Server) => {
      if (serverIndex !== undefined) {
        if (
          activeServer &&
          servers.findIndex((s) => sameServer(activeServer, s)) === serverIndex
        ) {
          await setActiveServer(server);
        }
        await updateServer(server, serverIndex);
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation, updateServer],
  );

  const serverForm = React.useMemo(
    () => (
      <ServerForm
        mode="update"
        server={internalServer}
        serverSelected={saveServer}
      />
    ),
    [internalServer, saveServer],
  );

  return (
    <Layout style={{ flex: 1, paddingBottom: 32 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <Header
            title={t("servers.changeServer")}
            showBack
            onBack={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
          />
          <View style={{ paddingHorizontal: 16 }}>
            {serverForm}

            <Button
              testID="setingsScreenRemoveServer"
              style={{ marginVertical: 16 }}
              appearance="ghost"
              status="danger"
              onPress={async () => {
                if (serverIndex === undefined) return;
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
                await removeServer(serverIndex);
              }}
            >
              {t("servers.removeServer")}
            </Button>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Layout>
  );
}

export default React.memo(EditServerScreen);
