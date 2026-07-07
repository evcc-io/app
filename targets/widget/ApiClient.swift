import Foundation

enum FetchOutcome<T> {
  case success(T)
  case noData   // reachable, but the requested slice is null / empty
  case failure  // network or auth error
}

/// Minimal evcc API client (GET jq slices of /api/state + POST actions), with
/// optional basic auth.
enum ApiClient {
  private static func base(_ server: StoredServer) -> String {
    var b = server.url
    while b.hasSuffix("/") { b.removeLast() }
    return b
  }

  private static func authorize(_ req: inout URLRequest, _ server: StoredServer) {
    if server.authRequired == true, let u = server.username, !u.isEmpty, let p = server.password {
      let token = Data("\(u):\(p)".utf8).base64EncodedString()
      req.setValue("Basic \(token)", forHTTPHeaderField: "Authorization")
    }
    // Cloudflare Access service token (stateless, no cookie handling needed)
    if let id = server.serviceTokenId, !id.isEmpty,
       let secret = server.serviceTokenSecret, !secret.isEmpty {
      req.setValue(id, forHTTPHeaderField: "CF-Access-Client-Id")
      req.setValue(secret, forHTTPHeaderField: "CF-Access-Client-Secret")
    }
  }

  static func request(_ server: StoredServer, jq: String) -> URLRequest? {
    guard var comps = URLComponents(string: base(server) + "/api/state") else { return nil }
    comps.queryItems = [URLQueryItem(name: "jq", value: jq)]
    guard let url = comps.url else { return nil }
    var req = URLRequest(url: url, timeoutInterval: 15)
    req.cachePolicy = .reloadIgnoringLocalCacheData
    authorize(&req, server)
    return req
  }

  static func fetch<T: Decodable>(_ server: StoredServer, jq: String, as type: T.Type) async -> FetchOutcome<T> {
    guard let req = request(server, jq: jq) else { return .failure }
    do {
      let (data, response) = try await URLSession.shared.data(for: req)
      guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
        return .failure
      }
      if let s = String(data: data, encoding: .utf8)?
        .trimmingCharacters(in: .whitespacesAndNewlines),
        s.isEmpty || s == "null" || s == "[]" || s == "{}" {
        return .noData
      }
      let decoded = try EvccJSON.decoder.decode(T.self, from: data)
      return .success(decoded)
    } catch {
      return .failure
    }
  }

  /// POST to an API path (e.g. "/api/loadpoints/1/mode/pv"). Returns success.
  @discardableResult
  static func post(_ server: StoredServer, path: String) async -> Bool {
    let p = path.hasPrefix("/") ? path : "/" + path
    guard let url = URL(string: base(server) + p) else { return false }
    var req = URLRequest(url: url, timeoutInterval: 15)
    req.httpMethod = "POST"
    authorize(&req, server)
    do {
      let (_, response) = try await URLSession.shared.data(for: req)
      return (response as? HTTPURLResponse).map { (200..<300).contains($0.statusCode) } ?? false
    } catch {
      return false
    }
  }
}
