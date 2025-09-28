import assert from "assert";
import { type ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import fs from "fs";
import path from "path";

function getTemplateFile(androidPackage: string): string {
  return `package ${androidPackage};
import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (BuildConfig.DEBUG ? 180 : 60);

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
`;
}

const addAndroidTest: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName = config.android?.package;
      assert(packageName, "android.package must be defined");

      const folder = path.join(
        config.modRequest.platformProjectRoot,
        `app/src/androidTest/java/${packageName.split(".").join("/")}`,
      );
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(
        path.join(folder, "DetoxTest.java"),
        getTemplateFile(packageName),
        { encoding: "utf8" },
      );
      return config;
    },
  ]);
};

export default addAndroidTest;
