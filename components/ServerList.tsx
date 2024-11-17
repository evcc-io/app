import React from "react";
import { Button, List, ListItem } from "@ui-kitten/components";
import { StyleSheet } from "react-native";

interface ServerListProps {
  entries: { title: string; url: string }[];
  onSelect?: (url: string) => Promise<void>;
}

export default function ServerList({
  entries = [],
  onSelect,
}: ServerListProps): React.ReactElement {
  const renderItemAccessory = (url) => (
    <Button
      size="small"
      onPress={() => {
        onSelect(url);
      }}
    >
      Auswählen
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
