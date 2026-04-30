import React, { useRef, useState } from "react";
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
import { Animated, StyleSheet, View } from "react-native";
import Header from "components/Header";
import { sameServer } from "utils/server";

export default function ChangeServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ChangeServer">) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { activeServer, servers, setActiveServer } = useAppContext();

  const [textStatus, setTextStatus] = useState("warning");

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const startShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Layout style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          title={t("servers.switchServer.title")}
          showDone
          onDone={() => {
            if (activeServer !== undefined) {
              navigation.navigate("Main");
            } else {
              setTextStatus("danger");
              startShake();
            }
          }}
        />
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {activeServer === undefined && (
            <Animated.View
              style={{
                transform: [{ translateX: shakeAnim }],
              }}
            >
              <Text style={{ marginBottom: 32 }} status={textStatus}>
                Kein Server ausgewählt. Tippe auf einen Server, um auf ihn zu
                wechseln.
              </Text>
            </Animated.View>
          )}
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
                          marginRight: 8,
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
                        {t("servers.switchServer.current")}
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
                onPress={async () => {
                  await setActiveServer(item);
                  navigation.navigate("Main");
                }}
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
                        server: item,
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
