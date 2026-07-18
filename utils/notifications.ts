import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { encode } from "base-64";
import { Server } from "types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function getPushToken(): Promise<string | null> {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return null;
  const projectId = Constants.expoConfig?.extra?.["eas"]?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

function tokenEndpoint(server: Server) {
  return `${server.url.replace(/\/+$/, "")}/api/push/token`;
}

function headers(server: Server): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const { required, username, password } = server.basicAuth;
  if (required && username && password) {
    h["Authorization"] = `Basic ${encode(`${username}:${password}`)}`;
  }
  return h;
}

// Registers this device for push notifications with the given server.
// Returns false if permission was denied or registration failed.
export async function registerPushToken(server: Server): Promise<boolean> {
  try {
    const token = await getPushToken();
    if (!token) return false;
    const res = await fetch(tokenEndpoint(server), {
      method: "POST",
      headers: headers(server),
      body: JSON.stringify({ token }),
    });
    return res.ok;
  } catch (e) {
    console.log(`push registration failed for ${server.url}: ${e}`);
    return false;
  }
}

export async function unregisterPushToken(server: Server) {
  try {
    const token = await getPushToken();
    if (!token) return;
    await fetch(tokenEndpoint(server), {
      method: "DELETE",
      headers: headers(server),
      body: JSON.stringify({ token }),
    });
  } catch (e) {
    console.log(`push unregister failed for ${server.url}: ${e}`);
  }
}
