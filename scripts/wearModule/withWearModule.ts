import {
  ConfigPlugin,
  withDangerousMod,
  withSettingsGradle,
} from "expo/config-plugins";
import fs from "fs";
import path from "path";

/**
 * Adds a standalone Wear OS companion app (`:wear`) to the prebuilt Android
 * project - a swipeable overview + per-loadpoint companion app plus a
 * glanceable tile, synced from the phone's server list over the Wearable Data
 * Layer. Android counterpart of the iOS watch app (evcc-io/app#349).
 *
 * `expo prebuild` stays the only step: this plugin scaffolds android/wear/,
 * wires settings.gradle, copies the Kotlin sources from targets/wear/kotlin,
 * and generates res/values*\/strings.xml from the #255 widget's
 * Localizable.xcstrings catalog. All `wear.*` keys - including the app-only
 * ones - are compiled into that catalog by `npm run widget:strings`
 * (scripts/build-widget-strings.mts), same mechanism the Apple Watch app
 * uses for its `watch.*` keys (evcc-io/app#349): energy-flow labels are
 * reused from the evcc daemon's own translations (`../evcc/i18n`,
 * `main.energyflow.*`) rather than re-translated here, so they stay in all
 * the locales evcc already supports instead of just en/de.
 *
 * v1 scope: `:wear` is its own installable APK (`./gradlew :wear:assembleRelease`),
 * distributed the same way the phone app's direct APK is (GitHub Releases) -
 * NOT yet embedded into the phone app's AAB for automatic Play Store install
 * onto a paired watch. That embedding is real Gradle + Play Console plumbing
 * that needs on-device verification; see targets/wear/PLAN.md.
 */

const KOTLIN_SRC = "targets/wear/kotlin";
const ICON_SRC = "targets/wear/icon"; // mipmap-*/ic_launcher[_round].png, resized from assets/icon-light.png
const WEAR_PACKAGE = "io.evcc.wear";
// The Wear Data Layer only delivers cross-device events between apps sharing
// the same package name and signing certificate (see "Security of
// communications" at developer.android.com/training/wearables/data/overview).
// The installed applicationId must match the phone app's ("io.evcc.android")
// for that reason; WEAR_PACKAGE stays the code namespace so no Kotlin source
// files need touching.
const WEAR_APPLICATION_ID = "io.evcc.android";
const WEAR_DIR = "android/wear"; // gitignored like android/, regenerated
const XCSTRINGS = "targets/widget/Localizable.xcstrings"; // shared mode/status labels (#255) + wear.* (this app)
const APP_I18N = "i18n"; // only used to enumerate the locales this app ships

// Pin against the versions Wear OS 4 (API 33+) / protolayout need. Bump together.
const WEAR = {
  compileSdk: 36,
  minSdk: 33,
  tiles: "1.4.1",
  protolayout: "1.2.1",
  // 1.5.0+ for androidx.wear.compose.foundation.pager (HorizontalPager/rememberPagerState).
  // 1.7.x's AARs require compileSdk 37 + AGP 9.1+ (we're pinned to AGP 8.12.0/compileSdk 36
  // via react-native's own libs.versions.toml) - stay on the last 1.6.x release.
  composeWear: "1.6.2",
  composeFoundation: "1.9.1",
  activityCompose: "1.9.3",
  lifecycleCompose: "2.8.7",
  datastore: "1.1.1",
  playServicesWearable: "20.0.1",
  guava: "33.3.1-android",
};

/** 1. `include(":wear")` in settings.gradle. */
const withWearInSettings: ConfigPlugin = (config) =>
  withSettingsGradle(config, (config) => {
    if (!config.modResults.contents.includes('include(":wear")')) {
      config.modResults.contents +=
        '\ninclude(":wear")\nproject(":wear").projectDir = new File(rootProject.projectDir, "wear")\n';
    }
    return config;
  });

