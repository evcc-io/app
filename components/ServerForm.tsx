import React, { useState, useEffect } from "react";
import { Text, Button, Input, CheckBox } from "@ui-kitten/components";
import { cleanServerUrl, verifyEvccServer } from "../utils/server";
import LoadingIndicator from "../components/LoadingIndicator";
import { TouchableWithoutFeedback } from "react-native";
import { BasicAuthInformation } from "../interfaces/basic-auth-information";

interface ServerFormProps {
  url?: string;
  basicAuth: BasicAuthInformation;
  onChange: (url: string, baiscAuth: BasicAuthInformation) => void;
}

export default function ServerForm({
  url: initalUrl = "",
  basicAuth: initialBasicAuth = {
    basicAuthRequired: false,
  } as BasicAuthInformation,
  onChange,
}: ServerFormProps) {
  const [inProgress, setInProgress] = useState(false);
  const [url, setUrl] = useState(initalUrl);
  const [error, setError] = useState("");
  const [basicAuth, setBasicAuth] = useState(initialBasicAuth);
  const [basicAuthPasswordShow, setBasicAuthPasswordShow] = useState(false);

  const inputRef = React.createRef<Input>();
  const usernameRef = React.createRef<Input>();
  const passwordRef = React.createRef<Input>();

  const validateUsername = () =>
    basicAuth.basicAuthRequired &&
    basicAuth.username != null &&
    basicAuth.username.length > 0;
  const validatePassword = () =>
    basicAuth.basicAuthRequired &&
    basicAuth.password != null &&
    basicAuth.password.length > 0;

  const validateAndSaveURL = async () => {
    if (inProgress) {
      return;
    }
    const cleanUrl = cleanServerUrl(url);
    setUrl(cleanUrl);
    setError("");
    setInProgress(true);

    try {
      await verifyEvccServer(cleanUrl, basicAuth);
      onChange(cleanUrl, basicAuth);
    } catch (error) {
      if (error.message == "Missing Authentication") {
        setError("Fehlende oder falsche Anmeldung");
        setBasicAuthRequired(true);
        return;
      }
      setError(error.message);
    } finally {
      setInProgress(false);
    }
  };

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const setBasicAuthRequired = (value: boolean) =>
    setBasicAuth({ ...basicAuth, basicAuthRequired: value });
  const setBasicAuthUserName = (value: string) =>
    setBasicAuth({ ...basicAuth, username: value });
  const setBasicAuthPassword = (value: string) =>
    setBasicAuth({ ...basicAuth, password: value });

  return (
    <>
      <Input
        style={{ marginBottom: 10 }}
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
          basicAuth.basicAuthRequired
            ? usernameRef.current.focus()
            : validateAndSaveURL()
        }
        returnKeyType={basicAuth.basicAuthRequired ? "next" : "go"}
        autoCorrect={false}
      />
      <CheckBox
        checked={basicAuth.basicAuthRequired}
        onChange={(nextValue) => setBasicAuthRequired(nextValue)}
      >
        Anmeldung erforderlich
      </CheckBox>
      {basicAuth.basicAuthRequired && (
        <Input
          style={{ marginTop: 5 }}
          size="large"
          status={validateUsername() ? "basic" : "danger"}
          onChangeText={(nextValue) => setBasicAuthUserName(nextValue)}
          value={basicAuth.username}
          inputMode="text"
          keyboardType="default"
          autoCapitalize="none"
          returnKeyType="next"
          autoCorrect={false}
          placeholder="Benutzer"
          label="Benutzer"
          ref={usernameRef}
          onSubmitEditing={() => passwordRef.current.focus()}
        />
      )}
      {basicAuth.basicAuthRequired && (
        <Input
          style={{ marginTop: 5 }}
          size="large"
          status={validatePassword() ? "basic" : "danger"}
          onChangeText={(nextValue) => setBasicAuthPassword(nextValue)}
          value={basicAuth.password}
          inputMode="text"
          keyboardType="default"
          autoCapitalize="none"
          returnKeyType="go"
          autoCorrect={false}
          placeholder="Passwort"
          secureTextEntry={!basicAuthPasswordShow}
          ref={passwordRef}
          label="Passwort"
          onSubmitEditing={validateAndSaveURL}
        />
      )}

      <Button
        style={{ marginTop: 8, marginBottom: 16 }}
        appearance="filled"
        size="giant"
        disabled={url.length === 0}
        accessoryLeft={inProgress ? LoadingIndicator : null}
        onPress={validateAndSaveURL}
      >
        Prüfen und speichern
      </Button>
      {error ? (
        <Text style={{ marginTop: 16 }} category="p1">
          {error}
        </Text>
      ) : null}
    </>
  );
}
