import { withAndroidManifest, type ConfigPlugin } from "expo/config-plugins";

const removeExpScheme: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (gradleConfig) => {
    console.log("🗑 Script: Removing exp+evcc scheme from AndroidManifest.xml");

    const app = gradleConfig.modResults.manifest.application?.[0];
    const activities = app?.activity ?? [];

    for (const activity of activities) {
      const intentFilters = activity["intent-filter"] ?? [];
      for (const filter of intentFilters) {
        if (filter.data) {
          filter.data = filter.data.filter(
            (d) => d.$?.["android:scheme"] !== `exp+evcc`,
          );
        }
      }
    }

    return gradleConfig;
  });
};

export default removeExpScheme;
