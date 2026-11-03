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
    var ctx: [String: Any] = ["servers": servers]
    if let activeServerId { ctx["activeServerId"] = activeServerId }
    queue.async {
      self.context = ctx
      self.flush()
    }
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
