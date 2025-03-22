import React, { useState, useEffect } from "react";
import { Text, Button, Input, CheckBox } from "@ui-kitten/components";
import { cleanServerUrl, verifyEvccServer } from "../utils/server";
import LoadingIndicator from "../components/LoadingIndicator";
import { BasicAuth } from "../interfaces/basicAuth";
import { useTranslation } from "react-i18next";

interface ServerFormProps {
  url?: string;
  basicAuth: BasicAuth;
  onChange: (url: string, baiscAuth: BasicAuth) => void;
}

export default function ServerForm({
  url: initalUrl = "",
  basicAuth: initialBasicAuth = { required: false },
  onChange,
}: ServerFormProps) {
  const { t } = useTranslation();
  const [inProgress, setInProgress] = useState(false);
  const [url, setUrl] = useState(initalUrl);
  const [error, setError] = useState("");
  const [basicAuth, setBasicAuth] = useState(initialBasicAuth);

  const inputRef = React.createRef<Input>();
  const usernameRef = React.createRef<Input>();
  const passwordRef = React.createRef<Input>();

  const validateAndSaveURL = async () => {
    if (inProgress) {
      return;
    }
    const cleanUrl = cleanServerUrl(url);
    setUrl(cleanUrl);
    setError("");
    setInProgress(true);

    try {
      const finalUrl = await verifyEvccServer(cleanUrl, basicAuth);
      onChange(finalUrl, basicAuth);
    } catch (error) {
      setError(error.message);
    } finally {
      setInProgress(false);
    }
  };

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const setBasicAuthRequired = (value: boolean) =>
    setBasicAuth({ ...basicAuth, required: value });
  const setBasicAuthUsername = (value: string) =>
    setBasicAuth({ ...basicAuth, username: value });
  const setBasicAuthPassword = (value: string) =>
    setBasicAuth({ ...basicAuth, password: value });

  return (
    <>
      <Input
        style={{ marginBottom: 16 }}
        placeholder="http://evcc.local:7070/"
        value={url}
        size="large"
        status={error ? "danger" : "basic"}
        ref={inputRef}
        onChangeText={(nextValue) => setUrl(nextValue)}
        inputMode="url"
        keyboardType="url"
        autoCapitalize="none"
        onSubmitEditing={() =>
          basicAuth.required
            ? usernameRef.current.focus()
            : validateAndSaveURL()
        }
        returnKeyType={basicAuth.required ? "next" : "go"}
        autoCorrect={false}
      />
      <CheckBox
        style={{ marginTop: 8, marginBottom: 16 }}
        checked={basicAuth.required}
        onChange={(nextValue) => setBasicAuthRequired(nextValue)}
      >
        {t("servers.manually.authenticationRequired")}
      </CheckBox>
      {basicAuth.required && (
        <>
          <Input
            style={{ marginTop: 8, marginBottom: 16 }}
            size="large"
            status="basic"
            onChangeText={(nextValue) => setBasicAuthUsername(nextValue)}
            value={basicAuth.username}
            inputMode="text"
            keyboardType="default"
            autoCapitalize="none"
            returnKeyType="next"
            autoCorrect={false}
            placeholder={t("servers.manually.user")}
            ref={usernameRef}
            onSubmitEditing={() => passwordRef.current.focus()}
          />
          <Input
            style={{ marginTop: 8, marginBottom: 16 }}
            size="large"
            status="basic"
            onChangeText={(nextValue) => setBasicAuthPassword(nextValue)}
            value={basicAuth.password}
            inputMode="text"
            keyboardType="default"
            autoCapitalize="none"
            returnKeyType="go"
            autoCorrect={false}
            placeholder={t("servers.manually.password")}
            secureTextEntry={true}
            ref={passwordRef}
            onSubmitEditing={validateAndSaveURL}
          />
        </>
      )}

      <Button
        style={{ marginTop: 16, marginBottom: 16 }}
        appearance="filled"
        size="giant"
        disabled={url.length === 0}
        accessoryLeft={inProgress ? LoadingIndicator : null}
        onPress={validateAndSaveURL}
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
