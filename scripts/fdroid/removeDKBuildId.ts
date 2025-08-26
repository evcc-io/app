import path from "path";
import fs from "fs";
import { withDangerousMod, type ConfigPlugin } from "expo/config-plugins";

const withAddLinkOption: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const packages = ["react-native-screens", "expo-modules-core"];
      for (const pkg of packages) {
        console.log(
          "🗑 Script: Removing build ID from CMakeLists.txt for package",
          pkg,
        );

        const cmakeFilePath = path.join(
          config.modRequest.projectRoot,
          "node_modules",
          pkg,
          "android",
          "CMakeLists.txt",
        );
        if (fs.existsSync(cmakeFilePath)) {
          let contents = fs.readFileSync(cmakeFilePath, "utf8");
          // Insert the linker option after the first line if not already present.
          if (!contents.includes("LINKER:--build-id=none")) {
            const lines = contents.split("\n");
            lines.splice(1, 0, 'add_link_options("LINKER:--build-id=none")');
            contents = lines.join("\n");
            fs.writeFileSync(cmakeFilePath, contents, "utf8");
          }
        }
      }
      return config;
    },
  ]);
};

module.exports = withAddLinkOption;
