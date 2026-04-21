export function getTitle(url: string) {
  let title = url;

  for (const s of ["https://", "http://"]) {
    if (title.startsWith(s)) {
      title = title.slice(s.length, title.length);
    }
  }

  for (const s of [":7070", ".local.", ".fritz.box"]) {
    if (title.endsWith(s)) {
      title = title.slice(0, -1 * s.length);
    }
  }
  return title;
}
