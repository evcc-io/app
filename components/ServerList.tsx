import React from "react";
import { Button, List, ListItem } from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { EvccInstance } from "types";

interface ServerListProps {
  entries: EvccInstance[];
  onSelect: (url: string) => Promise<void>;
}

export default function ServerList({
  entries = [],
  onSelect,
}: ServerListProps): React.ReactElement {
  const { t } = useTranslation();

  const createUrl = (item: EvccInstance) => {
    const scheme = item.type === "_http._tcp." ? "http" : "https";
    const hostName = item.hostName.endsWith(".")
      ? item.hostName.slice(0, -1)
      : item.hostName;
    const port = item.port === 80 || item.port === 443 ? "" : `:${item.port}`;

    return `${scheme}://${hostName}${port}`;
  };

  const getHostname = (hostName: string) => {
    for (const s of [".local.", ".fritz.box"]) {
      if (hostName.endsWith(s)) {
        return hostName.slice(0, -1 * s.length);
      }
    }
    return hostName;
  };

  const renderItemAccessory = (url: string) => {
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
    <List<EvccInstance>
      style={styles.container}
      data={entries}
      renderItem={({ item }) => {
        const url = createUrl(item);

        return (
          <ListItem
            title={getHostname(item.hostName)}
            description={url}
            accessoryRight={() => renderItemAccessory(url)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
