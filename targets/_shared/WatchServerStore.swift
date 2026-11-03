#if os(watchOS)
import Foundation
import Security

/// Server list synced from the iPhone app (WatchConnectivity application
/// context), kept in the Keychain because it carries basic-auth passwords.
/// The App Group doubles as keychain access group so the complication can read it.
struct WatchServerPayload: Codable {
  var servers: [StoredServer]
  var activeServerId: String?
}

enum WatchServerStore {
  private static let service = "io.evcc.servers"
  private static let account = "servers"
  private static let accessGroup = "group.io.evcc.app"

  private static func query(_ group: String?) -> [String: Any] {
    var q: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
    ]
    if let group { q[kSecAttrAccessGroup as String] = group }
    return q
  }

  static func load() -> WatchServerPayload? {
    // Unsigned simulator builds have no access group entitlement: fall back.
    for group in [accessGroup, nil] {
      var q = query(group)
      q[kSecReturnData as String] = true
      q[kSecMatchLimit as String] = kSecMatchLimitOne
      var item: CFTypeRef?
      if SecItemCopyMatching(q as CFDictionary, &item) == errSecSuccess, let data = item as? Data {
        return try? JSONDecoder().decode(WatchServerPayload.self, from: data)
      }
    }
    return nil
  }

  static func save(_ payload: WatchServerPayload) {
    guard let data = try? JSONEncoder().encode(payload) else { return }
    for group in [accessGroup, nil] {
      let q = query(group)
      let attrs: [String: Any] = [
        kSecValueData as String: data,
        // The complication refreshes while the watch is locked.
        kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
      ]
      var status = SecItemUpdate(q as CFDictionary, attrs as CFDictionary)
      if status == errSecItemNotFound {
        status = SecItemAdd(q.merging(attrs) { $1 } as CFDictionary, nil)
      }
      if status == errSecSuccess { return }
    }
  }

  static func servers() -> [StoredServer] { load()?.servers ?? [] }

  static func defaultServer() -> StoredServer? {
    guard let payload = load() else { return nil }
    return payload.servers.first { $0.id == payload.activeServerId } ?? payload.servers.first
  }

  static func server(id: String?) -> StoredServer? {
    guard let id, !id.isEmpty else { return defaultServer() }
    return servers().first { $0.id == id } ?? defaultServer()
  }
}

/// Loadpoint names per server, written by the watch app so the complication can
/// offer them as configurations (`recommendations()` must not fetch).
enum LoadpointTitles {
  private static var defaults: UserDefaults? { UserDefaults(suiteName: "group.io.evcc.app") }

  static func get(_ serverId: String) -> [String] {
    defaults?.stringArray(forKey: "loadpointTitles.\(serverId)") ?? []
  }

  static func set(_ titles: [String], serverId: String) {
    defaults?.set(titles, forKey: "loadpointTitles.\(serverId)")
  }
}
#endif
