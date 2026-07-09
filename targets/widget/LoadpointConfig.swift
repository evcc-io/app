import AppIntents
import Foundation
import WidgetKit

/// Server + loadpoint. The loadpoint list is server-dependent (fetched) so it
/// resets when the server changes.
struct LoadpointConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "widget.loadpoint.name"
  static var description = IntentDescription("widget.config.desc")

  @Parameter(title: "widget.config.server", optionsProvider: ServerOptions())
  var server: String?

  @Parameter(title: "widget.config.loadpoint", optionsProvider: LoadpointOptions())
  var loadpoint: Int?
}

/// Loadpoint options for the picker: depends on the chosen server, lists each
/// loadpoint by name (vehicle title ?? loadpoint title), 1-based value.
struct LoadpointOptions: DynamicOptionsProvider {
  @IntentParameterDependency<LoadpointConfigurationAppIntent>(\.$server)
  var dependency

  func results() async throws -> IntentItemCollection<Int> {
    guard let server = SharedStore.server(id: dependency?.server) else {
      return IntentItemCollection(sections: [])
    }
    switch await ApiClient.fetch(server, jq: ".loadpoints", as: [Loadpoint].self) {
    case .success(let lps):
      return IntentItemCollection(sections: [
        IntentItemSection(items: lps.enumerated().map { index, lp in
          let vt = lp.vehicleTitle?.trimmingCharacters(in: .whitespaces) ?? ""
          let name = vt.isEmpty ? (lp.title ?? "Loadpoint \(index + 1)") : vt
          return IntentItem<Int>(index + 1, title: LocalizedStringResource(stringLiteral: name))
        })
      ])
    default:
      return IntentItemCollection(sections: [])
    }
  }
}

/// Interactive: force a manual data refresh of the widget.
struct ReloadIntent: AppIntent {
  static var title: LocalizedStringResource = "widget.config.title"
  init() {}
  func perform() async throws -> some IntentResult {
    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }
}

/// Interactive: sets the charge mode on the server from the widget.
struct SetModeIntent: AppIntent {
  static var title: LocalizedStringResource = "widget.config.title"

  @Parameter(title: "Server") var serverId: String
  @Parameter(title: "Loadpoint") var lp: Int
  @Parameter(title: "Mode") var mode: String

  init() {}
  init(serverId: String, lp: Int, mode: String) {
    self.serverId = serverId
    self.lp = lp
    self.mode = mode
  }

  func perform() async throws -> some IntentResult {
    if let server = SharedStore.server(id: serverId) {
      if await ApiClient.post(server, path: "/api/loadpoints/\(lp)/mode/\(mode)") {
        SharedStore.markModeChanged()  // triggers quick follow-up reloads
      }
      WidgetCenter.shared.reloadAllTimelines()  // instant: reflect the new mode
    }
    return .result()
  }
}
