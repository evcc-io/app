import React from "react";
import { Button, List, ListItem } from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

interface ServerListProps {
  entries: Array<{ title: string; url: string }>;
  onSelect?: (url: string) => Promise<void>;
}

export default function ServerList({
  entries = [],
  onSelect,
}: ServerListProps): React.ReactElement {
  const { t } = useTranslation();
  const renderItemAccessory = (url) => (
    <Button
      size="small"
      onPress={() => {
        onSelect(url);
      }}
    >
      {t("servers.select")}
    </Button>
  );

  const renderItem = ({ item }) => (
    <ListItem
      title={item.title}
      description={item.url}
      accessoryRight={() => renderItemAccessory(item.url)}
    />
  );

  return (
    <List style={styles.container} data={entries} renderItem={renderItem} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
