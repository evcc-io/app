import SwiftUI
import WidgetKit

enum LoadpointState {
  case loadpoint(LoadpointVM)
  case noData
  case unreachable
  case notConfigured
}

struct LoadpointEntry: TimelineEntry {
  let date: Date
  let state: LoadpointState
  let serverId: String?
  let lp: Int
}

struct LoadpointProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> LoadpointEntry {
    LoadpointEntry(date: .now, state: .notConfigured, serverId: nil, lp: 1)
  }

  func snapshot(for configuration: LoadpointConfigurationAppIntent, in context: Context) async -> LoadpointEntry {
    await load(configuration)
  }

  func timeline(for configuration: LoadpointConfigurationAppIntent, in context: Context) async -> Timeline<LoadpointEntry> {
    // Just changed mode → refetch soon (vehicles react slowly); else every 30 min.
    let recent = (SharedStore.secondsSinceModeChange() ?? .infinity) < 90
    let next = Date().addingTimeInterval(recent ? 30 : 30 * 60)
    return Timeline(entries: [await load(configuration)], policy: .after(next))
  }

  private func load(_ config: LoadpointConfigurationAppIntent) async -> LoadpointEntry {
    let lp = config.loadpoint ?? 1
    guard let server = SharedStore.server(id: config.server) else {
      return LoadpointEntry(date: .now, state: .notConfigured, serverId: nil, lp: lp)
    }
    let state: LoadpointState
    switch await ApiClient.fetch(server, jq: ".loadpoints[\(lp - 1)]", as: Loadpoint.self) {
    case .success(let l): state = .loadpoint(LoadpointVM.build(from: l))
    case .noData: state = .noData
    case .failure: state = .unreachable
    }
    return LoadpointEntry(date: .now, state: state, serverId: server.id, lp: lp)
  }
}

struct LoadpointWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: "EvccLoadpointWidget", intent: LoadpointConfigurationAppIntent.self,
                           provider: LoadpointProvider()) { entry in
      LoadpointView(entry: entry)
    }
    .configurationDisplayName(LocalizedStringResource("widget.loadpoint.name"))
    .description(LocalizedStringResource("widget.loadpoint.description"))
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
