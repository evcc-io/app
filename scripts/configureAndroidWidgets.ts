import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withAppBuildGradle,
} from "expo/config-plugins";
import fs from "fs";
import path from "path";

const addDependencies: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (gradleConfig) => {
    console.log("» Android widgets: Add dependencies to build.gradle");

    if (typeof gradleConfig.modResults.contents === "string") {
      gradleConfig.modResults.contents =
        gradleConfig.modResults.contents.replace(
          "dependencies {",
          `dependencies {
    implementation("androidx.work:work-runtime-ktx:2.11.2")
    implementation("com.squareup.retrofit2:retrofit:3.0.0")
    implementation("com.squareup.retrofit2:converter-gson:3.0.0")
`,
        );
    }
    return gradleConfig;
  });
};

const withAndroidWidgets: ConfigPlugin = (config) => {
  let widgetNames: string[] = [];

  config = addDependencies(config);

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

    // TODO: uncomment when adding activities
    //
    // application.activity = (application.activity || []).concat(
    //   widgetNames.map((w) => ({
    //     $: {
    //       "android:name": `io.evcc.android.${w}ConfigureActivity`,
    //       "android:exported": "true",
    //       "android:theme": "@style/Theme.Evcc.WidgetConfigDialog",
    //     },
    //     "intent-filter": [
    //       {
    //         action: [
    //           {
    //             $: {
    //               "android:name":
    //                 "android.appwidget.action.APPWIDGET_CONFIGURE",
    //             },
    //           },
    //         ],
    //       },
    //     ],
    //   })),
    // );

    return config;
  });
};

export default createRunOncePlugin(withAndroidWidgets, "android-widgets");
