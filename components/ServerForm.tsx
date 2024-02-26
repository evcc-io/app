import React, { useState, useEffect } from "react";
import { Text, Button, Input } from "@ui-kitten/components";
import { cleanServerUrl, verifyEvccServer } from "../utils/server";
import LoadingIndicator from "../components/LoadingIndicator";

export default function ServerForm({ url: initalUrl = "", onChange }) {
  const [inProgress, setInProgress] = useState(false);
  const [url, setUrl] = useState(initalUrl);
  const [error, setError] = useState("");
  const inputRef = React.createRef();

  const validateAndSaveURL = async () => {
    if (inProgress) {
      return;
    }
    const cleanUrl = cleanServerUrl(url);
    setUrl(cleanUrl);
    setError("");
    setInProgress(true);

    try {
      console.log("validating", cleanUrl);
      await verifyEvccServer(cleanUrl);
      onChange(cleanUrl);
    } catch (error) {
      setError(error.message);
    } finally {
      setInProgress(false);
    }
  };

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <>
      <Input
        style={{ marginBottom: 32 }}
        placeholder="http://evcc.local:7070/"
        value={url}
        size="large"
        status={error ? "danger" : "basic"}
        ref={inputRef}
        onChangeText={(nextValue) => setUrl(nextValue)}
        inputMode="url"
        keyboardType="url"
        autoCapitalize="none"
        onSubmitEditing={validateAndSaveURL}
        returnKeyType="go"
        autoCorrect={false}
      />
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
