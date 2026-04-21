import React, { useRef, useState } from "react";
import { Text, Button, Input, CheckBox } from "@ui-kitten/components";
import { cleanServerUrl, verifyEvccServer } from "../utils/server";
import LoadingIndicator from "./animations/LoadingIndicator";
import { useTranslation } from "react-i18next";
import { BasicAuth, Connection } from "types";

interface ServerFormProps {
  connection: Connection | undefined;
  serverSelected: (connection: Connection) => void;
}

export default function ServerForm({
  connection,
  serverSelected,
}: ServerFormProps) {
  const { t } = useTranslation();
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState("");

  const usernameRef = useRef<Input | null>(null);
  const passwordRef = useRef<Input | null>(null);

  const [internalConnection, setInternalConnection] = useState<
    Connection | undefined
  >(connection);
  React.useEffect(() => setInternalConnection(connection), [connection]);

  const setInternalUrl = (url: string) => {
    setInternalConnection({
      url,
      basicAuth: internalConnection?.basicAuth,
    });
  };
  const setInternalAuth = (basicAuth: BasicAuth) => {
    setInternalConnection({
      url: internalConnection?.url || "",
      basicAuth,
    });
  };

  const validateAndSaveURL = async () => {
    if (inProgress) return;

    const cleanUrl = cleanServerUrl(internalConnection?.url || "");
    setInternalUrl(cleanUrl);
    setError("");
    setInProgress(true);

    try {
      const finalUrl = await verifyEvccServer({
        url: cleanUrl,
        basicAuth: internalConnection?.basicAuth,
      });
      serverSelected({
        url: finalUrl,
        basicAuth: internalConnection?.basicAuth,
      });
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
        placeholder="http://evcc.local:7070/"
        value={internalConnection?.url}
        size="large"
        status={error ? "danger" : "basic"}
        onChangeText={setInternalUrl}
        inputMode="url"
        keyboardType="url"
        autoCapitalize="none"
        onSubmitEditing={() =>
          internalConnection?.basicAuth?.required
            ? usernameRef.current?.focus()
            : validateAndSaveURL()
        }
        returnKeyType={internalConnection?.basicAuth?.required ? "next" : "go"}
        autoCorrect={false}
        testID="serverFormUrl"
      />

      <CheckBox
        style={{ marginTop: 8, marginBottom: 16 }}
        checked={internalConnection?.basicAuth?.required}
        onChange={(v) =>
          setInternalAuth({ ...internalConnection?.basicAuth, required: v })
        }
        testID="serverFormAuth"
      >
        {t("servers.manually.authenticationRequired")}
      </CheckBox>

      {internalConnection?.basicAuth?.required && (
        <>
          <Input
            style={{ marginTop: 8, marginBottom: 16 }}
            size="large"
            status="basic"
            onChangeText={(v) =>
              setInternalAuth({ ...internalConnection?.basicAuth, username: v })
            }
            value={internalConnection?.basicAuth.username}
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
              setInternalAuth({ ...internalConnection?.basicAuth, password: v })
            }
            value={internalConnection?.basicAuth.password}
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
        disabled={internalConnection?.url.length === 0}
        accessoryLeft={inProgress ? LoadingIndicator : undefined}
        onPress={validateAndSaveURL}
        testID="serverFormCheckAndSave"
      >
        {t("servers.manually.checkAndSave")}
      </Button>

      {error ? (
        <Text style={{ marginTop: 16 }} category="p1">
          {error}
        </Text>
      ) : null}
    </>
  );
}
