import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { testingEnvironment } from "helper/launchArguments";

// the webview fetches the file (so HttpOnly auth cookies and basic-auth come
// along) and posts the bytes back as base64; we just persist + share them.
export async function shareBase64File(filename: string, base64: string) {
  try {
    const d = new Directory(Paths.cache, "file_downloads");

    // prevent "Destination already exists" error
    if (d.exists) d.delete();
    d.create();

    const file = new File(d, filename);
    file.create();
    file.write(base64, { encoding: "base64" });

    // the native share sheet cannot be driven by e2e tests; skip it so the
    // test can assert on the downloaded file instead
    if (!testingEnvironment()) {
      await Sharing.shareAsync(file.uri);
    }

    return file.name;
  } catch (e) {
    console.log(`writing and sharing file ${filename}: error ${e}`);
    return undefined;
  }
}
