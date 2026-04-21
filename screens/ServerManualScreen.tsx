import React, { useState } from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Connection, RootStackParamList } from "types";

function ServerManualScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ServerManual">) {
  const { t } = useTranslation();
  const { activeConnection, updateConnection } = useAppContext();

  const { url: initialUrl = "", username, password } = route.params || {};
  const [connection, setConnection] = useState<Connection>({
    url: initialUrl,
    basicAuth: {
      username,
      password,
      required: !!username || !!password,
    },
  });

  React.useEffect(() => {
    setConnection({
      url: initialUrl,
      basicAuth: {
        username,
        password,
        required: connection.basicAuth?.required,
      },
    });
  }, [initialUrl, username, password]);

  const serverSelected = React.useCallback(
    async (connection: Connection) => {
      console.log("serverSelected");
      setConnection(connection);
      await updateConnection(connection);

      // After setting serverUrl, navigate to Main which will be available in the new stack
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    },
    [updateConnection, navigation],
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
            navigation.navigate(activeConnection?.url ? "Main" : "Server");
          }
        }}
      />
    ),
    [navigation, activeConnection?.url, t],
  );

  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm
          connection={connection}
          serverSelected={serverSelected}
        />
      </View>
    </Layout>
  );
}

export default React.memo(ServerManualScreen);
