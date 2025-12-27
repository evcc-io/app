import { ConfigPlugin, withAppBuildGradle } from "expo/config-plugins";

const patchAppGradle: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    for (const f of [
      addDetoxDefaultConfigBlock,
      addDetoxProguardRules,
      setGradleAndroidTestImplementation,
    ]) {
      config.modResults.contents = f(config.modResults.contents);
    }

    return config;
  });
};

const addDetoxDefaultConfigBlock = (config: string) => {
  return config.replace(
    "defaultConfig {",
    `defaultConfig {
        testBuildType System.getProperty('testBuildType', 'debug')
        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'`,
  );
};

const addDetoxProguardRules = (config: string) => {
  return config.replace(
    `proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"`,
    `proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            proguardFile "\${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"`,
  );
};

const setGradleAndroidTestImplementation = (config: string) => {
  return config.replace(
    "dependencies {",
    `dependencies {
    androidTestImplementation('com.wix:detox:+')
    implementation 'androidx.appcompat:appcompat:1.1.0'`,
  );
};

export default patchAppGradle;
