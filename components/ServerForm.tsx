import React, { useRef, useState } from "react";
import { Text, Button, Input, CheckBox } from "@ui-kitten/components";
import { cleanServerUrl, verifyEvccServer } from "../utils/server";
import LoadingIndicator from "./animations/LoadingIndicator";
import { useTranslation } from "react-i18next";
import { BasicAuth } from "types";

interface ServerFormProps {
  url: string;
  basicAuth: BasicAuth;
  serverSelected: (url: string, basicAuth: BasicAuth) => void;
}

export default function ServerForm({
  url,
  basicAuth,
  serverSelected,
}: ServerFormProps) {
  const { t } = useTranslation();
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState("");

  const usernameRef = useRef<Input | null>(null);
  const passwordRef = useRef<Input | null>(null);

  const [internalUrl, setInternalUrl] = useState(url);
  const [internalAuth, setInternalAuth] = useState(basicAuth);

  React.useEffect(() => setInternalUrl(url), [url]);
  React.useEffect(() => setInternalAuth(basicAuth), [basicAuth]);

  const validateAndSaveURL = async () => {
    if (inProgress) return;

    const cleanUrl = cleanServerUrl(internalUrl);
    setInternalUrl(cleanUrl);
    setError("");
    setInProgress(true);

    try {
      const finalUrl = await verifyEvccServer(cleanUrl, internalAuth);
      serverSelected(finalUrl, internalAuth);
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
        value={internalUrl}
        size="large"
        status={error ? "danger" : "basic"}
        onChangeText={setInternalUrl}
        inputMode="url"
        keyboardType="url"
        autoCapitalize="none"
        onSubmitEditing={() =>
          internalAuth.required
            ? usernameRef.current?.focus()
            : validateAndSaveURL()
        }
        returnKeyType={internalAuth.required ? "next" : "go"}
        autoCorrect={false}
        testID="serverFormUrl"
      />

      <CheckBox
        style={{ marginTop: 8, marginBottom: 16 }}
        checked={internalAuth.required}
        onChange={(v) => setInternalAuth({ ...internalAuth, required: v })}
        testID="serverFormAuth"
      >
        {t("servers.manually.authenticationRequired")}
      </CheckBox>

      {internalAuth.required && (
        <>
          <Input
            style={{ marginTop: 8, marginBottom: 16 }}
            size="large"
            status="basic"
            onChangeText={(v) =>
              setInternalAuth({ ...internalAuth, username: v })
            }
            value={internalAuth.username}
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
              setInternalAuth({ ...internalAuth, password: v })
            }
            value={internalAuth.password}
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
        disabled={internalUrl.length === 0}
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
