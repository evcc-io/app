import Foundation
import WatchKit
import WidgetKit

/// Subset of /api/state shown on the watch.
struct SiteState: Codable {
  let siteTitle: String?
  let pvPower: Double?
  let homePower: Double?
  let gridPower: Double?
  let batterySoc: Double?
  let batteryPower: Double?
  let loadpoints: [Loadpoint]?

  static let jq =
    "{siteTitle, pvPower, homePower, gridPower: .grid.power, batterySoc: .battery.soc, batteryPower: .battery.power, loadpoints}"
}

/// Polls the selected server while the app is in the foreground. Keeps the last
/// good state (also across launches) so a short outage shows stale values
/// instead of an empty screen.
@MainActor
final class SiteModel: ObservableObject {
  @Published private(set) var state: SiteState?
  @Published private(set) var lastUpdate: Date?
  @Published private(set) var unreachable = false
  @Published private(set) var errorDetail: String?
  @Published private(set) var pendingModes: [Int: String] = [:]
  @Published var modeFailed = false

  private var serverId: String?
  private var reloadedComplications = false
  private static let interval: Duration = .seconds(10)

  func poll(_ server: StoredServer) async {
    if serverId != server.id {
      serverId = server.id
      pendingModes = [:]
      unreachable = false
      (state, lastUpdate) = Self.cached(server.id)
    }
    while !Task.isCancelled {
      await refresh(server)
      try? await Task.sleep(for: Self.interval)
    }
  }

  func refresh(_ server: StoredServer) async {
    switch await ApiClient.fetch(server, jq: SiteState.jq, as: SiteState.self) {
    case .success(let s):
      guard server.id == serverId else { return }
      state = s
      lastUpdate = Date()
      unreachable = false
      Self.cache(s, server.id)
      if !reloadedComplications {
        reloadedComplications = true
        WidgetCenter.shared.reloadAllTimelines()
      }
    case .noData, .failure:
      guard server.id == serverId else { return }
      unreachable = true
      errorDetail = FetchDiagnostics.shared.get(server.url) ?? "no data"
    }
  }

  /// Optimistic: shows the new mode right away, reverts on failure.
  func setMode(_ server: StoredServer, lp index: Int, mode: String) async {
    pendingModes[index] = mode
    let ok = await ApiClient.post(server, path: "/api/loadpoints/\(index + 1)/mode/\(mode)")
    if ok {
      WKInterfaceDevice.current().play(.success)
      await refresh(server)
      WidgetCenter.shared.reloadAllTimelines()
    } else {
      WKInterfaceDevice.current().play(.failure)
      modeFailed = true
    }
    pendingModes[index] = nil
  }

  private static func cacheKey(_ id: String) -> String { "site.\(id)" }

  private static func cache(_ s: SiteState, _ id: String) {
    UserDefaults.standard.set(try? JSONEncoder().encode(s), forKey: cacheKey(id))
    UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: cacheKey(id) + ".at")
    LoadpointTitles.set((s.loadpoints ?? []).map { LoadpointVM.build(from: $0).title }, serverId: id)
  }

  private static func cached(_ id: String) -> (SiteState?, Date?) {
    guard let data = UserDefaults.standard.data(forKey: cacheKey(id)),
          let s = try? JSONDecoder().decode(SiteState.self, from: data)
    else { return (nil, nil) }
    let t = UserDefaults.standard.double(forKey: cacheKey(id) + ".at")
    return (s, t > 0 ? Date(timeIntervalSince1970: t) : nil)
  }
}
