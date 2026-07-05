import Foundation

/// One server as mirrored from the React Native app into the shared App Group.
/// Written by `utils/widgetSync.ts` via `ExtensionStorage.set("servers", JSON.stringify(...))`.
struct StoredServer: Codable, Identifiable {
  let id: String
  let title: String?
  let url: String
  let username: String?
  let password: String?
  let authRequired: Bool?

  var displayTitle: String {
    if let t = title, !t.trimmingCharacters(in: .whitespaces).isEmpty { return t }
    return url
  }
}

/// Reads the server list the app writes into the shared App Group container.
enum SharedStore {
  static let appGroup = "group.io.evcc.app"

  private static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }

  /// `ExtensionStorage.set(key, string)` stores a plain string, so read it back
  /// as a string and decode the JSON ourselves.
  static func servers() -> [StoredServer] {
    guard let json = defaults?.string(forKey: "servers"),
          let data = json.data(using: .utf8),
          let list = try? JSONDecoder().decode([StoredServer].self, from: data)
    else { return [] }
    return list
  }

  static func activeServerId() -> String? {
    defaults?.string(forKey: "activeServerId")
  }

  static func defaultServer() -> StoredServer? {
    let all = servers()
    if let id = activeServerId(), let match = all.first(where: { $0.id == id }) {
      return match
    }
    return all.first
  }

  /// Resolve the server selected in the widget config, falling back to the active one.
  static func server(id: String?) -> StoredServer? {
    guard let id, !id.isEmpty else { return defaultServer() }
    return servers().first(where: { $0.id == id }) ?? defaultServer()
  }

  /// Timestamp of the last mode change made from the widget, so the loadpoint
  /// provider can schedule quick follow-up reloads (vehicles react slowly).
  static func markModeChanged() {
    defaults?.set(Date().timeIntervalSince1970, forKey: "lastModeChange")
  }

  static func secondsSinceModeChange() -> TimeInterval? {
    let t = defaults?.double(forKey: "lastModeChange") ?? 0
    return t > 0 ? Date().timeIntervalSince1970 - t : nil
  }
}
