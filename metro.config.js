const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

// Inlined from scripts/buildType.ts: metro.config.js is plain CommonJS loaded by
// raw Node (e.g. eas build), which cannot require .ts files.
const isFdroidBuild = fs.existsSync(path.join(__dirname, "fdroid-build"));

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
