import React, { useCallback, useState } from "react";
import { Button, Layout, Text } from "@ui-kitten/components";
import { Connection } from "types";
import { t } from "i18next";
import LoadingIndicator from "./animations/LoadingIndicator";
import ServerList from "./ServerList";
import * as ServiceDiscovery from "@inthepocket/react-native-service-discovery";
import { StyleProp, ViewStyle } from "react-native";
import { getTitle } from "utils/utils";

interface MdnsSearchProps {
  style?: StyleProp<ViewStyle>;
  selectServer: (url: string) => Promise<void>;
}

export default function MdnsSearch({
  style,
  selectServer,
}: MdnsSearchProps): React.ReactElement {
  const [searching, setSearching] = useState(false);
  const [finished, setFinished] = useState(false);
  const [scanNotPossible, setScanNotPossible] = useState(false);
  const [found, setFound] = useState<Connection[]>([]);

  const getUrl = (service: ServiceDiscovery.Service) => {
    const scheme = service.type === "_http._tcp." ? "http" : "https";
    const hostName = service.hostName.endsWith(".")
      ? service.hostName.slice(0, -1)
      : service.hostName;
    const port =
      service.port === 80 || service.port === 443 ? "" : `:${service.port}`;
    return `${scheme}://${hostName}${port}`;
  };

  const toInstance = (service: ServiceDiscovery.Service): Connection => {
    return { title: getTitle(service.hostName), url: getUrl(service) };
  };

  const sameInstance = (a: Connection, b: Connection) => {
    return a.url === b.url;
  };

  const scanNetwork = useCallback(() => {
    // for multiple clicks on button
    ServiceDiscovery.stopSearch("http");
    ServiceDiscovery.stopSearch("https");

    setSearching(true);
    setFinished(false);
    setFound([]);

    const foundListener = ServiceDiscovery.addEventListener(
      "serviceFound",
      (service: ServiceDiscovery.Service) => {
        if (service.name === "evcc") {
          console.log("Found service ", service);
          setFound((found) => {
            const instance = toInstance(service);
            if (!found.some((f) => sameInstance(f, instance))) {
              return [...found, instance];
            } else {
              return found;
            }
          });
        }
      },
    );

    const lostListener = ServiceDiscovery.addEventListener(
      "serviceLost",
      (service: ServiceDiscovery.Service) => {
        if (service.name === "evcc") {
          console.log("Lost service ", service);
          setFound((found) => {
            const instance = toInstance(service);
            return found.filter((f) => !sameInstance(f, instance));
          });
        }
      },
    );

    (async () => {
      try {
        await Promise.all([
          ServiceDiscovery.startSearch("http"),
          ServiceDiscovery.startSearch("https"),
        ]);

        setTimeout(() => {
          ServiceDiscovery.stopSearch("http");
          ServiceDiscovery.stopSearch("https");

          foundListener.remove();
          lostListener.remove();

          setSearching(false);
          setFinished(true);
        }, 60 * 1000);
      } catch (e) {
        console.log("error", e);
        setSearching(false);
        setScanNotPossible(true);
      }
    })();
  }, []);

  return (
    <Layout style={{ flex: 1, ...style }}>
      <Text
        testID="serverScreenTitle"
        style={{ marginVertical: 32 }}
        category="h2"
      >
        {t("main.title")}
      </Text>
      <Text style={{ marginBottom: 32 }} category="p1">
        {t("main.description")}
      </Text>

      <Button
        style={{ marginTop: 8, marginBottom: 32 }}
        appearance="filled"
        size="giant"
        onPress={scanNetwork}
        accessoryLeft={searching ? LoadingIndicator : undefined}
        disabled={scanNotPossible}
        testID="serverSearchButton"
      >
        {t("servers.search.start")}
      </Button>
      {scanNotPossible ? (
        <Text style={{ marginVertical: 16 }} category="p1">
          {t("servers.search.notAvailable")}
        </Text>
      ) : null}
      {finished && found.length === 0 ? (
        <Text style={{ marginVertical: 16 }} category="p1">
          {t("servers.search.nothingFound")}
        </Text>
      ) : (
        <ServerList entries={Array.from(found)} onSelect={selectServer} />
      )}
    </Layout>
  );
}
