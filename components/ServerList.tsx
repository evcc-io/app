import React from "react";
import { Button, List, ListItem } from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Server } from "types";

interface ServerListProps {
  entries: Server[];
  onSelect: (server: Server) => Promise<void>;
}

export default function ServerList({
  entries = [],
  onSelect,
}: ServerListProps): React.ReactElement {
  const { t } = useTranslation();

  const renderItemAccessory = (index: number, server: Server) => {
    return (
      <Button
        size="small"
        onPress={() => {
          onSelect(server);
        }}
        testID={`serverSearchListItem${index}Button`}
      >
        {t("servers.select")}
      </Button>
    );
  };

  return (
    <List<Server>
      style={styles.container}
      data={entries}
      renderItem={({ index, item }) => {
        return (
          <ListItem
            title={item.title}
            description={item.url}
            accessoryRight={() => renderItemAccessory(index, item)}
            testID={"serverSearchListItem" + index}
          />
        );
      }}
      testID="serverSearchList"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
