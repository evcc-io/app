import React from "react";
import { useTheme } from "@ui-kitten/components";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { Server } from "types";
import IconHome from "@material-symbols/svg-400/rounded/home.svg";
import IconExpandCircleRight from "@material-symbols/svg-400/rounded/expand_circle_right-fill.svg";
import ServerEntry from "components/ServerEntry";

interface ServerListProps {
  entries: Server[];
  onSelect: (server: Server) => Promise<void>;
}

export default function ServerList({
  entries = [],
  onSelect,
}: ServerListProps): React.ReactElement {
  const theme = useTheme();
  const accentColor = theme["text-basic-color"];
  const { width } = useWindowDimensions();
  const numColumns = width >= 600 ? 2 : 1;
  const cellStyle = {
    width: `${100 / numColumns}%` as const,
    paddingHorizontal: 8,
    paddingBottom: 20,
  };

  return (
    <ScrollView style={{ flex: 1 }} testID="serverSearchList">
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginHorizontal: -8,
        }}
      >
        {entries.map((server, index) => (
          <View key={server.url ?? `server-${index}`} style={cellStyle}>
            <ServerEntry
              title={server.title}
              url={server.url}
              leftIcon={<IconHome width={28} height={28} fill={accentColor} />}
              rightIcon={
                <IconExpandCircleRight
                  width={28}
                  height={28}
                  fill={accentColor}
                />
              }
              onPress={() => {
                onSelect(server);
              }}
              testID={"serverSearchListItem" + index}
              selectTestID={"serverSearchListItem" + index + "Button"}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
