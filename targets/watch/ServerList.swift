import Foundation
import WatchConnectivity
import WidgetKit

/// Receives the server list from the iPhone app (`modules/watch-sync`) and
/// tracks which server the watch shows.
@MainActor
final class ServerList: NSObject, ObservableObject {
  @Published private(set) var servers: [StoredServer] = []
  @Published var selectedId: String? {
    didSet { UserDefaults.standard.set(selectedId, forKey: Self.selectedKey) }
  }

  private static let selectedKey = "selectedServerId"
  private var activeServerId: String?

  var selected: StoredServer? {
    servers.first { $0.id == selectedId }
      ?? servers.first { $0.id == activeServerId }
      ?? servers.first
  }

  override init() {
    super.init()
    if let payload = WatchServerStore.load() {
      servers = payload.servers
      activeServerId = payload.activeServerId
    }
    selectedId = UserDefaults.standard.string(forKey: Self.selectedKey)
    if WCSession.isSupported() {
      WCSession.default.delegate = self
      WCSession.default.activate()
    }
  }

  fileprivate func apply(_ context: [String: Any]) {
    guard let json = context["servers"] as? String,
          let data = json.data(using: .utf8),
          let list = try? JSONDecoder().decode([StoredServer].self, from: data)
    else { return }
    let payload = WatchServerPayload(servers: list, activeServerId: context["activeServerId"] as? String)
    WatchServerStore.save(payload)
    servers = payload.servers
    activeServerId = payload.activeServerId
    WidgetCenter.shared.reloadAllTimelines()
  }
}

extension ServerList: WCSessionDelegate {
  nonisolated func session(
    _ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?
  ) {
    let context = session.receivedApplicationContext
    guard !context.isEmpty else { return }
    Task { @MainActor in self.apply(context) }
  }

  nonisolated func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
    Task { @MainActor in self.apply(context) }
  }
}
