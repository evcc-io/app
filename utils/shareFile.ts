import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { testingEnvironment } from "helper/launchArguments";

// downloads to cache and opens the share sheet; filename from
// Content-Disposition or URL. Throws on HTTP errors.
export async function shareFileFromUrl(
  url: string,
  headers: Record<string, string>,
) {
  const d = new Directory(Paths.cache, "file_downloads");

  // prevent "Destination already exists" error
  if (d.exists) d.delete();
  d.create();

  const file = await File.downloadFileAsync(url, d, { headers });

  // the native share sheet cannot be driven by e2e tests; skip it so the
  // test can assert on the downloaded file instead
  if (!testingEnvironment()) {
    await Sharing.shareAsync(file.uri);
  }

  return file.name;
}
