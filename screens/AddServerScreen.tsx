import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useThemeColors } from "utils/theme";
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
  const colors = useThemeColors();
  const { setActiveServer, addServer } = useAppContext();

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
        required: !!username || !!password || required,
      },
    });
  }, [title, initialUrl, username, password]);

  const serverSelected = useCallback(
    async (server: Server) => {
      console.log("serverSelected");
      setInternalServer(server);

      // a freshly added server becomes the active one
      await addServer(server);
      await setActiveServer(server);

      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [setActiveServer, addServer, navigation],
  );

  const isNested = navigation
    .getState()
    .routes.some((r) => (r.name as string) === "SwitchServer");

  const memoizedHeader = useMemo(
    () => (
      <Header
        title={t("servers.switchServer.addServer")}
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
    </View>
  );
}

export default memo(AddServerScreen);
