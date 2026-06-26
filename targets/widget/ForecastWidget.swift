import SwiftUI
import WidgetKit

enum WidgetState {
  case solar(SolarVM)
  case series(SeriesVM, ForecastDataType)  // price / co2 / feedin
  case noData(ForecastDataType)
  case unreachable(ForecastDataType)
  case notConfigured
}

struct ForecastEntry: TimelineEntry {
  let date: Date
  let state: WidgetState
  let serverId: String?  // for the deep link, so tapping switches the app's server
}

private func nextReload() -> Date {
  Calendar.current.date(byAdding: .minute, value: 60, to: .now) ?? .now.addingTimeInterval(3600)
}

private func singleTimeline(_ entry: ForecastEntry) -> Timeline<ForecastEntry> {
  Timeline(entries: [entry], policy: .after(nextReload()))
}

// MARK: - Solar provider (has the "adjust to real production" toggle)

struct SolarProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> ForecastEntry {
    ForecastEntry(date: .now, state: .notConfigured, serverId: nil)
  }

  func snapshot(for configuration: SolarConfigurationAppIntent, in context: Context) async -> ForecastEntry {
    await load(configuration)
  }

  func timeline(for configuration: SolarConfigurationAppIntent, in context: Context) async -> Timeline<ForecastEntry> {
    singleTimeline(await load(configuration))
  }

  private func load(_ config: SolarConfigurationAppIntent) async -> ForecastEntry {
    guard let server = SharedStore.server(id: config.server) else {
      return ForecastEntry(date: .now, state: .notConfigured, serverId: nil)
    }
    let state: WidgetState
    switch await ApiClient.fetch(server, jq: ".forecast.solar", as: SolarForecast.self) {
    case .success(let f):
      state = SolarVM.build(solar: f, adjust: config.adjust).map(WidgetState.solar) ?? .noData(.solar)
    case .noData: state = .noData(.solar)
    case .failure: state = .unreachable(.solar)
    }
    return ForecastEntry(date: .now, state: state, serverId: server.id)
  }
}

// MARK: - Price / CO₂ / feed-in provider

struct ForecastProvider: AppIntentTimelineProvider {
  let dataType: ForecastDataType

  func placeholder(in context: Context) -> ForecastEntry {
    ForecastEntry(date: .now, state: .notConfigured, serverId: nil)
  }

  func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> ForecastEntry {
    await load(configuration)
  }

  func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<ForecastEntry> {
    singleTimeline(await load(configuration))
  }

  private func load(_ config: ConfigurationAppIntent) async -> ForecastEntry {
    guard let server = SharedStore.server(id: config.server) else {
      return ForecastEntry(date: .now, state: .notConfigured, serverId: nil)
    }
    let state: WidgetState
    switch dataType {
    case .price: state = await priceSeries(server, slotsJq: ".forecast.grid", type: .price)
    case .feedin: state = await priceSeries(server, slotsJq: ".forecast.feedin", type: .feedin)
    case .co2: state = await co2Series(server)
    case .solar: state = .noData(.solar)  // solar has its own provider
    }
    return ForecastEntry(date: .now, state: state, serverId: server.id)
  }

  // price + feed-in carry the site currency so evcc's price rules apply
  private func priceSeries(_ server: StoredServer, slotsJq: String, type: ForecastDataType) async -> WidgetState {
    switch await ApiClient.fetch(server, jq: "{currency:.currency,slots:\(slotsJq)}", as: SeriesPayload.self) {
    case .success(let p):
      guard let slots = p.slots else { return .noData(type) }
      return SeriesVM.build(from: slots, currency: p.currency ?? "EUR")
        .map { WidgetState.series($0, type) } ?? .noData(type)
    case .noData: return .noData(type)
    case .failure: return .unreachable(type)
    }
  }

  private func co2Series(_ server: StoredServer) async -> WidgetState {
    switch await ApiClient.fetch(server, jq: ".forecast.co2", as: [ForecastSlot].self) {
    case .success(let slots):
      return SeriesVM.build(from: slots, currency: nil).map { WidgetState.series($0, .co2) } ?? .noData(.co2)
    case .noData: return .noData(.co2)
    case .failure: return .unreachable(.co2)
    }
  }
}

// MARK: - Four dedicated widgets (one per data type)

struct SolarWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: "EvccSolarWidget", intent: SolarConfigurationAppIntent.self,
                           provider: SolarProvider()) { entry in
      ForecastWidgetView(entry: entry)
    }
    .configurationDisplayName(LocalizedStringResource("widget.name.solar"))
    .description(LocalizedStringResource("widget.description.solar"))
    .supportedFamilies([.systemMedium])
  }
}

struct PriceWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: "EvccPriceWidget", intent: ConfigurationAppIntent.self,
                           provider: ForecastProvider(dataType: .price)) { entry in
      ForecastWidgetView(entry: entry)
    }
    .configurationDisplayName(LocalizedStringResource("widget.name.price"))
    .description(LocalizedStringResource("widget.description.price"))
    .supportedFamilies([.systemMedium])
  }
}

struct Co2Widget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: "EvccCo2Widget", intent: ConfigurationAppIntent.self,
                           provider: ForecastProvider(dataType: .co2)) { entry in
      ForecastWidgetView(entry: entry)
    }
    .configurationDisplayName(LocalizedStringResource("widget.name.co2"))
    .description(LocalizedStringResource("widget.description.co2"))
    .supportedFamilies([.systemMedium])
  }
}

struct FeedinWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: "EvccFeedinWidget", intent: ConfigurationAppIntent.self,
                           provider: ForecastProvider(dataType: .feedin)) { entry in
      ForecastWidgetView(entry: entry)
    }
    .configurationDisplayName(LocalizedStringResource("widget.name.feedin"))
    .description(LocalizedStringResource("widget.description.feedin"))
    .supportedFamilies([.systemMedium])
  }
}
