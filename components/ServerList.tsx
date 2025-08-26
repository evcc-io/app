import React from "react";
import * as ServiceDiscovery from "@inthepocket/react-native-service-discovery";
import { Button, List, ListItem } from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

interface ServerListProps {
  entries: ServiceDiscovery.Service[];
  onSelect: (url: string) => Promise<void>;
}

export default function ServerList({
  entries = [],
  onSelect,
}: ServerListProps): React.ReactElement {
  const { t } = useTranslation();
  const renderItemAccessory = (url: string) => (
    <Button
      size="small"
      onPress={() => {
        onSelect(url);
      }}
    >
      {t("servers.select")}
    </Button>
  );

  return (
    <List<ServiceDiscovery.Service>
      style={styles.container}
      data={entries}
      renderItem={({ item }) => (
        <ListItem
          title={item.name}
          description={item.hostName}
          accessoryRight={() =>
            renderItemAccessory(
              `${item.type === "_http._tcp." ? "http" : "https"}://${item.hostName}:${item.port}`,
            )
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
