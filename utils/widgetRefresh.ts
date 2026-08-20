import { Platform } from "react-native";

interface EvccWidgetNativeModule {
  refresh(): void;
}

// The native module (modules/evcc-widget) is autolinked and registered under
// the name "EvccWidget"; resolve it by name rather than importing the local
// module's source, which Metro's local-module autolinking does not allow.
let native: EvccWidgetNativeModule | null = null;
if (Platform.OS === "android") {
  try {
    const { requireNativeModule } = require("expo");
    native = requireNativeModule("EvccWidget");
  } catch {
    native = null;
  }
}

/**
 * Force an immediate redraw of the Android home-screen widgets, so a changed
 * server list is reflected without waiting for their periodic refresh. No-op on
 * other platforms (iOS uses WidgetKit's reloadWidget from widgetSync).
 */
export function refreshWidgets(): void {
  try {
    native?.refresh();
  } catch {
    // best-effort; widget refresh is non-critical
  }
}
