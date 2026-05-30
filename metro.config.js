const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
};

// F-Droid: stub out expo-camera (and its GMS/MLKit deps) at bundle time.
// The marker file is created by the F-Droid prebuild step in io.evcc.android.yml
const isFdroidBuild = fs.existsSync(
  path.join(__dirname, "fdroid-build"),
);

if (isFdroidBuild) {
  console.log(
    "📦 F-Droid build detected: stubbing out expo-camera (no GMS/MLKit)",
  );
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "expo-camera") {
      return {
        filePath: path.join(__dirname, "stubs/expo-camera.ts"),
        type: "sourceFile",
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
