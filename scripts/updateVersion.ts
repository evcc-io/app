import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as readline from "node:readline/promises";
import type { ConfigContext } from "expo/config";
import appConfig from "../app.config";

const APP_CONFIG = "app.config.ts";

(async () => {
  const cfg = appConfig({ config: {} } as unknown as ConfigContext);
  const currentVersion = cfg.expo.version;
  const currentBuild = cfg.expo.ios?.buildNumber;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const version = (await rl.question(`New App Version (current ${currentVersion}): `)).trim();
  const code = (await rl.question(`New App Code (current ${currentBuild}): `)).trim();
  rl.close();

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`invalid version (expected x.y.z): ${version}`);
  }
  if (!/^\d+$/.test(code)) {
    throw new Error(`invalid code (expected integer): ${code}`);
  }

  if (version !== currentVersion) {
    execSync(`npm version --no-git-tag-version ${version}`, { stdio: "inherit" });
  }

  const updated = fs
    .readFileSync(APP_CONFIG, "utf8")
    .replace(/version:\s*"[^"]+"/, `version: "${version}"`)
    .replace(/buildNumber:\s*"[^"]+"/, `buildNumber: "${code}"`)
    .replace(/versionCode:\s*\d+/, `versionCode: ${code}`);

  fs.writeFileSync(APP_CONFIG, updated);

  console.log(`✓ Version ${version} / Code ${code}`);
})();
