import React from "react";
import { Alert, View } from "react-native";
import TextLink from "components/TextLink";
import { useThemeColors } from "utils/theme";
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
  const colors = useThemeColors();
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
    [navigation, updateServer, serverIndex, activeServer, servers],
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
    <View
      style={{ flex: 1, paddingBottom: 32, backgroundColor: colors.background }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <Header
            title={t("servers.editServer")}
            showBack
            onBack={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
          />
          <View style={{ paddingHorizontal: 16 }}>
            {serverForm}

            <TextLink
              testID="setingsScreenRemoveServer"
              onPress={() => {
                if (serverIndex === undefined) return;
                Alert.alert(
                  t("servers.removeConfirm", {
                    title: internalServer?.title ?? internalServer?.url,
                  }),
                  undefined,
                  [
                    { text: t("servers.search.cancel"), style: "cancel" },
                    {
                      text: t("servers.remove"),
                      style: "destructive",
                      onPress: async () => {
                        // removing the last server swaps the root navigator to
                        // onboarding, which tears down this modal stack anyway —
                        // a goBack in parallel leaves the transition dangling
                        if (servers.length > 1 && navigation.canGoBack()) {
                          navigation.goBack();
                        }
                        await removeServer(serverIndex);
                      },
                    },
                  ],
                );
              }}
            >
              {t("servers.removeServer")}
            </TextLink>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

export default React.memo(EditServerScreen);
