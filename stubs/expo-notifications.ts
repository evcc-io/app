// F-Droid stub for expo-notifications, applied at Metro bundle time: FCM/GMS is not
// permitted in F-Droid APKs. Permission resolves as denied, so registration never happens.

export const setNotificationHandler = () => {};
export const requestPermissionsAsync = () => Promise.resolve({ granted: false });
export const getExpoPushTokenAsync = () =>
  Promise.reject(new Error("push notifications unavailable"));
