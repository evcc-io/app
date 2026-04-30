import React, { useRef, useState } from "react";
import { Text, Button, Input, CheckBox } from "@ui-kitten/components";
import { cleanServerUrl, sameServer, verifyEvccServer } from "../utils/server";
import LoadingIndicator from "./animations/LoadingIndicator";
import { useTranslation } from "react-i18next";
import { BasicAuth, Server } from "types";
import { useAppContext } from "./AppContext";

interface ServerFormProps {
  server: Server | undefined;
  serverSelected: (server: Server) => void;
  mode: "create" | "update";
}

export default function ServerForm({
  server,
  serverSelected,
  mode,
}: ServerFormProps) {
  const { t } = useTranslation();
  const { servers } = useAppContext();
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState("");

  const urlRef = useRef<Input | null>(null);
  const usernameRef = useRef<Input | null>(null);
  const passwordRef = useRef<Input | null>(null);

  const [internalServer, setInternalServer] = useState<Server | undefined>(
    server,
  );
  React.useEffect(() => setInternalServer(server), [server]);

  const setInternalTitle = (title: string) => {
    setInternalServer({
      title,
      url: internalServer?.url || "",
      basicAuth: internalServer?.basicAuth || {},
    });
  };
  const setInternalUrl = (url: string) => {
    setInternalServer({
      title: internalServer?.title,
      url,
      basicAuth: internalServer?.basicAuth || {},
    });
  };
  const setInternalAuth = (basicAuth: BasicAuth) => {
    setInternalServer({
      title: internalServer?.title,
      url: internalServer?.url || "",
      basicAuth,
    });
  };

  const validateAndSaveURL = async () => {
    if (inProgress) return;

    const cleanUrl = cleanServerUrl(internalServer?.url || "");
    setInternalUrl(cleanUrl);
    setError("");
    setInProgress(true);

    try {
      const finalUrl = await verifyEvccServer({
        url: cleanUrl,
        basicAuth: internalServer?.basicAuth || {},
      });

      const server = {
        title: internalServer?.title,
        url: finalUrl,
        basicAuth: internalServer?.basicAuth || {},
      };

      const sameServerCount = servers.filter((s) =>
        sameServer(server, s),
      ).length;
      if (sameServerCount > (mode === "create" ? 0 : 1)) {
        throw Error(t("servers.manually.serverExistsAlready"));
      }

      serverSelected(server);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setInProgress(false);
    }
  };

  return (
    <>
      <Input
        style={{ marginBottom: 16 }}
        placeholder={t("servers.manually.title")}
        value={internalServer?.title}
        size="large"
        status="basic"
        onChangeText={setInternalTitle}
        inputMode="text"
        keyboardType="default"
        autoCapitalize="none"
        onSubmitEditing={() => urlRef.current?.focus()}
        returnKeyType={"next"}
        autoCorrect={false}
        testID="serverFormTitle"
      />

      <Input
        style={{ marginBottom: 16 }}
        placeholder="http://evcc.local:7070/"
        value={internalServer?.url}
        size="large"
        status={error ? "danger" : "basic"}
        onChangeText={setInternalUrl}
        inputMode="url"
        keyboardType="url"
        autoCapitalize="none"
        onSubmitEditing={() =>
          internalServer?.basicAuth.required
            ? usernameRef.current?.focus()
            : validateAndSaveURL()
        }
        ref={urlRef}
        returnKeyType={internalServer?.basicAuth.required ? "next" : "go"}
        autoCorrect={false}
        testID="serverFormUrl"
      />

      <CheckBox
        style={{ marginTop: 8, marginBottom: 16 }}
        checked={internalServer?.basicAuth.required}
        onChange={(v) =>
          setInternalAuth({ ...internalServer?.basicAuth, required: v })
        }
        testID="serverFormAuth"
      >
        {t("servers.manually.authenticationRequired")}
      </CheckBox>

      {internalServer?.basicAuth.required && (
        <>
          <Input
            style={{ marginTop: 8, marginBottom: 16 }}
            size="large"
            status="basic"
            onChangeText={(v) =>
              setInternalAuth({ ...internalServer?.basicAuth, username: v })
            }
            value={internalServer?.basicAuth.username}
            inputMode="text"
            keyboardType="default"
            autoCapitalize="none"
            returnKeyType="next"
            autoCorrect={false}
            placeholder={t("servers.manually.user")}
            ref={usernameRef}
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID="serverFormAuthUser"
          />
          <Input
            style={{ marginTop: 8, marginBottom: 16 }}
            size="large"
            status="basic"
            onChangeText={(v) =>
              setInternalAuth({ ...internalServer?.basicAuth, password: v })
            }
            value={internalServer?.basicAuth.password}
            inputMode="text"
            keyboardType="default"
            autoCapitalize="none"
            returnKeyType="go"
            autoCorrect={false}
            placeholder={t("servers.manually.password")}
            secureTextEntry
            ref={passwordRef}
            onSubmitEditing={validateAndSaveURL}
            testID="serverFormAuthPassword"
          />
        </>
      )}

      <Button
        style={{ marginTop: 16, marginBottom: 16 }}
        appearance="filled"
        size="giant"
        disabled={internalServer?.url.length === 0}
        accessoryLeft={inProgress ? LoadingIndicator : undefined}
        onPress={validateAndSaveURL}
        testID="serverFormCheckAndSave"
      >
        {t("servers.manually.checkAndSave")}
      </Button>

      {error ? (
        <Text style={{ marginTop: 16 }} category="p1" status="danger">
          {error}
        </Text>
      ) : null}
    </>
  );
}
