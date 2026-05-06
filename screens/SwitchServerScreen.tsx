import React from "react";
import { Layout, Text, useTheme } from "@ui-kitten/components";
import IconHomeFill from "@material-symbols/svg-400/rounded/home-fill.svg";
import IconHome from "@material-symbols/svg-400/rounded/home.svg";
import IconEdit from "@material-symbols/svg-400/rounded/edit.svg";
import IconAdd from "@material-symbols/svg-400/rounded/add.svg";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { useAppContext } from "../components/AppContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SwitchServerStackParamList } from "types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { sameServer } from "utils/server";
import { delay } from "utils/delay";
import { APP_VERSION, GITHUB_RELEASES_URL } from "../utils/constants";
import Header from "components/Header";
import ServerEntry, { SERVER_ENTRY_MIN_HEIGHT } from "components/ServerEntry";

export default function SwitchServerScreen({
  navigation,
}: NativeStackScreenProps<SwitchServerStackParamList, "SwitchServer">) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { activeServer, servers, setActiveServer } = useAppContext();
  const { width } = useWindowDimensions();
  const numColumns = width >= 600 ? 2 : 1;
  const cellWidth = `${100 / numColumns}%` as const;
  const cellStyle = {
    width: cellWidth,
    paddingHorizontal: 8,
    paddingBottom: 20,
  };

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          title={t("servers.switchServer.title")}
          showDone
          onDone={() => {
            navigation.getParent()?.goBack();
          }}
        />
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <ScrollView style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginHorizontal: -8,
              }}
            >
              {servers.map((server, index) => {
                const isActive = sameServer(server, activeServer);
                const accentColor = isActive
                  ? theme["text-primary-color"]
                  : theme["text-basic-color"];
                const StatusIcon = isActive ? IconHomeFill : IconHome;
                return (
                  <View
                    key={server.url ?? `server-${index}`}
                    style={cellStyle}
                    testID={`server${index}`}
                  >
                    <ServerEntry
                      title={server.title}
                      url={server.url}
                      active={isActive}
                      leftIcon={
                        <StatusIcon width={28} height={28} fill={accentColor} />
                      }
                      rightIcon={
                        <IconEdit
                          testID={`editServer${index}Icon`}
                          width={28}
                          height={28}
                          fill={accentColor}
                        />
                      }
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        await setActiveServer(server);
                        await delay(500);
                        navigation.goBack();
                      }}
                      onRightPress={() =>
                        navigation.navigate("EditServer", {
                          server,
                          serverIndex: index,
                        })
                      }
                    />
                  </View>
                );
              })}
              <View style={cellStyle}>
                <Pressable
                  onPress={() => navigation.navigate("AddServer")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: theme["color-basic-500"],
                    borderWidth: 1,
                    borderStyle: pressed ? "solid" : "dashed",
                    borderRadius: 16,
                    minHeight: SERVER_ENTRY_MIN_HEIGHT,
                    paddingHorizontal: 16,
                  })}
                >
                  <IconAdd
                    testID="addServerIcon"
                    width={28}
                    height={28}
                    fill={theme["text-basic-color"]}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: theme["text-basic-color"] }}>
                    {t("servers.switchServer.addServer")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
        <View style={{ alignItems: "center", paddingBottom: 8 }}>
          <TouchableOpacity
            onPress={() => Linking.openURL(GITHUB_RELEASES_URL)}
          >
            <Text appearance="hint" category="c1">
              {APP_VERSION}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Layout>
  );
}
