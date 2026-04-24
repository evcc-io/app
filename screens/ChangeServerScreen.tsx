import React from "react";
import {
  Layout,
  List,
  ListItem,
  Text,
  Button,
  Icon,
  useTheme,
  TextProps,
} from "@ui-kitten/components";
import { useAppContext } from "../components/AppContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Server } from "types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { sameServer } from "utils/utils";
import Header from "components/Header";

export default function ChangeServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ChangeServer">) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { activeServer, servers, setActiveServer } = useAppContext();

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          title={t("servers.switchServer.title")}
          showDone
          onDone={() => {
            navigation.navigate("Main");
          }}
        />
        <View style={{ flex: 1, paddingHorizontal: 16, marginBottom: 16 }}>
          <List<Server>
            style={styles.container}
            data={servers}
            renderItem={({ item, index }) => (
              <ListItem
                title={(props: TextProps) => (
                  <Layout
                    style={[
                      props.style,
                      {
                        flexDirection: "row",
                        backgroundColor: "transparent",
                      },
                    ]}
                  >
                    {item.title && (
                      <Text
                        style={{
                          marginLeft: 8,
                        }}
                      >
                        {item.title}
                      </Text>
                    )}
                    {sameServer(item, activeServer) && (
                      <Text
                        style={{
                          paddingHorizontal: 5,
                          textTransform: "lowercase",
                          backgroundColor: theme["text-primary-color"],
                          borderRadius: 100,
                        }}
                      >
                        aktuell
                      </Text>
                    )}
                  </Layout>
                )}
                description={item.url}
                style={{
                  borderColor: sameServer(item, activeServer)
                    ? theme["text-primary-color"]
                    : theme["text-basic-color"],
                  borderWidth: 2,
                  borderRadius: 16,
                  marginBottom: 20,
                }}
                onPress={() => setActiveServer(item)}
                accessoryLeft={() =>
                  sameServer(item, activeServer) ? (
                    <Icon
                      name="checkmark-circle-2-outline"
                      height={30}
                      width={30}
                      fill={theme["text-primary-color"]}
                      style={{ paddingRight: 50 }}
                    />
                  ) : (
                    <Icon
                      name="hard-drive-outline"
                      height={30}
                      width={30}
                      fill={theme["text-basic-color"]}
                      style={{ paddingRight: 50 }}
                    />
                  )
                }
                accessoryRight={() => (
                  <Button
                    onPress={() =>
                      navigation.navigate("Settings", {
                        server: activeServer,
                        serverIndex: index,
                      })
                    }
                    accessoryRight={() => (
                      <Icon name="edit-outline" height={20} width={20} />
                    )}
                  />
                )}
              />
            )}
            ListFooterComponent={
              <ListItem
                title={() => (
                  <Text style={{ color: theme["text-primary-color"] }}>
                    {t("servers.switchServer.addServer")}
                  </Text>
                )}
                onPress={() => navigation.navigate("ServerManual")}
                style={{
                  borderColor: theme["text-primary-color"],
                  borderWidth: 2,
                  borderRadius: 16,
                  borderStyle: "dashed",
                }}
                accessoryLeft={() => (
                  <Icon
                    name="plus-outline"
                    height={30}
                    width={30}
                    fill={theme["text-primary-color"]}
                    style={{ paddingRight: 50 }}
                  />
                )}
              />
            }
          />
        </View>
      </SafeAreaView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
