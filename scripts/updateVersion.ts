const fs = require("fs");
const readline = require("readline/promises");

(async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const version = await rl.question("App Version: ");
  const code = await rl.question("App Code: ");
  rl.close();

  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  pkg.version = version;
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

  const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
  lock.version = version;
  lock.packages[""].version = version;
  fs.writeFileSync(
    "package-lock.json",
    JSON.stringify(lock, null, 2) + "\n"
  );

  let config = fs.readFileSync("app.config.ts", "utf8");
  config = config.replace(
    /version:\s*"[^"]+"/,
    `version: "${version}"`
  );
  config = config.replace(
    /buildNumber:\s*"[^"]+"/,
    `buildNumber: "${code}"`
  );
  config = config.replace(
    /versionCode:\s*\d+/,
    `versionCode: ${code}`
  );

  fs.writeFileSync("app.config.ts", config);

  console.log(`✓ Version ${version} / Code ${code}`);
})();
