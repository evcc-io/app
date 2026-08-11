import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import IconHome from "@material-symbols/svg-400/rounded/home.svg";
import IconCheckCircle from "@material-symbols/svg-400/rounded/check_circle-fill.svg";
import IconEdit from "@material-symbols/svg-400/rounded/edit.svg";
import IconAdd from "@material-symbols/svg-400/rounded/add.svg";
import { useTranslation } from "react-i18next";
import { useAppContext } from "components/AppContext";
import { radius, useThemeColors } from "utils/theme";
import { sameServer } from "utils/server";
import AppText from "components/AppText";
import ServerCard from "components/ServerCard";
import ServerEntry, { SERVER_ENTRY_MIN_HEIGHT } from "components/ServerEntry";
import { Server } from "types";

export interface SwitchServerListProps {
  onSelect: (server: Server) => void;
  onEdit: (server: Server, index: number) => void;
  onAdd: () => void;
}

export default function SwitchServerList({
  onSelect,
  onEdit,
  onAdd,
}: SwitchServerListProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { activeServer, servers } = useAppContext();
  const { width } = useWindowDimensions();
  const numColumns = width >= 600 ? 2 : 1;
  const cellStyle = {
    width: `${100 / numColumns}%` as const,
    paddingHorizontal: 8,
    paddingBottom: 20,
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 8 }}>
      <ScrollView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {servers.map((server, index) => {
            const isActive = sameServer(server, activeServer);
            return (
              <View
                key={server.url ?? `server-${index}`}
                style={cellStyle}
                testID={`server${index}`}
              >
                <ServerCard selected={isActive}>
                  <ServerEntry
                    title={server.title}
                    url={server.url}
                    leftIcon={
                      isActive ? (
                        <IconCheckCircle
                          testID={`selectServer${index}`}
                          width={24}
                          height={24}
                          fill={colors.primary}
                        />
                      ) : (
                        <IconHome
                          testID={`selectServer${index}`}
                          width={24}
                          height={24}
                          fill={colors.text}
                        />
                      )
                    }
                    rightIcon={
                      <IconEdit
                        testID={`editServer${index}Icon`}
                        width={24}
                        height={24}
                        fill={colors.textHint}
                      />
                    }
                    onPress={() => onSelect(server)}
                    onRightPress={() => onEdit(server, index)}
                  />
                </ServerCard>
              </View>
            );
          })}
          <View style={cellStyle}>
            <Pressable
              onPress={onAdd}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderColor: colors.border,
                borderWidth: 1,
                borderStyle: pressed ? "solid" : "dashed",
                borderRadius: radius.card,
                minHeight: SERVER_ENTRY_MIN_HEIGHT,
                paddingHorizontal: 16,
              })}
            >
              <IconAdd
                testID="addServerIcon"
                width={28}
                height={28}
                fill={colors.text}
                style={{ marginRight: 8 }}
              />
              <AppText variant="s1">
                {t("servers.switchServer.addServer")}
              </AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
