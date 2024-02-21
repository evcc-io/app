import React from "react";
import { Button, List, ListItem } from "@ui-kitten/components";
import { StyleSheet } from "react-native";

export default function ServerList({
  entries = [],
  onSelect = () => {},
}): React.ReactElement {
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
    maxHeight: 192,
    backgroundColor: "transparent",
  },
});
