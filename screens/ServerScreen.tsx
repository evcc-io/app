import React, { useCallback, useState } from "react";
import {
  Layout,
  BottomNavigation,
  BottomNavigationTab,
  Icon,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import { useAppContext } from "../components/AppContext";
import { verifyEvccServer } from "../utils/server";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "types";
import MdnsSearch from "components/MdnsSearch";
import StoredConnections from "components/StoredConnections";
import AddConnection from "components/AddConnection";

export default function ServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Server">) {
  const { updateConnection } = useAppContext();
  const [selectedTab, setSelectedTab] = useState(0);

  const selectServer = useCallback(
    async (url: string) => {
      try {
        const finalUrl = await verifyEvccServer({
          url,
        });
        updateConnection({ url: finalUrl });
      } catch (error) {
        Alert.alert((error as Error).message);
      }
    },
    [updateConnection],
  );

  return (
    <Layout style={{ flex: 1, paddingHorizontal: 16 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {selectedTab === 0 && <StoredConnections selectServer={selectServer} />}
        <MdnsSearch
          style={{ display: selectedTab === 1 ? "flex" : "none" }}
          selectServer={selectServer}
        />
        {selectedTab === 2 && (
          <AddConnection navigation={navigation} selectServer={selectServer} />
        )}

        <BottomNavigation selectedIndex={selectedTab} onSelect={setSelectedTab}>
          <BottomNavigationTab
            title="Home"
            icon={(props) => <Icon {...props} name="home" />}
          />
          <BottomNavigationTab
            title="Search"
            icon={(props) => <Icon {...props} name="search" />}
          />
          <BottomNavigationTab
            title="Add"
            icon={(props) => <Icon {...props} name="plus-square-outline" />}
          />
        </BottomNavigation>
      </SafeAreaView>
    </Layout>
  );
}
