import AppIntents
import SwiftUI
import WidgetKit

@main
struct EvccWatchWidgetBundle: WidgetBundle {
  var body: some Widget {
    LoadpointComplication()
  }
}

/// watchOS has no parameter editor: users pick from `recommendations()`.
struct LoadpointComplicationIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "widget.loadpoint.name"
  static var description = IntentDescription("widget.loadpoint.description")

  @Parameter(title: "widget.config.server") var server: String?
  @Parameter(title: "widget.config.loadpoint") var loadpoint: Int?

  init() {}
  init(server: String, loadpoint: Int) {
    self.server = server
    self.loadpoint = loadpoint
  }
}

enum ComplicationState {
  case loadpoint(LoadpointVM, stale: Bool)
  case unreachable
  case notConfigured
}

struct ComplicationEntry: TimelineEntry {
  let date: Date
  let state: ComplicationState
}

struct ComplicationProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> ComplicationEntry {
    ComplicationEntry(date: .now, state: .notConfigured)
  }

  func snapshot(for configuration: LoadpointComplicationIntent, in context: Context) async -> ComplicationEntry {
    await load(configuration)
  }

  func timeline(for configuration: LoadpointComplicationIntent, in context: Context) async -> Timeline<ComplicationEntry> {
    Timeline(entries: [await load(configuration)], policy: .after(.now.addingTimeInterval(15 * 60)))
  }

  // One per server × loadpoint, named by the titles the watch app last saw.
  func recommendations() -> [AppIntentRecommendation<LoadpointComplicationIntent>] {
    let servers = WatchServerStore.servers()
    return servers.flatMap { server in
      let titles = LoadpointTitles.get(server.id)
      return (titles.isEmpty ? [""] : titles).enumerated().map { index, title in
        var name = title.isEmpty ? L.t("widget.loadpoint.name") : title
        if servers.count > 1 { name += " · \(server.displayTitle)" }
        return AppIntentRecommendation(
          intent: LoadpointComplicationIntent(server: server.id, loadpoint: index + 1),
          description: name)
      }
    }
  }

  private func load(_ config: LoadpointComplicationIntent) async -> ComplicationEntry {
    let lp = config.loadpoint ?? 1
    guard let server = WatchServerStore.server(id: config.server) else {
      return ComplicationEntry(date: .now, state: .notConfigured)
    }
    let cacheKey = "complication.\(server.id).\(lp)"
    switch await ApiClient.fetch(server, jq: ".loadpoints[\(lp - 1)]", as: Loadpoint.self) {
    case .success(let l):
      UserDefaults.standard.set(try? JSONEncoder().encode(l), forKey: cacheKey)
      return ComplicationEntry(date: .now, state: .loadpoint(LoadpointVM.build(from: l), stale: false))
    case .noData, .failure:
      if let data = UserDefaults.standard.data(forKey: cacheKey),
         let l = try? JSONDecoder().decode(Loadpoint.self, from: data) {
        return ComplicationEntry(date: .now, state: .loadpoint(LoadpointVM.build(from: l), stale: true))
      }
      return ComplicationEntry(date: .now, state: .unreachable)
    }
  }
}

struct LoadpointComplication: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: "EvccLoadpointComplication", intent: LoadpointComplicationIntent.self,
                           provider: ComplicationProvider()) { entry in
      ComplicationView(entry: entry)
        .containerBackground(.fill.tertiary, for: .widget)
    }
    .configurationDisplayName(LocalizedStringResource("widget.loadpoint.name"))
    .description(LocalizedStringResource("widget.loadpoint.description"))
    .supportedFamilies([.accessoryCircular, .accessoryRectangular])
  }
}

struct ComplicationView: View {
  let entry: ComplicationEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    switch entry.state {
    case .loadpoint(let vm, let stale):
      if family == .accessoryCircular {
        circular(vm).opacity(stale ? 0.6 : 1)
      } else {
        rectangular(vm, stale: stale)
      }
    case .unreachable:
      placeholder("wifi.slash", L.t("widget.unreachable.title"))
    case .notConfigured:
      placeholder("iphone", L.t("watch.empty.title"))
    }
  }

  private func accent(_ vm: LoadpointVM) -> Color { vm.heating ? .evccOrange : .evccDarkGreen }

  private func circular(_ vm: LoadpointVM) -> some View {
    Gauge(value: vm.fill ?? 0) {
      Image(systemName: vm.heating ? "flame.fill" : "bolt.car.fill")
    } currentValueLabel: {
      Text(vm.metricValue).monospacedDigit()
    }
    .gaugeStyle(.accessoryCircularCapacity)
    .tint(vm.status.active ? accent(vm) : .bsGrayMedium)
    .widgetAccentable()
  }

  private func rectangular(_ vm: LoadpointVM, stale: Bool) -> some View {
    VStack(alignment: .leading, spacing: 1) {
      HStack(spacing: 4) {
        Image(systemName: stale ? "wifi.slash" : (vm.heating ? "flame.fill" : "bolt.car.fill"))
          .foregroundStyle(accent(vm))
          .widgetAccentable()
        Text(vm.title.isEmpty ? L.t("widget.loadpoint.name") : vm.title)
          .font(.headline)
          .lineLimit(1)
      }
      HStack(alignment: .firstTextBaseline, spacing: 2) {
        Text(vm.metricValue).font(.title3.weight(.semibold)).monospacedDigit()
        Text(vm.metricUnit).font(.caption)
        if vm.status.active {
          Text("· \(vm.power.value) \(vm.power.unit)").font(.caption).monospacedDigit()
        }
      }
      Text([vm.currentMode.map { L.t($0.labelKey) }, L.t(vm.statusKey)].compactMap { $0 }.joined(separator: " · "))
        .font(.caption)
        .foregroundStyle(.secondary)
        .lineLimit(1)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func placeholder(_ symbol: String, _ text: String) -> some View {
    VStack(spacing: 2) {
      Image(systemName: symbol)
      if family == .accessoryRectangular {
        Text(text).font(.caption).lineLimit(2)
      }
    }
  }
}