// The :wear module applies the Kotlin/Compose plugins without an explicit
// version - it resolves against the root project's plugin classpath, same
// place the react-native gradle plugin pins Kotlin for :app.
const buildGradle = () => `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace "${WEAR_PACKAGE}"
    compileSdk ${WEAR.compileSdk}

    defaultConfig {
        applicationId "${WEAR_APPLICATION_ID}"
        minSdk ${WEAR.minSdk}
        targetSdk ${WEAR.compileSdk}
        versionCode 1
        versionName "1.0"
    }

    // Same debug.keystore as :app - the Wear Data Layer requires matching
    // signatures between the phone and watch apps to deliver sync events
    // across devices; without this, :wear falls back to AGP's per-machine
    // default debug key and silently never matches the phone's signature.
    signingConfigs {
        debug {
            storeFile file("../app/debug.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
    }

    buildFeatures {
        compose true
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation "androidx.wear.tiles:tiles:${WEAR.tiles}"
    implementation "androidx.wear.protolayout:protolayout:${WEAR.protolayout}"

    implementation "androidx.activity:activity-compose:${WEAR.activityCompose}"
    implementation "androidx.wear.compose:compose-material:${WEAR.composeWear}"
    implementation "androidx.wear.compose:compose-foundation:${WEAR.composeWear}"
    implementation "androidx.compose.foundation:foundation:${WEAR.composeFoundation}"
    implementation "androidx.compose.material:material-icons-extended:1.7.8"
    implementation "androidx.lifecycle:lifecycle-viewmodel-compose:${WEAR.lifecycleCompose}"
    implementation "androidx.lifecycle:lifecycle-runtime-compose:${WEAR.lifecycleCompose}"

    implementation "androidx.datastore:datastore-preferences:${WEAR.datastore}"
    implementation "com.google.android.gms:play-services-wearable:${WEAR.playServicesWearable}"
    implementation "com.google.guava:guava:${WEAR.guava}"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.9.0"
}
`;

const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-feature android:name="android.hardware.type.watch" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".WearApplication"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/wear_app_name"
        android:theme="@android:style/Theme.DeviceDefault"
        android:usesCleartextTraffic="true">

        <!-- Same as :app's app.config.ts - users run evcc on plain-HTTP local
             IPs, and Android blocks cleartext traffic by default for
             targetSdk 28+. ApiClient.kt swallows the resulting exception into
             FetchOutcome.Failure, so without this the watch silently shows
             "server unavailable" for every HTTP (non-HTTPS) server. -->

        <!-- Runs without the phone app installed: standalone, same as the iOS watch app. -->
        <meta-data android:name="com.google.android.wearable.standalone" android:value="true" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:taskAffinity=""
            android:theme="@android:style/Theme.DeviceDefault">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".LoadpointTileService"
            android:exported="true"
            android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER">
            <intent-filter>
                <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />
            </intent-filter>
            <meta-data
                android:name="androidx.wear.tiles.PREVIEW"
                android:resource="@drawable/tile_preview" />
        </service>

        <service
            android:name=".WatchSyncListenerService"
            android:exported="true">
            <intent-filter>
                <action android:name="com.google.android.gms.wearable.DATA_CHANGED" />
                <category android:name="android.intent.category.DEFAULT" />
                <data
                    android:scheme="wear"
                    android:host="*"
                    android:pathPrefix="/evcc/servers" />
            </intent-filter>
        </service>

    </application>
</manifest>
`;

const wearApplicationKt = `package ${WEAR_PACKAGE}

import android.app.Application

/** Placeholder Application subclass - no global init needed yet, kept so the
 *  manifest has a stable android:name to point at if that changes. */
