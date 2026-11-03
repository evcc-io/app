import ExpoModulesCore
import WatchConnectivity

public class WatchSyncModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WatchSync")

    OnCreate {
      WatchSyncSession.shared.activate()
    }

    Function("setServers") { (servers: String, activeServerId: String?) in
      WatchSyncSession.shared.update(servers: servers, activeServerId: activeServerId)
    }
  }
}

/// Sends the latest server list as application context: delivered even when the
/// watch is out of reach, only the newest one counts. Kept around to re-send
/// once the session activates or the watch app gets installed.
final class WatchSyncSession: NSObject, WCSessionDelegate {
  static let shared = WatchSyncSession()

  private let queue = DispatchQueue(label: "io.evcc.watchsync")
  private var context: [String: Any]?

  func activate() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func update(servers: String, activeServerId: String?) {
    queue.async {
      var ctx: [String: Any] = ["servers": Self.addFallbackUrls(servers)]
      if let activeServerId { ctx["activeServerId"] = activeServerId }
      self.context = ctx
      self.flush()
    }
  }

  /// watchOS can't resolve Bonjour `.local` names (as found by discovery), so
  /// resolve them here and pass the IP along as `fallbackUrl`.
  private static func addFallbackUrls(_ json: String) -> String {
    guard let data = json.data(using: .utf8),
          var list = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]]
    else { return json }
    for i in list.indices {
      guard let url = list[i]["url"] as? String,
            var comps = URLComponents(string: url),
            let host = comps.host, host.lowercased().hasSuffix(".local"),
            let ip = resolve(host)
      else { continue }
      comps.host = ip.contains(":") ? "[\(ip)]" : ip
      list[i]["fallbackUrl"] = comps.string
    }
    guard let out = try? JSONSerialization.data(withJSONObject: list),
          let str = String(data: out, encoding: .utf8)
    else { return json }
    return str
  }

  /// First IPv4 address of a host, else a non-link-local IPv6 one.
  private static func resolve(_ host: String) -> String? {
    var hints = addrinfo(ai_flags: 0, ai_family: AF_UNSPEC, ai_socktype: SOCK_STREAM,
                         ai_protocol: 0, ai_addrlen: 0, ai_canonname: nil, ai_addr: nil, ai_next: nil)
    var result: UnsafeMutablePointer<addrinfo>?
    guard getaddrinfo(host, nil, &hints, &result) == 0, let first = result else { return nil }
    defer { freeaddrinfo(first) }

    var v6: String?
    for info in sequence(first: first, next: { $0.pointee.ai_next }) {
      var buf = [CChar](repeating: 0, count: Int(NI_MAXHOST))
      guard getnameinfo(info.pointee.ai_addr, info.pointee.ai_addrlen, &buf, socklen_t(buf.count),
                        nil, 0, NI_NUMERICHOST) == 0
      else { continue }
      let ip = String(cString: buf)
      if info.pointee.ai_family == AF_INET { return ip }
      if v6 == nil, !ip.lowercased().hasPrefix("fe80") { v6 = ip }
    }
    return v6
  }

  private func flush() {
    guard let context, WCSession.isSupported() else { return }
    let session = WCSession.default
    guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled
    else { return }
    try? session.updateApplicationContext(context)
  }

  func session(
    _ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?
  ) {
    queue.async { self.flush() }
  }

  func sessionWatchStateDidChange(_ session: WCSession) {
    queue.async { self.flush() }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  // Switching to another paired watch: reactivate for the new one.
  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }
}
