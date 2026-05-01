import React, { useRef } from "react";
import { Layout, Text, useTheme } from "@ui-kitten/components";
import IconHomeFill from "@material-symbols/svg-400/rounded/home-fill.svg";
import IconHome from "@material-symbols/svg-400/rounded/home.svg";
import IconEdit from "@material-symbols/svg-400/rounded/edit.svg";
import IconAdd from "@material-symbols/svg-400/rounded/add.svg";
import { useAppContext } from "../components/AppContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { sameServer } from "utils/server";
import Header from "components/Header";
import ServerEntry, { SERVER_ENTRY_MIN_HEIGHT } from "components/ServerEntry";
import ShakyText, { ShakyTextHandle } from "components/ShakyText";

export default function ChangeServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ChangeServer">) {
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
  const shakyText = useRef<ShakyTextHandle>(null);

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          title={t("servers.switchServer.title")}
          showDone
          onDone={() => {
            if (activeServer !== undefined) {
              navigation.popTo("Main");
            } else {
              shakyText.current?.shake();
            }
          }}
        />
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {activeServer === undefined && (
            <ShakyText
              ref={shakyText}
              text={t("servers.switchServer.noServerSelected")}
            />
          )}
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
                  <View key={server.url ?? `server-${index}`} style={cellStyle}>
                    <ServerEntry
                      title={server.title}
                      url={server.url}
                      active={isActive}
                      leftIcon={
                        <StatusIcon width={28} height={28} fill={accentColor} />
                      }
                      rightIcon={
                        <IconEdit width={28} height={28} fill={accentColor} />
                      }
                      onPress={async () => {
                        await setActiveServer(server);
                        navigation.navigate("Main");
                      }}
                      onRightPress={() =>
                        navigation.navigate("Settings", {
                          server,
                          serverIndex: index,
                        })
                      }
                    />
                  </View>
                );
              })}
              <View style={cellStyle}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ServerManual")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: theme["color-basic-500"],
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderRadius: 16,
                    minHeight: SERVER_ENTRY_MIN_HEIGHT,
                    paddingHorizontal: 16,
                  }}
                >
                  <IconAdd
                    width={28}
                    height={28}
                    fill={theme["text-basic-color"]}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: theme["text-basic-color"] }}>
                    {t("servers.switchServer.addServer")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Layout>
  );
}
