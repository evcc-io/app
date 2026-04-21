import { Layout, Text } from "@ui-kitten/components";
import { t } from "i18next";
import React from "react";
import ServerList from "./ServerList";
import { useAppContext } from "./AppContext";

interface StoredConnectionsProps {
  selectServer: (url: string) => Promise<void>;
}

export default function StoredConnections({
  selectServer,
}: StoredConnectionsProps): React.ReactElement {
  const { storedConnections } = useAppContext();

  return (
    <Layout style={{ flex: 1 }}>
      <Text
        testID="serverScreenTitle"
        style={{ marginVertical: 32 }}
        category="h2"
      >
        {t("servers.stored.title")}
      </Text>

      <Layout style={{ flex: 1 }}>
        {storedConnections.length > 0 && (
          <Layout>
            <Text style={{ marginBottom: 32 }} category="p1">
              {t("servers.stored.descriptionOpen")}
            </Text>
            <ServerList entries={storedConnections} onSelect={selectServer} />
          </Layout>
        )}
      </Layout>
    </Layout>
  );
}
