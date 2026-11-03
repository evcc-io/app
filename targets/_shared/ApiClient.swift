import Foundation

// Dates arrive as ISO-8601 strings (e.g. 2026-06-23T00:15:00+02:00) from older
// evcc versions, or as unix seconds from newer ones (evcc-io/evcc#32391).
enum EvccJSON {
  private static let isoNoFrac: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    return f
  }()
  private static let isoFrac: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
  }()

  static let decoder: JSONDecoder = {
    let d = JSONDecoder()
    d.dateDecodingStrategy = .custom { dec in
      let c = try dec.singleValueContainer()
      if let seconds = try? c.decode(Double.self) {
        return Date(timeIntervalSince1970: seconds)
      }
      let s = try c.decode(String.self)
      if let date = isoNoFrac.date(from: s) ?? isoFrac.date(from: s) { return date }
      throw DecodingError.dataCorruptedError(in: c, debugDescription: "bad date \(s)")
    }
    return d
  }()
}

/// One evcc server as synced from the React Native app (widget: App Group,
/// watch: WatchConnectivity). Written by `utils/widgetSync.ts`.
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

enum FetchOutcome<T> {
  case success(T)
  case noData   // reachable, but the requested slice is null / empty
  case failure  // network or auth error
}

/// Last failure per server URL ("HTTP 400", "URLError -1004", "decoding"), shown
/// next to "unreachable" so a failing fetch can be told apart without logs.
final class FetchDiagnostics: @unchecked Sendable {
  static let shared = FetchDiagnostics()
  private let lock = NSLock()
  private var errors: [String: String] = [:]

  func set(_ url: String, _ error: String?) {
    lock.lock(); defer { lock.unlock() }
    errors[url] = error
  }

  func get(_ url: String) -> String? {
    lock.lock(); defer { lock.unlock() }
    return errors[url]
  }
}

/// Minimal evcc API client (GET jq slices of /api/state + POST actions), with
/// optional basic auth.
enum ApiClient {
  private static func base(_ server: StoredServer) -> String {
    var b = server.url
    while b.hasSuffix("/") { b.removeLast() }
    return b
  }

  // Same UA suffix as the app's WebView (utils/constants.ts)
  private static let userAgent =
    "evcc/\(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "")"

  private static func applyHeaders(_ req: inout URLRequest, _ server: StoredServer) {
    req.setValue(userAgent, forHTTPHeaderField: "User-Agent")
    if server.authRequired == true, let u = server.username, !u.isEmpty, let p = server.password {
      let token = Data("\(u):\(p)".utf8).base64EncodedString()
      req.setValue("Basic \(token)", forHTTPHeaderField: "Authorization")
    }
  }

  /// evcc blocks remote logins after 10 failures per minute: after a 401/429,
  /// pause requests to that server for a minute instead of adding to it.
  private static func backoffKey(_ server: StoredServer) -> String {
    "backoff.\(base(server))|\(server.username ?? "")"
  }

  private static func backedOff(_ server: StoredServer) -> Bool {
    Date().timeIntervalSince1970 < UserDefaults.standard.double(forKey: backoffKey(server))
  }

  private static func status(_ response: URLResponse, _ server: StoredServer) -> Int {
    let code = (response as? HTTPURLResponse)?.statusCode ?? 0
    if code == 401 || code == 429 {
      UserDefaults.standard.set(Date().timeIntervalSince1970 + 60, forKey: backoffKey(server))
    }
    return code
  }

  static func request(_ server: StoredServer, jq: String) -> URLRequest? {
    guard var comps = URLComponents(string: base(server) + "/api/state") else { return nil }
    comps.queryItems = [URLQueryItem(name: "jq", value: jq)]
    guard let url = comps.url else { return nil }
    var req = URLRequest(url: url, timeoutInterval: 15)
    req.cachePolicy = .reloadIgnoringLocalCacheData
    applyHeaders(&req, server)
    return req
  }

  static func fetch<T: Decodable>(_ server: StoredServer, jq: String, as type: T.Type) async -> FetchOutcome<T> {
    let diag = FetchDiagnostics.shared
    guard !backedOff(server) else {
      diag.set(server.url, "backoff")
      return .failure
    }
    guard let req = request(server, jq: jq) else {
      diag.set(server.url, "invalid URL")
      return .failure
    }
    let data: Data
    do {
      let (d, response) = try await URLSession.shared.data(for: req)
      let code = status(response, server)
      guard (200..<300).contains(code) else {
        diag.set(server.url, "HTTP \(code)")
        return .failure
      }
      data = d
    } catch {
      let e = error as NSError
      diag.set(server.url, e.domain == NSURLErrorDomain ? "URLError \(e.code)" : "\(e.domain) \(e.code)")
      return .failure
    }
    diag.set(server.url, nil)
    if let s = String(data: data, encoding: .utf8)?
      .trimmingCharacters(in: .whitespacesAndNewlines),
      s.isEmpty || s == "null" || s == "[]" || s == "{}" {
      return .noData
    }
    do {
      return .success(try EvccJSON.decoder.decode(T.self, from: data))
    } catch {
      diag.set(server.url, "decoding: " + String("\(error)".prefix(200)))
      return .failure
    }
  }

  /// POST to an API path (e.g. "/api/loadpoints/1/mode/pv"). Returns success.
  @discardableResult
  static func post(_ server: StoredServer, path: String) async -> Bool {
    let p = path.hasPrefix("/") ? path : "/" + path
    guard !backedOff(server), let url = URL(string: base(server) + p) else { return false }
    var req = URLRequest(url: url, timeoutInterval: 15)
    req.httpMethod = "POST"
    applyHeaders(&req, server)
    do {
      let (_, response) = try await URLSession.shared.data(for: req)
      return (200..<300).contains(status(response, server))
    } catch {
      return false
    }
  }
}
