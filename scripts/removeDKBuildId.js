const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAddLinkOption = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packages = ['react-native-screens', 'expo-modules-core'];
      for (const pkg of packages) {
        const cmakeFilePath = path.join(
          config.modRequest.platformProjectRoot,
          'node_modules',
          pkg,
          'android',
          'CMakeLists.txt'
        );
        if (fs.existsSync(cmakeFilePath)) {
          let contents = fs.readFileSync(cmakeFilePath, 'utf8').split('\n');
          const lines = contents;
          lines.splice(1, 0, 'add_link_options("LINKER:--build-id=none")');
          contents = lines.join('\n');
          fs.writeFileSync(cmakeFilePath, contents, 'utf8');
        }
      }
      return config;
    },
  ]);
};

module.exports = withAddLinkOption;