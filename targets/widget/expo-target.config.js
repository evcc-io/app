/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  name: "evccwidget",
  // Widget extension can require a newer OS than the host app (16.4):
  // AppIntentConfiguration + containerBackground need iOS 17.
  deploymentTarget: "17.0",
  frameworks: ["SwiftUI", "WidgetKit", "Charts", "AppIntents"],
  // Shared App Group so the widget can read the server list the app writes.
  // Must match ios.entitlements in app.config.ts.
  entitlements: {
    "com.apple.security.application-groups": ["group.io.evcc.app"],
  },
};
