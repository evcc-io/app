import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Permission is requested lazily on the first notification. If the user
// declines, messages are silently dropped — the web UI shows them anyway.
export async function showNotification(title: string, body: string) {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
