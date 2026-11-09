import fs from "fs";
import path from "path";

const fileExists = (filename: string) =>
  fs.existsSync(path.join(__dirname, `../${filename}`));

export const isAndroidDetoxBuild = fileExists("android-detox-build");
export const isFdroidBuild = fileExists("fdroid-build");
