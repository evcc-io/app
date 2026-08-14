import { useCallback, useEffect, useRef, useState } from "react";
import * as ServiceDiscovery from "@inthepocket/react-native-service-discovery";
import { Alert, Animated, Easing, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IconHome from "@material-symbols/svg-400/rounded/home.svg";
import IconSearchOff from "@material-symbols/svg-400/rounded/search_off.svg";
import IconCheck from "@material-symbols/svg-400/rounded/check.svg";
import IconCheckCircle from "@material-symbols/svg-400/rounded/check_circle-fill.svg";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Server } from "types";
import { useAppContext } from "components/AppContext";
import { fetchOrGetTitle, sameServer, verifyEvccServer } from "utils/server";
import AppText from "components/AppText";
import Button from "components/Button";
import TextLink from "components/TextLink";
import ServerCard from "components/ServerCard";
import ServerEntry from "components/ServerEntry";
import SearchPulse from "components/SearchPulse";
import StatusCircle from "components/StatusCircle";
import { useThemeColors } from "utils/theme";
import { testingEnvironment } from "helper/launchArguments";

const SEARCH_DURATION = 60 * 1000;
export default function SearchServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "SearchServer">) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { addServer, setActiveServer } = useAppContext();

  const [found, setFound] = useState<Server[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [notPossible, setNotPossible] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const badgeProgress = useRef(new Animated.Value(0)).current;

  const getUrl = (service: ServiceDiscovery.Service) => {
    const scheme = service.type === "_http._tcp." ? "http" : "https";
    const hostName = service.hostName.endsWith(".")
      ? service.hostName.slice(0, -1)
      : service.hostName;
    const port =
      service.port === 80 || service.port === 443 ? "" : `:${service.port}`;
    return `${scheme}://${hostName}${port}`;
  };

  const toServer = (service: ServiceDiscovery.Service): Server => {
    return { url: getUrl(service), basicAuth: {} };
  };

  const scanNetwork = useCallback(() => {
    let timeout: NodeJS.Timeout | undefined;
    ServiceDiscovery.stopSearch("http");
    ServiceDiscovery.stopSearch("https");

    setFinished(false);
    setFound([]);
    setSelectedIndex(0);

    // prefix match: mDNS renames conflicting instances ("evcc (2)", "evcc @ host")
    const isEvcc = (service: ServiceDiscovery.Service) =>
      service.name.toLowerCase().startsWith("evcc");

    const foundListener = ServiceDiscovery.addEventListener(
      "serviceFound",
      async (service: ServiceDiscovery.Service) => {
        if (isEvcc(service)) {
          const server = toServer(service);
          server.title = await fetchOrGetTitle(server);

          setFound((found) => {
            if (!found.some((f) => sameServer(f, server))) {
              return [...found, server];
            } else {
              return found;
            }
          });
        }
      },
    );

    const lostListener = ServiceDiscovery.addEventListener(
      "serviceLost",
      async (service: ServiceDiscovery.Service) => {
        if (isEvcc(service)) {
          const server = toServer(service);
          setFound((found) => found.filter((f) => !sameServer(f, server)));
        }
      },
    );

    (async () => {
      try {
        await Promise.all([
          ServiceDiscovery.startSearch("http"),
          ServiceDiscovery.startSearch("https"),
        ]);

        timeout = setTimeout(() => {
          ServiceDiscovery.stopSearch("http");
          ServiceDiscovery.stopSearch("https");
          foundListener.remove();
          lostListener.remove();
          setFinished(true);
        }, SEARCH_DURATION);
      } catch (e) {
        console.log("error", e);
        setNotPossible(true);
      }
    })();

    return () => {
      clearTimeout(timeout);
      ServiceDiscovery.stopSearch("http");
      ServiceDiscovery.stopSearch("https");
      foundListener.remove();
      lostListener.remove();
    };
  }, []);

  useEffect(() => scanNetwork(), [scanNetwork]);

  // success badge pop-in once the first instance appears
  const hasResult = found.length > 0;
  useEffect(() => {
    if (!hasResult || testingEnvironment()) {
      badgeProgress.setValue(hasResult ? 1 : 0);
      return;
    }
    Animated.timing(badgeProgress, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hasResult, badgeProgress]);

  const connect = useCallback(
    async (server: Server) => {
      setConnecting(true);
      try {
        const finalUrl = await verifyEvccServer(server);
        const verifiedServer = { ...server, url: finalUrl };
        await addServer(verifiedServer);
        await setActiveServer(verifiedServer);
      } catch (error) {
        Alert.alert((error as Error).message);
      } finally {
        setConnecting(false);
      }
    },
    [addServer, setActiveServer],
  );

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const manualEntry = useCallback(() => {
    navigation.navigate("AddServer");
  }, [navigation]);

  const selected: Server | undefined = found[selectedIndex] ?? found[0];
  const multi = found.length > 1;

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: colors.background,
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {notPossible || (finished && !hasResult) ? (
          <>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StatusCircle color={colors.surface}>
                <IconSearchOff width={60} height={60} fill={colors.textHint} />
              </StatusCircle>
              <AppText style={{ textAlign: "center" }}>
                {t(
                  notPossible
                    ? "servers.search.notAvailable"
                    : "servers.search.nothingFound",
                )}
              </AppText>
            </View>
            <View style={{ paddingBottom: 8, gap: 12 }}>
              <Button onPress={manualEntry} testID="searchManualEntry">
                {t("servers.manually.specify")}
              </Button>
              {!notPossible ? (
                <Button
                  variant="outline"
                  onPress={scanNetwork}
                  testID="searchRetry"
                >
                  {t("servers.search.tryAgain")}
                </Button>
              ) : null}
              <TextLink onPress={goBack} testID="searchCancel">
                {t("servers.search.cancel")}
              </TextLink>
            </View>
          </>
        ) : hasResult ? (
          <>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
              testID="searchResult"
            >
              <Animated.View
                style={{
                  opacity: badgeProgress,
                  transform: [
                    {
                      scale: badgeProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1],
                      }),
                    },
                  ],
                }}
              >
                <StatusCircle color={colors.primary}>
                  <IconCheck width={72} height={72} fill={colors.onPrimary} />
                </StatusCircle>
              </Animated.View>
              <AppText variant="h3" style={{ textAlign: "center" }}>
                {multi
                  ? t("servers.search.foundMany", { count: found.length })
                  : t("servers.search.foundOne")}
              </AppText>
              {multi ? (
                <AppText
                  color="hint"
                  style={{ fontSize: 14, marginTop: 8, textAlign: "center" }}
                >
                  {t("servers.search.selectHelper")}
                </AppText>
              ) : null}
              <View style={{ alignSelf: "stretch", marginTop: 28, gap: 10 }}>
                {found.map((server, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <ServerCard
                      key={server.url ?? `server-${index}`}
                      selected={multi && isSelected}
                    >
                      <ServerEntry
                        title={server.title}
                        url={server.url}
                        leftIcon={
                          multi && isSelected ? (
                            <IconCheckCircle
                              width={24}
                              height={24}
                              fill={colors.primary}
                            />
                          ) : (
                            <IconHome
                              width={24}
                              height={24}
                              fill={colors.text}
                            />
                          )
                        }
                        onPress={
                          multi ? () => setSelectedIndex(index) : undefined
                        }
                      />
                    </ServerCard>
                  );
                })}
              </View>
            </View>
            <View style={{ paddingBottom: 8 }}>
              <Button
                loading={connecting}
                onPress={() => selected && connect(selected)}
                testID="searchConnect"
              >
                {t("servers.search.connect")}
              </Button>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 20,
                  marginTop: 12,
                }}
              >
                <TextLink onPress={scanNetwork} testID="searchRetry">
                  {t("servers.search.tryAgain")}
                </TextLink>
                <TextLink onPress={manualEntry} testID="searchManualEntry">
                  {t("servers.manually.specify")}
                </TextLink>
              </View>
            </View>
          </>
        ) : (
          <>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
              testID="searchInProgress"
            >
              <SearchPulse />
              <AppText
                variant="h3"
                style={{ marginTop: 36, textAlign: "center" }}
              >
                {t("servers.search.inProgress")}
              </AppText>
              <AppText
                color="hint"
                style={{ marginTop: 8, textAlign: "center" }}
              >
                {t("servers.search.hint")}
              </AppText>
            </View>
            <View style={{ paddingBottom: 8 }}>
              <Button
                variant="outline"
                status="basic"
                onPress={goBack}
                testID="searchCancel"
              >
                {t("servers.search.cancel")}
              </Button>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
