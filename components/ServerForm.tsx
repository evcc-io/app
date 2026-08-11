import React, { useRef, useState } from "react";
import {
  Platform,
  Switch,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { cleanServerUrl, sameServer, verifyEvccServer } from "../utils/server";
import { useTranslation } from "react-i18next";
import { BasicAuth, Server } from "types";
import { useAppContext } from "./AppContext";
import ScanQRCodeButton from "./ScanQRCodeButton";
import AppText from "components/AppText";
import Button from "components/Button";
import { radius, useThemeColors } from "utils/theme";

interface ServerFormProps {
  server: Server | undefined;
  serverSelected: (server: Server) => void;
  mode: "create" | "update";
}

interface FormInputProps extends TextInputProps {
  danger?: boolean;
}

const FormInput = React.forwardRef<TextInput, FormInputProps>(
  function FormInput({ danger, style, ...props }, ref) {
    const colors = useThemeColors();
    return (
      <TextInput
        ref={ref}
        {...props}
        placeholderTextColor={colors.textHint}
        style={[
          {
            backgroundColor: colors.surface,
            borderColor: danger ? colors.danger : colors.border,
            borderWidth: 1,
            borderRadius: radius.card,
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === "ios" ? 14 : 10,
            fontSize: 16,
            color: colors.text,
          },
          style,
        ]}
      />
    );
  },
);

export default function ServerForm({
  server,
  serverSelected,
  mode,
}: ServerFormProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { servers } = useAppContext();
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState("");

  const urlRef = useRef<TextInput | null>(null);
  const usernameRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);

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
    if (!internalServer?.title?.trim()) return;
    if (!internalServer?.url) return;

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
      <FormInput
        style={{ marginBottom: 16 }}
        placeholder={t("servers.manually.title")}
        value={internalServer?.title}
        onChangeText={setInternalTitle}
        inputMode="text"
        keyboardType="default"
        autoCapitalize="none"
        onSubmitEditing={() => urlRef.current?.focus()}
        returnKeyType={"next"}
        autoCorrect={false}
        testID="serverFormTitle"
      />

      <FormInput
        style={{ marginBottom: 16 }}
        placeholder="http://evcc.local:7070/"
        value={internalServer?.url}
        danger={!!error}
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

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        <Switch
          value={!!internalServer?.basicAuth.required}
          onValueChange={(v) =>
            setInternalAuth({ ...internalServer?.basicAuth, required: v })
          }
          trackColor={{ true: colors.primary }}
          testID="serverFormAuth"
        />
        <AppText style={{ marginLeft: 12, flex: 1 }}>
          {t("servers.manually.authenticationRequired")}
        </AppText>
      </View>

      {internalServer?.basicAuth.required && (
        <>
          <FormInput
            style={{ marginTop: 8, marginBottom: 16 }}
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
          <FormInput
            style={{ marginTop: 8, marginBottom: 16 }}
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

      {error ? (
        <AppText style={{ marginBottom: 16 }} color="danger">
          {error}
        </AppText>
      ) : null}

      <Button
        style={{ marginTop: 8, marginBottom: 16 }}

        disabled={!internalServer?.url || !internalServer?.title?.trim()}
        loading={inProgress}
        onPress={validateAndSaveURL}
        testID="serverFormCheckAndSave"
      >
        {t("servers.manually.checkAndSave")}
      </Button>

      {mode === "create" && <ScanQRCodeButton shown="Addserverform" />}
    </>
  );
}
