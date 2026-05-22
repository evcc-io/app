import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { encode } from "base-64";
import { testingEnvironment } from "helper/launchArguments";

interface Credentials {
  username: string;
  password: string;
}

export async function shareFileFromUrl(url: string, credentials?: Credentials) {
  try {
    const d = new Directory(Paths.cache, "file_downloads");

    // prevent "Destination already exists" error
    if (d.exists) d.delete();
    d.create();

    // forward basic auth credentials so downloads work on protected servers
    const headers: Record<string, string> = {};
    if (credentials) {
      const token = encode(`${credentials.username}:${credentials.password}`);
      headers["Authorization"] = `Basic ${token}`;
    }

    const file = await File.downloadFileAsync(url, d, { headers });

    // the native share sheet cannot be driven by e2e tests; skip it so the
    // test can assert on the downloaded file instead
    if (!testingEnvironment()) {
      await Sharing.shareAsync(file.uri);
    }

    return file.name;
  } catch (e) {
    console.log(`downloading and sharing file ${url}: error ${e}`);
    return undefined;
  }
}
