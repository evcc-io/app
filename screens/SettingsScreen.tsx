import React from "react";
import { Button, Text, Icon, useTheme } from "@ui-kitten/components";
import { View, TouchableOpacity } from "react-native";
import * as Linking from "expo-linking";
import ServerForm from "../components/ServerForm";
import { useAppContext } from "../components/AppContext";
import Header from "../components/Header";
import { useTranslation } from "react-i18next";
import { APP_VERSION, GITHUB_RELEASES_URL } from "../utils/constants";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Connection } from "types";
import { SafeAreaView } from "react-native-safe-area-context";

function SettingsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Settings">) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { activeConnection, updateConnection, closeConnection } =
    useAppContext();

  const saveServer = React.useCallback(
    (connection: Connection) => {
      updateConnection(connection);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation, updateConnection],
  );

  const serverForm = React.useMemo(
    () => (
      <ServerForm connection={activeConnection} serverSelected={saveServer} />
    ),
    [activeConnection, saveServer],
  );

  const openGitHubReleases = () => {
    Linking.openURL(GITHUB_RELEASES_URL);
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingBottom: 32 }}>
      <Header
        title={t("servers.changeServer")}
        showDone
        onDone={() => navigation.goBack()}
      />
      <View style={{ paddingHorizontal: 16 }}>
        {serverForm}
        <Button
          testID="setingsScreenCloseServer"
          style={{ marginVertical: 16 }}
          appearance="ghost"
          status="primary"
          accessoryLeft={(props) => {
            return (
              <Icon
                {...props}
                fill={theme["text-primary-color"]}
                name="arrow-circle-left-outline"
                style={{ width: 32, height: 32 }}
              />
            );
          }}
          onPress={() => {
            closeConnection();
          }}
        >
          {t("servers.removeServer")}
        </Button>
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity onPress={openGitHubReleases}>
          <Text appearance="hint" category="c1">
            {APP_VERSION}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default React.memo(SettingsScreen);
