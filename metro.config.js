const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { isFdroidBuild } = require("./scripts/buildType");

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