class WearApplication : Application()
`;

// key -> locale -> value
type Translations = Record<string, Record<string, string>>;

function loadTranslations(projectRoot: string): {
  translations: Translations;
  locales: string[];
} {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(projectRoot, XCSTRINGS), "utf8"),
  ) as {
    strings: Record<
      string,
      { localizations: Record<string, { stringUnit: { value: string } }> }
    >;
  };
  // Only the keys the wear app actually renders - mode/status labels, loadpoint
  // name, the shared "unreachable"/"no data" messages, and the app's own
  // wear.* strings (also baked into the catalog - see build-widget-strings.mts).
  const sharedKeys = [
    "widget.loadpoint.name",
    "widget.mode.off",
    "widget.mode.normal",
    "widget.mode.boost",
    "widget.mode.on",
    "widget.mode.smart",
    "widget.mode.pv",
    "widget.mode.minpv",
    "widget.mode.now",
    "widget.lpstatus.disconnected",
    "widget.lpstatus.connected",
    "widget.lpstatus.waitForVehicle",
    "widget.lpstatus.finished",
    "widget.lpstatus.charging",
    "widget.lpheat.connected",
    "widget.lpheat.waitForVehicle",
    "widget.lpheat.charging",
    "widget.noData.title",
    "widget.noData.body",
    "widget.unreachable.title",
    "widget.unreachable.body",
    "widget.config.server",
    "widget.config.loadpoint",
    "wear.flow.pv",
    "wear.flow.home",
    "wear.flow.gridImport",
    "wear.flow.gridExport",
    "wear.flow.battery",
    "wear.flow.batteryCharge",
    "wear.flow.batteryDischarge",
    "wear.empty.title",
    "wear.empty.body",
    "wear.modeFailed",
  ];
  const translations: Translations = {};
  for (const key of sharedKeys) {
    const entry = catalog.strings[key];
    if (!entry) continue;
    translations[key] = Object.fromEntries(
      Object.entries(entry.localizations).map(([locale, l]) => [
        locale,
        l.stringUnit.value,
      ]),
    );
  }

  const i18nDir = path.join(projectRoot, APP_I18N);
  const locales = fs
    .readdirSync(i18nDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.basename(f, ".json"))
    .sort();
  return { translations, locales };
}

function escapeAndroid(value: string): string {
  let s = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
  if (/^[@?]/.test(s)) s = `\\${s}`;
  return s;
}

// "widget.mode.off" -> <string name="widget_mode_off">; "nb-NO" -> values-b+nb+NO
function writeStrings(
  resDir: string,
  translations: Translations,
  locales: string[],
  sourceLang = "en",
) {
  const keys = Object.keys(translations).sort();
  for (const locale of locales) {
    const dir = path.join(
      resDir,
      locale === sourceLang
        ? "values"
        : `values-b+${locale.split("-").join("+")}`,
    );
    fs.mkdirSync(dir, { recursive: true });
    const entries = keys
      .map((key) => {
        const value =
          translations[key][locale] ?? translations[key][sourceLang];
        if (value === undefined) return null;
        return `    <string name="${key.replace(/\./g, "_")}">${escapeAndroid(value)}</string>`;
      })
      .filter((l): l is string => l !== null)
      .join("\n");
    const appName =
      locale === sourceLang
        ? '    <string name="wear_app_name">evcc</string>\n'
        : "";
    fs.writeFileSync(
      path.join(dir, "strings.xml"),
      `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${appName}${entries}\n</resources>\n`,
    );
  }
}

const tilePreviewXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#1C1C1E" />
</shape>
`;

/** Scaffold android/wear/: build.gradle, AndroidManifest.xml, copy Kotlin,
 *  generate res/values*\/strings.xml. */
const withWearProject: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const root = config.modRequest.projectRoot;
      const wear = path.join(root, WEAR_DIR);
      const main = path.join(wear, "src/main");
      const kotlinOut = path.join(main, "java", ...WEAR_PACKAGE.split("."));
      fs.mkdirSync(kotlinOut, { recursive: true });

      const srcDir = path.join(root, KOTLIN_SRC);
      for (const f of fs.readdirSync(srcDir).filter((f) => f.endsWith(".kt"))) {
        fs.copyFileSync(path.join(srcDir, f), path.join(kotlinOut, f));
      }
      fs.writeFileSync(
        path.join(kotlinOut, "WearApplication.kt"),
        wearApplicationKt,
      );

      fs.writeFileSync(path.join(wear, "build.gradle"), buildGradle());
      fs.writeFileSync(path.join(main, "AndroidManifest.xml"), manifest);

      const drawableDir = path.join(main, "res/drawable");
      fs.mkdirSync(drawableDir, { recursive: true });
      fs.writeFileSync(
        path.join(drawableDir, "tile_preview.xml"),
        tilePreviewXml,
      );

      const iconSrcDir = path.join(root, ICON_SRC);
      for (const bucket of fs.readdirSync(iconSrcDir)) {
        const bucketOut = path.join(main, "res", bucket);
        fs.mkdirSync(bucketOut, { recursive: true });
        for (const f of fs.readdirSync(path.join(iconSrcDir, bucket))) {
          fs.copyFileSync(
            path.join(iconSrcDir, bucket, f),
            path.join(bucketOut, f),
          );
        }
      }

      const { translations, locales } = loadTranslations(root);
      writeStrings(path.join(main, "res"), translations, locales);

      return config;
    },
  ]);

const withWearModule: ConfigPlugin = (config) => {
  config = withWearInSettings(config);
  config = withWearProject(config);
  return config;
};

export default withWearModule;
