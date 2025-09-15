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
        return (
          <ListItem
            title={item.title}
            description={item.url}
            accessoryRight={() => renderItemAccessory(item.url)}
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
