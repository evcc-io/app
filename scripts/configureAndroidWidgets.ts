import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
} from "expo/config-plugins";
import fs from "fs";
import path from "path";

const withAndroidWidgets: ConfigPlugin = (config) => {
  let widgetNames: string[] = [];

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      widgetNames = (
        await fs.promises.readdir(
          path.resolve(
            config.modRequest.projectRoot,
            "android-widgets",
            "java",
            "io",
            "evcc",
            "android",
          ),
        )
      )
        .filter((file) => file.endsWith("Widget.kt"))
        .map((file) => path.basename(file, ".kt"));

      console.log(
        `» Android widgets: Found ${widgetNames.length} widget${widgetNames.length === 1 ? "" : "(s)"}: ${widgetNames.join(", ")}`,
      );
      console.log(`» Android widgets: Copying files to android/app/src/main`);

      await fs.promises.cp(
        path.resolve(config.modRequest.projectRoot, "android-widgets"),
        path.join(config.modRequest.platformProjectRoot, "app", "src", "main"),
        { recursive: true },
      );

      return config;
    },
  ]);

  return withAndroidManifest(config, (config) => {
    console.log(
      `» Android widgets: Registering widgets in AndroidManifest.xml`,
    );

    const toSnakeCase = (value: string) =>
      value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );

    application.receiver = (application.receiver || []).concat(
      widgetNames.map((w) => ({
        $: {
          "android:name": `io.evcc.android.${w}`,
          "android:exported": "false",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.appwidget.action.APPWIDGET_UPDATE",
                },
              },
            ],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.appwidget.provider",
              "android:resource": `@xml/${toSnakeCase(w)}_info`,
            },
          },
        ],
      })),
    );

    application.activity = (application.activity || []).concat(
      widgetNames.map((w) => ({
        $: {
          "android:name": `io.evcc.android.${w}ConfigureActivity`,
          "android:exported": "true",
          "android:theme": "@style/Theme.Evcc.WidgetConfigDialog",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name":
                    "android.appwidget.action.APPWIDGET_CONFIGURE",
                },
              },
            ],
          },
        ],
      })),
    );

    return config;
  });
};

export default createRunOncePlugin(withAndroidWidgets, "android-widgets");
