import React from "react";
import { Button, Icon, List, ListItem, useTheme } from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Connection } from "types";
import { getTitle } from "utils/utils";

interface ServerListProps {
  entries: Connection[];
  onSelect: (url: string) => Promise<void>;
}

export default function ServerList({
  entries = [],
  onSelect,
}: ServerListProps): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();

  const renderItemAccessory = (index: number, url: string) => {
    return (
      <>
        <Button
          size="small"
          appearance="ghost"
          onPress={() => {
            // onSelect(url);
          }}
          accessoryLeft={(props) => {
            return (
              <Icon
                {...props}
                fill={theme["text-primary-color"]}
                name="edit-outline"
                style={{ width: 32, height: 32 }}
              />
            );
          }}
          testID={`serverSearchListItem${index}Button`}
        />
        <Button
          size="small"
          onPress={() => {
            onSelect(url);
          }}
          testID={`serverSearchListItem${index}Button`}
        >
          {t("servers.select")}
        </Button>
      </>
    );
  };

  return (
    <List<Connection>
      style={styles.container}
      data={entries}
      renderItem={({ index, item }) => {
        return (
          <ListItem
            title={item.title || getTitle(item.url)}
            description={item.url}
            accessoryRight={() => renderItemAccessory(index, item.url)}
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
    flexGrow: 0,
    backgroundColor: "transparent",
  },
});
