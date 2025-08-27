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
  const renderItemAccessory = (item: ServiceDiscovery.Service) => {
    const url = `${item.type === "_http._tcp." ? "http" : "https"}://${item.hostName.endsWith(".") ? item.hostName.slice(0, -1) : item.hostName}:${item.port}`;

    return (
      <Button
        size="small"
        onPress={() => {
          onSelect(url);
        }}
      >
        {t("servers.select")}
      </Button>
    );
  };

  return (
    <List<ServiceDiscovery.Service>
      style={styles.container}
      data={entries}
      renderItem={({ item }) => (
        <ListItem
          title={item.name}
          description={item.hostName}
          accessoryRight={() => renderItemAccessory(item)}
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
