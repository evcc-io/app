import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function shareFileFromUrl(url: string) {
  try {
    const d = new Directory(Paths.cache, "file_downloads");

    // prevent "Destination already exists" error
    if (d.exists) d.delete();
    d.create();

    const file = await File.downloadFileAsync(url, d);
    await Sharing.shareAsync(file.uri);
  } catch (e) {
    console.log(`downloading and sharing file ${url}: error ${e}`);
  }
}
