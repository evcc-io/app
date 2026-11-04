/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "watch",
  name: "evccwatch",
  displayName: "evcc",
  bundleIdentifier: ".watchkitapp",
  icon: "../../assets/icon-light.png",
  // watchOS 10: vertical page TabView, containerBackground, Smart Stack.
  deploymentTarget: "10.0",
  frameworks: ["SwiftUI", "WatchConnectivity", "WidgetKit"],
  // Also used as keychain access group, shared with the complication.
  entitlements: {
    "com.apple.security.application-groups": ["group.io.evcc.app"],
  },
};
