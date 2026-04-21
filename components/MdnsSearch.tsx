import React, { useCallback, useState } from "react";
import { Button, Layout, Text } from "@ui-kitten/components";
import { Connection } from "types";
import { t } from "i18next";
import LoadingIndicator from "./animations/LoadingIndicator";
import ServerList from "./ServerList";
import * as ServiceDiscovery from "@inthepocket/react-native-service-discovery";

interface MdnsSearchProps {
  selectServer: (url: string) => Promise<void>;
}

export default function MdnsSearch({
  selectServer,
}: MdnsSearchProps): React.ReactElement {
  const [searching, setSearching] = useState(false);
  const [finished, setFinished] = useState(false);
  const [scanNotPossible, setScanNotPossible] = useState(false);
  const [found, setFound] = useState<Connection[]>([]);

  const getTitle = (service: ServiceDiscovery.Service) => {
    let title = service.hostName;
    for (const s of [".local.", ".fritz.box"]) {
      if (title.endsWith(s)) {
        title = title.slice(0, -1 * s.length);
        break;
      }
    }
    return title;
  };

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
    return { title: getTitle(service), url: getUrl(service) };
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
    <Layout>
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
