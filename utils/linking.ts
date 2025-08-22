import * as Linking from "expo-linking";

export function linking(url: string) {
  const { hostname, path: _path, queryParams } = Linking.parse(url);

  switch (hostname) {
    case "server":
      break;

    default:
      break;
  }
}
