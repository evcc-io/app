/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "watch-widget",
  name: "evccwatchwidget",
  bundleIdentifier: ".watchkitapp.widget",
  deploymentTarget: "10.0",
  frameworks: ["SwiftUI", "WidgetKit", "AppIntents"],
  // Keychain access group for the server list the watch app stores.
  entitlements: {
    "com.apple.security.application-groups": ["group.io.evcc.app"],
  },
};
